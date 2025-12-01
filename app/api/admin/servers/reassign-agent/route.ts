import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, AppError, ErrorCodes, createForbiddenError, createNotFoundError, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';
import { createAuditLog, AuditAction } from '@/lib/audit-log';

export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createForbiddenError('Nincs jogosultság');
      }

      const body = await request.json();
      const { serverId, newAgentId, machineId } = body;

      if (!serverId) {
        throw createValidationError('form', 'Szerver ID megadása kötelező');
      }

      if (!newAgentId) {
        throw createValidationError('form', 'Új agent ID megadása kötelező');
      }

      if (!machineId) {
        throw createValidationError('form', 'Gép ID megadása kötelező');
      }

      // Szerver keresése
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          agent: true,
          machine: true,
        },
      });

      if (!server) {
        throw createNotFoundError('Szerver', serverId);
      }

      // Agent keresése - csak ha newAgentId nem null
      const agent = await prisma.agent.findFirst({
        where: {
          id: newAgentId,
          machineId: machineId,
        },
      });

      if (!agent) {
        throw createNotFoundError('Agent', newAgentId);
      }

      // Szerver frissítése új agent-tel
      const updatedServer = await prisma.server.update({
        where: { id: serverId },
        data: {
          agentId: newAgentId,
          machineId: machineId,
        },
      });

      // Audit log
      await createAuditLog({
        userId: (session.user as any).id,
        action: AuditAction.UPDATE,
        resourceType: 'Server',
        resourceId: serverId,
        details: {
          action: 'reassign-agent',
          oldAgentId: server.agentId,
          newAgentId: newAgentId,
          machineId: machineId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      logger.info('Server agent reassigned', {
        serverId: serverId,
        oldAgentId: server.agentId,
        newAgentId: newAgentId,
        machineId: machineId,
      });

      return NextResponse.json({
        success: true,
        message: 'Agent sikeresen újra hozzárendelve',
        server: updatedServer,
      });
    } catch (error) {
      logger.error('Reassign agent error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/admin/servers/reassign-agent',
  'POST'
);
