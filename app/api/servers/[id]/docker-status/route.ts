/**
 * Real-time Docker Status API for ARK Game Servers
 * GET /api/servers/[id]/docker-status
 * 
 * Returns live Docker container metrics for game servers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET - Get real-time Docker container status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverId = params.id;

    // Verify server exists and user owns it
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Only Docker-based servers (ARK) have Docker status
    if (!server.gameType?.includes('ARK')) {
      return NextResponse.json(
        {
          error: 'This server type does not support Docker status monitoring',
          gameType: server.gameType,
        },
        { status: 400 }
      );
    }

    // Get Docker status from ArkDockerInstaller
    try {
      // const { ArkDockerInstaller } = await import('@/lib/games/ark-docker/installer');
      // const baseDir = `/opt/ark-docker-${serverId}`;
      // const installer = new ArkDockerInstaller(baseDir);
      // const status = await installer.getStatus(serverId);
      
      // Temporarily return mock status
      const status = {
        isRunning: false,
        containerStatus: 'not available',
        uptime: 0,
        containerId: 'N/A',
        memory: 0,
        cpu: 0,
        lastUpdate: new Date(),
        status: 'not available' as const,
      };

      // Calculate additional metrics
      const upSince = status.uptime ? new Date(Date.now() - status.uptime * 1000) : null;

      return NextResponse.json({
        success: true,
        docker: {
          status: status.status,
          containerId: status.containerId,
          uptime: status.uptime,
          upSince,
          memory: {
            usageMB: status.memory,
          },
          cpu: {
            usagePercent: status.cpu,
          },
          lastUpdate: status.lastUpdate,
          healthy: false, // Mock: always unhealthy when not available
        },
        server: {
          id: serverId,
          name: server.name,
          gameType: server.gameType,
          status: server.status,
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Docker status check failed', error as Error, {
        serverId,
        gameType: server.gameType,
      });

      // If Docker installer fails, try to get status from database
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve Docker status',
          server: {
            id: serverId,
            name: server.name,
            gameType: server.gameType,
            status: server.status,
          },
          timestamp: new Date(),
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    logger.error('Docker status API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
