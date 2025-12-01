import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET - Backup limit információk lekérdezése
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

    // Tényleges backup szám és méret számítása
    const { listBackups } = await import('@/lib/backup-storage');
    const backups = await listBackups(id);
    const actualCount = backups.length;
    const actualStorageGB = backups.reduce((sum, b) => sum + b.size, 0) / (1024 * 1024 * 1024);

    // Frissítés az adatbázisban
    await prisma.server.update({
      where: { id },
      data: {
        backupCountUsed: actualCount,
        backupStorageUsedGB: actualStorageGB,
      },
    });

    const limits = {
      backupCountLimit: server.backupCountLimit || 5,
      backupStorageLimitGB: server.backupStorageLimitGB || 5.0,
      backupCountUsed: actualCount,
      backupStorageUsedGB: actualStorageGB,
    };

    return NextResponse.json({
      success: true,
      limits,
    });
  } catch (error) {
    logger.error('Backup limits error', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a backup limit információk lekérdezése során' },
      { status: 500 }
    );
  }
}

