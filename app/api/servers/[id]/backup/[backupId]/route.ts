import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteBackup, listBackups } from '@/lib/backup-storage';
import { logger } from '@/lib/logger';

// DELETE - Backup törlése (felhasználói)
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; backupId: string }> | { id: string; backupId: string };
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id, backupId } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Csak a szerver tulajdonosa törölhet backupot
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Backup keresése
    const backups = await listBackups(id);
    const backup = backups.find((b) => b.name === backupId);

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup nem található' },
        { status: 404 }
      );
    }

    // Backup törlése
    const result = await deleteBackup(id, backup.path);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a backup törlése során' },
        { status: 500 }
      );
    }

    // Limit frissítése
    const newBackups = await listBackups(id);
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
      message: 'Backup sikeresen törölve',
    });
  } catch (error) {
    logger.error('Delete backup error', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a backup törlése során' },
      { status: 500 }
    );
  }
}

