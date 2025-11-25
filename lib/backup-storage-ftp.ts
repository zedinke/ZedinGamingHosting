import { prisma } from '@/lib/prisma';

/**
 * FTP kapcsolat létrehozása
 */
async function createFTPClient() {
  try {
    const { Client } = await import('basic-ftp');
    const client = new Client();
    client.ftp.verbose = process.env.FTP_VERBOSE === 'true';
    return client;
  } catch (error) {
    throw new Error('basic-ftp modul nincs telepítve. Telepítsd: npm install basic-ftp');
  }
}

/**
 * Backup feltöltése FTP-re
 */
export async function uploadBackupToFTP(
  serverId: string,
  backupPath: string,
  backupName: string
): Promise<{ success: boolean; ftpPath?: string; error?: string }> {
  let client: any = null;
  try {
    client = await createFTPClient();
    const { readFile } = await import('fs/promises');
    const { existsSync } = await import('fs');

    if (!existsSync(backupPath)) {
      return {
        success: false,
        error: 'Backup fájl nem található',
      };
    }

    await client.access({
      host: process.env.FTP_HOST || 'localhost',
      user: process.env.FTP_USER || '',
      password: process.env.FTP_PASSWORD || '',
      secure: process.env.FTP_SECURE === 'true',
      port: parseInt(process.env.FTP_PORT || '21'),
    });

    // Könyvtár létrehozása
    const remoteDir = `/backups/servers/${serverId}`;
    await client.ensureDir(remoteDir);

    // Fájl feltöltése
    const fileBuffer = await readFile(backupPath);
    const remotePath = `${remoteDir}/${backupName}`;
    
    await client.uploadFrom(fileBuffer, remotePath);

    client.close();

    return {
      success: true,
      ftpPath: remotePath,
    };
  } catch (error: any) {
    if (client) {
      client.close();
    }
    if (error.message?.includes('basic-ftp modul nincs telepítve')) {
      return {
        success: false,
        error: 'FTP támogatás nincs telepítve. Telepítsd: npm install basic-ftp',
      };
    }
    console.error('FTP upload error:', error);
    return {
      success: false,
      error: error.message || 'FTP feltöltési hiba',
    };
  }
}

/**
 * Backup letöltése FTP-ről
 */
export async function downloadBackupFromFTP(
  ftpPath: string,
  localPath: string
): Promise<{ success: boolean; error?: string }> {
  let client: any = null;
  try {
    client = await createFTPClient();
    await client.access({
      host: process.env.FTP_HOST || 'localhost',
      user: process.env.FTP_USER || '',
      password: process.env.FTP_PASSWORD || '',
      secure: process.env.FTP_SECURE === 'true',
      port: parseInt(process.env.FTP_PORT || '21'),
    });

    await client.downloadTo(localPath, ftpPath);

    client.close();

    return {
      success: true,
    };
  } catch (error: any) {
    if (client) {
      client.close();
    }
    if (error.message?.includes('basic-ftp modul nincs telepítve')) {
      return {
        success: false,
        error: 'FTP támogatás nincs telepítve. Telepítsd: npm install basic-ftp',
      };
    }
    console.error('FTP download error:', error);
    return {
      success: false,
      error: error.message || 'FTP letöltési hiba',
    };
  }
}

/**
 * Backup törlése FTP-ről
 */
export async function deleteBackupFromFTP(
  ftpPath: string
): Promise<{ success: boolean; error?: string }> {
  let client: any = null;
  try {
    client = await createFTPClient();
    await client.access({
      host: process.env.FTP_HOST || 'localhost',
      user: process.env.FTP_USER || '',
      password: process.env.FTP_PASSWORD || '',
      secure: process.env.FTP_SECURE === 'true',
      port: parseInt(process.env.FTP_PORT || '21'),
    });

    await client.remove(ftpPath);

    client.close();

    return {
      success: true,
    };
  } catch (error: any) {
    if (client) {
      client.close();
    }
    if (error.message?.includes('basic-ftp modul nincs telepítve')) {
      return {
        success: false,
        error: 'FTP támogatás nincs telepítve. Telepítsd: npm install basic-ftp',
      };
    }
    console.error('FTP delete error:', error);
    return {
      success: false,
      error: error.message || 'FTP törlési hiba',
    };
  }
}

/**
 * Backupok listázása FTP-ről
 */
export async function listBackupsFromFTP(
  serverId: string
): Promise<Array<{ name: string; size: number; modified: Date }>> {
  let client: any = null;
  try {
    client = await createFTPClient();
    await client.access({
      host: process.env.FTP_HOST || 'localhost',
      user: process.env.FTP_USER || '',
      password: process.env.FTP_PASSWORD || '',
      secure: process.env.FTP_SECURE === 'true',
      port: parseInt(process.env.FTP_PORT || '21'),
    });

    const remoteDir = `/backups/servers/${serverId}`;
    const files = await client.list(remoteDir);

    client.close();

    return files
      .filter((file) => file.name.endsWith('.tar.gz'))
      .map((file) => ({
        name: file.name,
        size: file.size || 0,
        modified: file.modifiedAt || new Date(),
      }));
  } catch (error: any) {
    if (client) {
      client.close();
    }
    if (error.message?.includes('basic-ftp modul nincs telepítve')) {
      console.warn('FTP támogatás nincs telepítve. Telepítsd: npm install basic-ftp');
      return [];
    }
    console.error('FTP list error:', error);
    return [];
  }
}
