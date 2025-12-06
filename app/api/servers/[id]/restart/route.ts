/**
 * Server Auto-Restart Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  scheduleServerRestart,
  getServerRestartSchedule,
  cancelServerRestart,
  triggerServerRestart,
} from '@/lib/ark-restart-scheduler';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, schedule, preWarningMinutes, gracefulShutdownSeconds } =
      await request.json();

    // Verify server ownership
    const server = await prisma.server.findUnique({
      where: { id: params.id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Handle actions
    switch (action) {
      case 'schedule': {
        if (!schedule) {
          return NextResponse.json(
            { error: 'Schedule (cron) required' },
            { status: 400 }
          );
        }

        const result = await scheduleServerRestart({
          serverId: params.id,
          schedule,
          preWarningMinutes: preWarningMinutes || 5,
          gracefulShutdownSeconds: gracefulShutdownSeconds || 30,
          enabled: true,
        });

        // Save to database
        await prisma.server.update({
          where: { id: params.id },
          data: {
            configuration: {
              ...(server.configuration as any),
              restartSchedule: schedule,
              preWarningMinutes,
              gracefulShutdownSeconds,
            },
          },
        });

        logger.info('Restart schedule updated', {
          serverId: params.id,
          schedule,
        });

        return NextResponse.json(result);
      }

      case 'cancel': {
        const result = await cancelServerRestart(params.id);

        await prisma.server.update({
          where: { id: params.id },
          data: {
            configuration: {
              ...(server.configuration as any),
              restartSchedule: null,
            },
          },
        });

        return NextResponse.json(result);
      }

      case 'trigger': {
        const result = await triggerServerRestart(params.id);
        logger.info('Manual restart triggered', { serverId: params.id });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('Restart schedule operation failed', error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get restart schedule
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

    const server = await prisma.server.findUnique({
      where: { id: params.id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const config = server.configuration as any;
    const schedule = await getServerRestartSchedule(params.id);

    return NextResponse.json({
      ...schedule,
      schedule: config?.restartSchedule,
      preWarningMinutes: config?.preWarningMinutes || 5,
      gracefulShutdownSeconds: config?.gracefulShutdownSeconds || 30,
      lastRestart: new Date(), // TODO: retrieve from database if available
    });
  } catch (error: any) {
    logger.error('Get restart schedule failed', error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to get schedule' },
      { status: 500 }
    );
  }
}
