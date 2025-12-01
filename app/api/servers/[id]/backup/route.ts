import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET - Backupok listája felhasználói jogosultsággal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        backupCountLimit: true,
        backupStorageLimitGB: true,
        backupCountUsed: true,
        backupStorageUsedGB: true,
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

    // Csak a szerver tulajdonosa férhet hozzá
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerver nincs hozzárendelve egy géphez' },
        { status: 404 }
      );
    }

    // Backupok lekérdezése
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

    // Limit információk
    const limits = {
      backupCountLimit: server.backupCountLimit || 5,
      backupStorageLimitGB: server.backupStorageLimitGB || 5.0,
      backupCountUsed: backups.length, // Számoljuk a tényleges backup számát
      backupStorageUsedGB:
        backups.reduce((sum, b) => sum + b.size, 0) / (1024 * 1024 * 1024), // GB-ban
    };

    // Limit frissítése az adatbázisban
    await prisma.server.update({
      where: { id },
      data: {
        backupCountUsed: limits.backupCountUsed,
        backupStorageUsedGB: limits.backupStorageUsedGB,
      },
    });

    return NextResponse.json({
      backups,
      limits,
      server: {
        id: server.id,
        name: server.name || '',
      },
    });
  } catch (error) {
    logger.error('Backups list error', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a backupok lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * POST - Backup létrehozása felhasználói jogosultsággal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = await Promise.resolve(params);
    const userId = (session.user as any).id;
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

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Csak a szerver tulajdonosa hozhat létre backupot
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerver vagy agent nem található' },
        { status: 404 }
      );
    }

    // Limit ellenőrzés
    const currentBackups = await import('@/lib/backup-storage').then((m) => m.listBackups(id));
    const backupCountUsed = currentBackups.length;
    const backupStorageUsedGB =
      currentBackups.reduce((sum, b) => sum + b.size, 0) / (1024 * 1024 * 1024);

    const backupCountLimit = server.backupCountLimit || 5;
    const backupStorageLimitGB = server.backupStorageLimitGB || 5.0;

    if (backupCountUsed >= backupCountLimit) {
      return NextResponse.json(
        {
          error: `Elérted a maximális backup számot (${backupCountLimit} db). Bővítsd a backup csomagodat!`,
        },
        { status: 400 }
      );
    }

    // Backup készítése
    const { createServerBackup } = await import('@/lib/backup-storage');
    const backupResult = await createServerBackup(id, name);

    if (!backupResult.success) {
      return NextResponse.json(
        { error: backupResult.error || 'Hiba történt a backup készítése során' },
        { status: 500 }
      );
    }

    // Limit frissítése
    const newBackups = await import('@/lib/backup-storage').then((m) => m.listBackups(id));
    await prisma.server.update({
      where: { id },
      data: {
        backupCountUsed: newBackups.length,
        backupStorageUsedGB:
          newBackups.reduce((sum, b) => sum + b.size, 0) / (1024 * 1024 * 1024),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Backup létrehozása elindítva',
    });
  } catch (error) {
    logger.error('Backup create error', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a backup létrehozása során' },
      { status: 500 }
    );
  }
}

