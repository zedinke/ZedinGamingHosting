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

    // Backupok lekérdezése SSH-n keresztül
    const { listBackups } = await import('@/lib/backup-storage');
    const backupsData = await listBackups(id);
    
    // Formázás az API válaszhoz
    const backups = backupsData.map((backup) => ({
      id: backup.name,
      name: backup.name,
      size: backup.size,
      createdAt: backup.createdAt.toISOString(),
      type: backup.type,
    }));

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

    // Backup készítése SSH-n keresztül
    const { createServerBackup } = await import('@/lib/backup-storage');
    const backupResult = await createServerBackup(id, name);

    if (!backupResult.success) {
      return NextResponse.json(
        { error: backupResult.error || 'Hiba történt a backup készítése során' },
        { status: 500 }
      );
    }

    // Task létrehozása a backup naplózásához
    const task = await prisma.task.create({
      data: {
        agentId: server.agent.id,
        serverId: server.id,
        type: 'BACKUP',
        status: 'COMPLETED',
        command: {
          action: 'backup',
          name: name || `backup-${Date.now()}`,
          type,
        },
        result: {
          backupPath: backupResult.backupPath,
        },
        completedAt: new Date(),
      },
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

