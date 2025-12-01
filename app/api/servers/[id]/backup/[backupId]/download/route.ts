import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadBackup, listBackups } from '@/lib/backup-storage';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { logger } from '@/lib/logger';

// GET - Backup letöltése (felhasználói)
export async function GET(
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

    // Csak a szerver tulajdonosa töltheti le a backupot
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

    // Backup letöltése ideiglenes fájlba
    const tempPath = join(tmpdir(), `backup-${backupId}-${Date.now()}.tar.gz`);
    const downloadResult = await downloadBackup(id, backup.path, tempPath);

    if (!downloadResult.success) {
      return NextResponse.json(
        { error: downloadResult.error || 'Hiba történt a backup letöltése során' },
        { status: 500 }
      );
    }

    // Fájl olvasása és válasz küldése
    if (!existsSync(tempPath)) {
      return NextResponse.json(
        { error: 'Backup fájl nem található' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(tempPath);

    // Ideiglenes fájl törlése
    await unlink(tempPath).catch(() => {
      // Ignore delete errors
    });

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${backup.name}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    logger.error('Download backup error', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a backup letöltése során' },
      { status: 500 }
    );
  }
}

