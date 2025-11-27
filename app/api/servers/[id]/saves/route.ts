import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import { Readable } from 'stream';

// GET - Mentési fájlok listázása
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { id } = params;
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

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    if (!server.agent?.machine) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt gép' },
        { status: 400 }
      );
    }

    // The Forest mentési könyvtár útvonala
    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    const savesPath = `${serverPath}/savefilesserver`;

    // Fájlok listázása SSH-n keresztül
    const listCommand = `find "${savesPath}" -type f -exec ls -lh {} \\; 2>/dev/null | awk '{print $9"|"$5"|"$6" "$7" "$8}' || echo ""`;
    
    const sshResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      listCommand
    );

    const files: Array<{
      name: string;
      path: string;
      size: number;
      modified: string;
    }> = [];

    if (sshResult.exitCode === 0 && sshResult.stdout.trim()) {
      sshResult.stdout
        .split('\n')
        .filter((line) => line.trim())
        .forEach((line) => {
          const [path, size, date] = line.split('|');
          if (path && path.trim()) {
            const fileName = path.split('/').pop() || path;
            files.push({
              name: fileName,
              path: path.replace(serverPath, ''),
              size: parseSize(size?.trim() || '0'),
              modified: parseDate(date?.trim() || ''),
            });
          }
        });
    }

    return NextResponse.json({
      success: true,
      files,
      savesPath,
    });
  } catch (error) {
    logger.error('Get saves error', error as Error, {
      serverId: params.id,
    });
    return NextResponse.json(
      { error: 'Hiba történt a mentési fájlok lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Backup, Download, Upload műveletek
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const body = await request.json();
    const { action, fileName } = body;

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

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    if (!server.agent?.machine) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt gép' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    const savesPath = `${serverPath}/savefilesserver`;
    const backupsPath = `${serverPath}/backups`;

    switch (action) {
      case 'backup':
        // Backup létrehozása (tar.gz)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `backup-${timestamp}.tar.gz`;
        const backupPath = `${backupsPath}/${backupFileName}`;

        // Backup könyvtár létrehozása
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `mkdir -p "${backupsPath}"`
        );

        // Tar.gz létrehozása
        const backupCommand = `cd "${serverPath}" && tar -czf "${backupPath}" savefilesserver/ 2>&1`;
        const backupResult = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          backupCommand
        );

        if (backupResult.exitCode !== 0) {
          return NextResponse.json(
            { error: `Backup hiba: ${backupResult.stderr}` },
            { status: 500 }
          );
        }

        logger.info('Backup created', {
          serverId: id,
          backupPath,
        });

        return NextResponse.json({
          success: true,
          message: 'Backup sikeresen létrehozva',
          backupFileName,
        });

      case 'download':
        // Fájl letöltése (base64 encode-olva)
        if (!fileName) {
          return NextResponse.json(
            { error: 'fileName szükséges' },
            { status: 400 }
          );
        }

        const filePath = `${savesPath}/${fileName}`;
        const downloadCommand = `base64 -w 0 "${filePath}" 2>/dev/null || base64 "${filePath}" 2>/dev/null`;
        const downloadResult = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          downloadCommand
        );

        if (downloadResult.exitCode !== 0) {
          return NextResponse.json(
            { error: `Letöltési hiba: ${downloadResult.stderr}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          fileName,
          content: downloadResult.stdout,
        });

      case 'upload':
        // Fájl feltöltése
        const { fileContent, targetFileName } = body;
        if (!fileContent || !targetFileName) {
          return NextResponse.json(
            { error: 'fileContent és targetFileName szükséges' },
            { status: 400 }
          );
        }

        // Base64 decode és fájl írása
        const uploadCommand = `echo "${fileContent}" | base64 -d > "${savesPath}/${targetFileName}" && chmod 644 "${savesPath}/${targetFileName}"`;
        const uploadResult = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          uploadCommand
        );

        if (uploadResult.exitCode !== 0) {
          return NextResponse.json(
            { error: `Feltöltési hiba: ${uploadResult.stderr}` },
            { status: 500 }
          );
        }

        logger.info('File uploaded', {
          serverId: id,
          fileName: targetFileName,
        });

        return NextResponse.json({
          success: true,
          message: 'Fájl sikeresen feltöltve',
          fileName: targetFileName,
        });

      default:
        return NextResponse.json(
          { error: 'Érvénytelen művelet' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Saves operation error', error as Error, {
      serverId: params.id,
    });
    return NextResponse.json(
      { error: 'Hiba történt a művelet végrehajtása során' },
      { status: 500 }
    );
  }
}

function parseSize(size: string): number {
  if (!size) return 0;
  const units: Record<string, number> = {
    B: 1,
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
  };
  const match = size.match(/^(\d+\.?\d*)([KMGT]?)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase() || 'B';
  return Math.round(value * (units[unit] || 1));
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const now = new Date();
    const parts = dateStr.split(' ');
    if (parts.length >= 3) {
      const month = parts[0];
      const day = parts[1];
      const timeOrYear = parts[2];
      
      if (timeOrYear.includes(':')) {
        const [hour, minute] = timeOrYear.split(':');
        const date = new Date(now.getFullYear(), getMonthIndex(month), parseInt(day), parseInt(hour), parseInt(minute));
        return date.toISOString();
      } else {
        const date = new Date(parseInt(timeOrYear), getMonthIndex(month), parseInt(day));
        return date.toISOString();
      }
    }
  } catch (error) {
    // Ignore
  }
  return new Date().toISOString();
}

function getMonthIndex(month: string): number {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  return months[month] || 0;
}

