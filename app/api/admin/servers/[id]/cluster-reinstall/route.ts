import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { installGameServer } from '@/lib/game-server-installer';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Progress fájl elérési út
function getProgressFilePath(serverId: string): string {
  return join(process.cwd(), 'logs', 'install', `server-${serverId}.progress.json`);
}

function getLogFilePath(serverId: string): string {
  return join(process.cwd(), 'logs', 'install', `server-${serverId}.log`);
}

// Progress írása
async function writeInstallProgress(serverId: string, progress: {
  status: string;
  message: string;
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  error?: string;
}) {
  const progressPath = getProgressFilePath(serverId);
  await mkdir(join(progressPath, '..'), { recursive: true });
  await writeFile(progressPath, JSON.stringify({
    ...progress,
    timestamp: new Date().toISOString(),
  }, null, 2));
}

// Log írása
async function appendInstallLog(serverId: string, message: string) {
  const logPath = getLogFilePath(serverId);
  await mkdir(join(logPath, '..'), { recursive: true });
  await appendFile(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

// POST - ARK Cluster Újratelepítés (instance könyvtár törlése + teljes újratelepítés)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    // Szerver adatok lekérése
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        user: true,
        machine: true,
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

    // Csak ARK szerverekhez engedélyezve
    if (server.gameType !== 'ARK_EVOLVED' && server.gameType !== 'ARK_ASCENDED') {
      return NextResponse.json(
        { error: 'Ez az operáció csak ARK szerverekhez elérhető' },
        { status: 400 }
      );
    }

    const machine = server.machine || server.agent?.machine;
    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver nincs hozzárendelve egy géphez' },
        { status: 400 }
      );
    }

    // Szerver leállítása előtt
    logger.info('Stopping server before cluster reinstall', { serverId: id, gameType: server.gameType });
    try {
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `systemctl stop server-${id}.service || true`
      );
      // Várunk, hogy a szerver biztosan leálljon
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      logger.warn('Error stopping server before cluster reinstall', error as Error);
    }

    // Progress tracking kezdése
    await writeInstallProgress(id, {
      status: 'in_progress',
      message: 'ARK Cluster újratelepítés...',
      progress: 5,
      currentStep: 'cluster_cleanup',
      totalSteps: 8,
    });
    await appendInstallLog(id, '=== ARK CLUSTER ÚJRATELEPÍTÉS ELINDÍTVA ===');
    await appendInstallLog(id, `Szerver: ${server.name} (${server.gameType})`);
    await appendInstallLog(id, 'Cluster instance könyvtár teljes törlése...');

    // ARK specifikus kezelés - instance könyvtár törlése
    const { getARKSharedPath } = await import('@/lib/ark-cluster');
    const sharedPath = getARKSharedPath(server.userId, machine.id);
    const instancePath = `${sharedPath}/instances/${id}`;

    logger.info('Deleting ARK instance directory', { 
      serverId: id,
      instancePath,
      gameType: server.gameType 
    });

    // Instance könyvtár törlése + teljes újratelepítés
    const deleteInstanceCommand = `
      if [ -d "${instancePath}" ]; then
        echo "Törlés: ${instancePath}"
        rm -rf "${instancePath}" 2>/dev/null || true
        echo "Instance könyvtár törölve"
      fi
      
      # Systemd service törlése is
      systemctl stop server-${id}.service 2>/dev/null || true
      systemctl disable server-${id}.service 2>/dev/null || true
      rm -f /etc/systemd/system/server-${id}.service 2>/dev/null || true
      systemctl daemon-reload || true
      echo "Systemd service törölve"
    `;

    try {
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        deleteInstanceCommand
      );
      await appendInstallLog(id, `✓ Instance könyvtár és systemd service törölve`);
      await appendInstallLog(id, `  Elérési út: ${instancePath}`);
    } catch (error) {
      logger.warn('Error deleting ARK instance', error as Error);
      await appendInstallLog(id, `⚠ Figyelmeztetés: Nem sikerült teljesen törölni az instance-t, de folytatjuk`);
    }

    // Szerver konfiguráció kinyerése
    const config = server.configuration as any || {};

    // Telepítési paraméterek
    const installConfig = {
      maxPlayers: server.maxPlayers,
      ram: config.ram || 12288, // ARK alapértelmezett RAM
      port: server.port || 7777,
      name: server.name,
      world: config.world,
      password: config.password,
      adminPassword: config.adminPassword,
      clusterId: config.clusterId,
      map: config.map,
    };

    await appendInstallLog(id, '');
    await appendInstallLog(id, 'Szerver teljes újratelepítése indítása...');
    await appendInstallLog(id, `Játéktípus: ${server.gameType}`);
    await appendInstallLog(id, `Maximális játékosok: ${installConfig.maxPlayers}`);
    await appendInstallLog(id, `RAM: ${installConfig.ram}MB`);
    await appendInstallLog(id, `Port: ${installConfig.port}`);
    await writeInstallProgress(id, {
      status: 'in_progress',
      message: 'Szerver újratelepítés indítása...',
      progress: 10,
      currentStep: 'installation',
      totalSteps: 8,
    });

    // Szerver újratelepítése (aszinkron, progress tracking-gel)
    installGameServer(
      server.id,
      server.gameType,
      installConfig,
      { writeProgress: true }
    ).catch((error) => {
      logger.error('Background cluster reinstall error', error as Error);
    });

    return NextResponse.json({
      success: true,
      message: 'ARK Cluster újratelepítés elindítva. Az instance törlésre és teljes újratelepítésre kerül.',
    });
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params;
    logger.error('ARK cluster reinstall error', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt az ARK cluster újratelepítése során' },
      { status: 500 }
    );
  }
}
