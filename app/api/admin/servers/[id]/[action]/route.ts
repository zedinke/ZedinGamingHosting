import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, ServerStatus } from '@prisma/client';
import { createAuditLog, AuditAction } from '@/lib/audit-log';
import { sendWebhookEvent } from '@/lib/webhook-sender';
import { handleApiError, AppError, ErrorCodes, createForbiddenError, createNotFoundError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';
import { createNotification } from '@/lib/notifications';
import { sendServerStatusChangeNotification } from '@/lib/push-notifications';
import { configureFirewallPorts } from '@/lib/game-server-installer';
import { ALL_GAME_SERVER_CONFIGS } from '@/lib/game-server-configs';

export const POST = withPerformanceMonitoring(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string; action: string }> | { id: string; action: string } }
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createForbiddenError('Nincs jogosultság');
      }

      // Resolve params if it's a Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id, action } = resolvedParams;

      logger.info('Server action request', {
        serverId: id,
        action: action,
        adminId: (session.user as any).id,
      });

    // Szerver keresése
    const server = await prisma.server.findUnique({
      where: { id },
    });

      if (!server) {
        throw createNotFoundError('Szerver', id);
      }

    let newStatus: ServerStatus;
    let taskType: 'START' | 'STOP' | 'RESTART';

      // Művelet végrehajtása
      switch (action) {
        case 'start':
          if (server.status === 'ONLINE' || server.status === 'STARTING') {
            throw new AppError(
              ErrorCodes.VALIDATION_ERROR,
              'A szerver már fut vagy indítás alatt van',
              400
            );
          }
          newStatus = 'STARTING';
          taskType = 'START';
          break;

        case 'stop':
          if (server.status === 'OFFLINE' || server.status === 'STOPPING') {
            throw new AppError(
              ErrorCodes.VALIDATION_ERROR,
              'A szerver már le van állítva vagy leállítás alatt van',
              400
            );
          }
          newStatus = 'STOPPING';
          taskType = 'STOP';
          break;

        case 'restart':
          if (server.status !== 'ONLINE') {
            throw new AppError(
              ErrorCodes.VALIDATION_ERROR,
              'Csak online szerver indítható újra',
              400
            );
          }
          newStatus = 'RESTARTING';
          taskType = 'RESTART';
          break;

        case 'configure-firewall':
          // Tűzfal portok engedélyezése meglévő szerverhez
          if (!server.machineId) {
            throw new AppError(
              ErrorCodes.VALIDATION_ERROR,
              'A szervernek nincs hozzárendelt gépe',
              400
            );
          }

          const machine = await prisma.serverMachine.findUnique({
            where: { id: server.machineId },
          });

          if (!machine) {
            throw new AppError(
              ErrorCodes.NOT_FOUND,
              'A szerver gépe nem található',
              404
            );
          }

          const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];
          if (!gameConfig) {
            throw new AppError(
              ErrorCodes.VALIDATION_ERROR,
              'Játék konfiguráció nem található',
              400
            );
          }

          await configureFirewallPorts(
            server.id,
            server.gameType,
            { port: server.port || gameConfig.ports?.game || 27015 },
            machine,
            gameConfig,
            false
          );

          await createAuditLog({
            userId: (session.user as any).id,
            action: AuditAction.UPDATE,
            resourceType: 'Server',
            resourceId: server.id,
            details: {
              action: 'configure-firewall',
              gameType: server.gameType,
              port: server.port,
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
          });

          return NextResponse.json({
            success: true,
            message: 'Tűzfal portok sikeresen engedélyezve',
          });

        default:
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR,
            'Érvénytelen művelet',
            400
          );
      }

      // Státusz frissítése
      const updatedServer = await prisma.server.update({
        where: { id },
        data: { status: newStatus },
      });

      // Task létrehozása a művelethez
      if (!server.agentId) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'A szervernek nincs hozzárendelt agent - telepítés szükséges',
          400
        );
      }

      const task = await prisma.task.create({
        data: {
          agentId: server.agentId,
          serverId: server.id,
          type: taskType,
          status: 'PENDING',
          command: {
            action,
            serverId: server.id,
          },
        },
      });

      // Task végrehajtása háttérben
      const { executeTask } = await import('@/lib/task-executor');
      executeTask(task.id).catch((error) => {
        logger.error(`Task ${task.id} végrehajtási hiba`, error as Error, {
          taskId: task.id,
          serverId: server.id,
        });
      });

      // Audit log
      const auditAction =
        action === 'start'
          ? AuditAction.SERVER_START
          : action === 'stop'
          ? AuditAction.SERVER_STOP
          : AuditAction.SERVER_RESTART;

      await createAuditLog({
        userId: (session.user as any).id,
        action: auditAction,
        resourceType: 'Server',
        resourceId: server.id,
        details: {
          serverName: server.name,
          oldStatus: server.status,
          newStatus: newStatus,
          action,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      // Értesítés létrehozása adatbázisban
      createNotification(
        server.userId,
        'SERVER_STATUS_CHANGE',
        'Szerver állapot változás',
        `${server.name} állapota megváltozott: ${server.status} → ${newStatus}`,
        'medium',
        { serverId: server.id, oldStatus: server.status, newStatus, action }
      ).catch((error) => {
        logger.error('Create notification error', error as Error, {
          serverId: server.id,
        });
      });

      // Push notification küldése
      sendServerStatusChangeNotification(
        server.userId,
        server.name,
        server.status,
        newStatus,
        server.id
      ).catch((error) => {
        logger.error('Push notification error', error as Error, {
          serverId: server.id,
        });
      });

      // Webhook esemény küldése
      sendWebhookEvent('server_status_change', {
        serverId: server.id,
        serverName: server.name,
        oldStatus: server.status,
        newStatus: newStatus,
        action,
      }).catch((error) => {
        logger.error('Webhook send error', error as Error, {
          serverId: server.id,
          event: 'server_status_change',
        });
      });

      logger.info('Server action completed', {
        serverId: server.id,
        action,
        newStatus,
      });

      return NextResponse.json({
        success: true,
        status: newStatus,
        message: `Szerver ${action} művelet elindítva`,
      });
    } catch (error) {
      const resolvedParams = params instanceof Promise ? await params : params;
      logger.error('Server action error', error as Error, {
        serverId: resolvedParams.id,
        action: resolvedParams.action,
      });
      return handleApiError(error);
    }
  },
  '/api/admin/servers/[id]/[action]',
  'POST'
);

