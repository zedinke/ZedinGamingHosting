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

export const POST = withPerformanceMonitoring(
  async (
    request: NextRequest,
    { params }: { params: { id: string; action: string } }
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createForbiddenError('Nincs jogosultság');
      }

      logger.info('Server action request', {
        serverId: params.id,
        action: params.action,
        adminId: (session.user as any).id,
      });

    const { id, action } = params;

    // Szerver keresése
    const server = await prisma.server.findUnique({
      where: { id },
    });

      if (!server) {
        throw createNotFoundError('Szerver', params.id);
      }

    let newStatus: ServerStatus;
    let taskType: 'START' | 'STOP' | 'RESTART';

    // Művelet végrehajtása
    switch (action) {
      case 'start':
        if (server.status === 'ONLINE' || server.status === 'STARTING') {
          return NextResponse.json(
            { error: 'A szerver már fut vagy indítás alatt van' },
            { status: 400 }
          );
        }
        newStatus = 'STARTING';
        taskType = 'START';
        break;

      case 'stop':
        if (server.status === 'OFFLINE' || server.status === 'STOPPING') {
          return NextResponse.json(
            { error: 'A szerver már le van állítva vagy leállítás alatt van' },
            { status: 400 }
          );
        }
        newStatus = 'STOPPING';
        taskType = 'STOP';
        break;

      case 'restart':
        if (server.status !== 'ONLINE') {
          return NextResponse.json(
            { error: 'Csak online szerver indítható újra' },
            { status: 400 }
          );
        }
        newStatus = 'RESTARTING';
        taskType = 'RESTART';
        break;

      default:
        return NextResponse.json(
          { error: 'Érvénytelen művelet' },
          { status: 400 }
        );
    }

    // Státusz frissítése
    const updatedServer = await prisma.server.update({
      where: { id },
      data: { status: newStatus },
    });

    // Task létrehozása a művelethez
    if (server.agentId) {
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
    }

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

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Szerver ${action} művelet elindítva`,
    });
    } catch (error) {
      logger.error('Server action error', error as Error, {
        serverId: params.id,
        action: params.action,
      });
      return handleApiError(error);
    }
  },
  '/api/admin/servers/[id]/[action]',
  'POST'
);

