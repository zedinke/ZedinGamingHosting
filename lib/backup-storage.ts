import { prisma } from '@/lib/prisma';
import { executeSSHCommand, copyFileViaSSH, downloadFileViaSSH } from './ssh-client';
import { createWriteStream, createReadStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

/**
 * Backup készítése egy szerverhez
 */
export async function createServerBackup(
  serverId: string,
  backupName?: string
): Promise<{ success: boolean; backupPath?: string; error?: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent) {
      return {
        success: false,
        error: 'Szerver vagy agent nem található',
      };
    }

    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    const backupNameFinal = backupName || `backup-${server.id}-${Date.now()}`;
    const backupPath = `/opt/backups/${server.id}/${backupNameFinal}.tar.gz`;

    // Backup könyvtár létrehozása
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `mkdir -p /opt/backups/${server.id}`
    );

    // Szerver leállítása backup előtt (opcionális)
    // await stopServer(serverId);

    // Backup készítése (tar.gz)
    const backupCommand = `cd "${serverPath}" && tar -czf "${backupPath}" . 2>&1`;
    
    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      backupCommand
    );

    if (result.exitCode !== 0) {
      return {
        success: false,
        error: `Backup hiba: ${result.stderr}`,
      };
    }

    // Backup méret lekérdezése
    const sizeCommand = `stat -f%z "${backupPath}" 2>/dev/null || stat -c%s "${backupPath}" 2>/dev/null || echo "0"`;
    const sizeResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      sizeCommand
    );

    const size = parseInt(sizeResult.stdout.trim()) || 0;

    // Szerver újraindítása (ha leállítottuk)
    // await startServer(serverId);

    return {
      success: true,
      backupPath,
    };
  } catch (error: any) {
    console.error('Create backup error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a backup készítése során',
    };
  }
}

/**
 * Backup letöltése
 */
export async function downloadBackup(
  serverId: string,
  backupPath: string,
  localPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent) {
      return {
        success: false,
        error: 'Szerver vagy agent nem található',
      };
    }

    const machine = server.agent.machine;

    const result = await downloadFileViaSSH(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      backupPath,
      localPath
    );

    if (result.exitCode !== 0) {
      return {
        success: false,
        error: `Download hiba: ${result.stderr}`,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Download backup error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a backup letöltése során',
    };
  }
}

/**
 * Backup törlése
 */
export async function deleteBackup(
  serverId: string,
  backupPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent) {
      return {
        success: false,
        error: 'Szerver vagy agent nem található',
      };
    }

    const machine = server.agent.machine;

    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `rm -f "${backupPath}"`
    );

    if (result.exitCode !== 0) {
      return {
        success: false,
        error: `Delete hiba: ${result.stderr}`,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Delete backup error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a backup törlése során',
    };
  }
}

/**
 * Backupok listázása
 */
export async function listBackups(serverId: string): Promise<
  Array<{
    name: string;
    path: string;
    size: number;
    createdAt: Date;
    type: 'manual' | 'automatic';
  }>
> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent) {
      return [];
    }

    const machine = server.agent.machine;
    const backupDir = `/opt/backups/${server.id}`;

    // Backup fájlok listázása
    const listCommand = `ls -lah "${backupDir}"/*.tar.gz 2>/dev/null | awk '{print $9"|"$5"|"$6" "$7" "$8}'`;
    
    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      listCommand
    );

    if (result.exitCode !== 0 || !result.stdout.trim()) {
      return [];
    }

    // Backupok feldolgozása
    const backups = result.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [path, size, date] = line.split('|');
        const fileName = path.split('/').pop() || '';
        const isAutomatic = fileName.includes('automatic');
        
        return {
          name: fileName.replace('.tar.gz', ''),
          path: path.trim(),
          size: parseSize(size.trim()),
          createdAt: parseDate(date.trim()),
          type: isAutomatic ? ('automatic' as const) : ('manual' as const),
        };
      });

    return backups;
  } catch (error) {
    console.error('List backups error:', error);
    return [];
  }
}

/**
 * Fájlméret parse-olása
 */
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

/**
 * Dátum parse-olása
 */
function parseDate(dateStr: string): Date {
  try {
    // ls formátum: "Jan 1 12:00" vagy "Jan 1 2024"
    const parts = dateStr.split(' ');
    if (parts.length >= 3) {
      const month = parts[0];
      const day = parts[1];
      const timeOrYear = parts[2];
      
      if (timeOrYear.includes(':')) {
        const [hour, minute] = timeOrYear.split(':');
        const now = new Date();
        return new Date(now.getFullYear(), getMonthIndex(month), parseInt(day), parseInt(hour), parseInt(minute));
      } else {
        return new Date(parseInt(timeOrYear), getMonthIndex(month), parseInt(day));
      }
    }
  } catch (error) {
    // Fallback
  }
  return new Date();
}

function getMonthIndex(month: string): number {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  return months[month] || 0;
}

