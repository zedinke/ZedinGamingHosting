import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { copyFileViaSSH, executeSSHCommand } from '@/lib/ssh-client';
import { listBackups } from '@/lib/backup-storage';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { logger } from '@/lib/logger';

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

    // Csak a szerver tulajdonosa tölthet fel backupot
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

    // FormData feldolgozása
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const backupName = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Fájl megadása kötelező' },
        { status: 400 }
      );
    }

    // Limit ellenőrzés
    const currentBackups = await listBackups(id);
    const backupCountUsed = currentBackups.length;
    const backupStorageUsedGB =
      currentBackups.reduce((sum, b) => sum + b.size, 0) / (1024 * 1024 * 1024);

    const backupCountLimit = server.backupCountLimit || 5;
    const backupStorageLimitGB = server.backupStorageLimitGB || 5.0;

    // Fájlméret ellenőrzés (GB-ban)
    const fileSizeGB = file.size / (1024 * 1024 * 1024);
    const availableStorageGB = backupStorageLimitGB - backupStorageUsedGB;

    if (fileSizeGB > availableStorageGB) {
      return NextResponse.json(
        {
          error: `Nincs elég tárhely! Szabad tárhely: ${availableStorageGB.toFixed(2)} GB, fájl méret: ${fileSizeGB.toFixed(2)} GB`,
        },
        { status: 400 }
      );
    }

    if (backupCountUsed >= backupCountLimit) {
      return NextResponse.json(
        {
          error: `Elérted a maximális backup számot (${backupCountLimit} db). Bővítsd a backup csomagodat!`,
        },
        { status: 400 }
      );
    }

    // Fájl mentése ideiglenes helyre
    const tempPath = join(tmpdir(), `backup-upload-${Date.now()}-${file.name}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempPath, buffer);

    try {
      const machine = server.agent.machine;
      const finalBackupName = backupName || `uploaded-${Date.now()}.tar.gz`;
      const backupPath = `/opt/backups/${id}/${finalBackupName}`;

      // Backup könyvtár létrehozása
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `mkdir -p /opt/backups/${id}`
      );

      // Fájl feltöltése SSH-n keresztül
      const uploadResult = await copyFileViaSSH(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        tempPath,
        backupPath
      );

      if (uploadResult.exitCode !== 0) {
        return NextResponse.json(
          {
            error: uploadResult.stderr || 'Hiba történt a backup feltöltése során',
          },
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
        message: 'Backup sikeresen feltöltve',
      });
    } finally {
      // Ideiglenes fájl törlése
      await unlink(tempPath).catch(() => {
        // Ignore delete errors
      });
    }
  } catch (error: any) {
    logger.error('Backup upload error', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a backup feltöltése során' },
      { status: 500 }
    );
  }
}

