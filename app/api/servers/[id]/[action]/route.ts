import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ServerStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> | { id: string; action: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    // Resolve params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id, action } = resolvedParams;

    // Szerver keresése
    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    let newStatus: ServerStatus;

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
        break;

      case 'stop':
        if (server.status === 'OFFLINE' || server.status === 'STOPPING') {
          return NextResponse.json(
            { error: 'A szerver már le van állítva vagy leállítás alatt van' },
            { status: 400 }
          );
        }
        newStatus = 'STOPPING';
        break;

      case 'restart':
        if (server.status !== 'ONLINE') {
          return NextResponse.json(
            { error: 'Csak online szerver indítható újra' },
            { status: 400 }
          );
        }
        newStatus = 'RESTARTING';
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
    let taskType: 'START' | 'STOP' | 'RESTART';
    switch (action) {
      case 'start':
        taskType = 'START';
        break;
      case 'stop':
        taskType = 'STOP';
        break;
      case 'restart':
        taskType = 'RESTART';
        break;
      default:
        taskType = 'START';
    }

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

    logger.info('Server action completed', {
      serverId: server.id,
      action,
      newStatus,
      userId: (session.user as any).id,
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Szerver ${action} művelet elindítva`,
    });
  } catch (error) {
    logger.error('Server action error', error as Error, {
      serverId: params instanceof Promise ? 'unknown' : params.id,
      action: params instanceof Promise ? 'unknown' : params.action,
    });
    return NextResponse.json(
      { error: 'Hiba történt a művelet végrehajtása során' },
      { status: 500 }
    );
  }
}

