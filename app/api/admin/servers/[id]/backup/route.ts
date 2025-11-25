import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Backupok listája
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // TODO: Valós implementációban itt kellene lekérdezni a backupokat
    // Jelenleg csak egy mock választ adunk vissza
    const backups = [
      {
        id: 'backup-1',
        name: 'backup-2024-01-15-10-30-00.tar.gz',
        size: 1024 * 1024 * 500, // 500 MB
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'manual',
      },
      {
        id: 'backup-2',
        name: 'backup-2024-01-14-10-30-00.tar.gz',
        size: 1024 * 1024 * 480,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        type: 'automatic',
      },
    ];

    return NextResponse.json({
      backups,
      server: {
        id: server.id,
        name: server.name,
      },
    });
  } catch (error) {
    console.error('Backups list error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a backupok lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Backup létrehozása
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, type = 'manual' } = body;

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent) {
      return NextResponse.json(
        { error: 'Szerver vagy agent nem található' },
        { status: 404 }
      );
    }

    // Task létrehozása a backup-hoz
    const task = await prisma.task.create({
      data: {
        agentId: server.agent.id,
        serverId: server.id,
        type: 'BACKUP',
        status: 'PENDING',
        command: {
          action: 'backup',
          name: name || `backup-${Date.now()}`,
          type,
        },
      },
    });

    // Task végrehajtása háttérben
    const { executeTask } = await import('@/lib/task-executor');
    executeTask(task.id).catch((error) => {
      console.error(`Backup task ${task.id} végrehajtási hiba:`, error);
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      message: 'Backup létrehozása elindítva',
    });
  } catch (error) {
    console.error('Backup create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a backup létrehozása során' },
      { status: 500 }
    );
  }
}

