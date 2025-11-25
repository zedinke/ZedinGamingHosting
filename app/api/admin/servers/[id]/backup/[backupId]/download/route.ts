import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { downloadBackup, listBackups } from '@/lib/backup-storage';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

// GET - Backup letöltése
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; backupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id, backupId } = params;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
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
    console.error('Download backup error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a backup letöltése során' },
      { status: 500 }
    );
  }
}

