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
import { existsSync } from 'fs';

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

// POST - Szerver újratelepítése
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

    const machine = server.machine || server.agent?.machine;
    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver nincs hozzárendelve egy géphez' },
        { status: 400 }
      );
    }

    // Szerver leállítása újratelepítés előtt
    logger.info('Stopping server before reinstall', { serverId: id });
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
      // Várunk egy kicsit, hogy a szerver biztosan leálljon
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      logger.warn('Error stopping server before reinstall', error as Error);
      // Folytatjuk a törléssel, még ha a leállítás nem sikerült
    }

    // Régi fájlok törlése
    logger.info('Deleting old server files', { serverId: id, gameType: server.gameType });
    
    // Progress tracking kezdése
    await writeInstallProgress(id, {
      status: 'in_progress',
      message: 'Régi szerver fájlok törlése...',
      progress: 5,
      currentStep: 'cleanup',
      totalSteps: 7,
    });
    await appendInstallLog(id, 'Régi szerver fájlok törlése...');

    // ARK játékoknál külön kezelés
    const isARK = server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED';
    let serverPath: string;
    
    if (isARK) {
      const { getARKSharedPath } = await import('@/lib/ark-cluster');
      const sharedPath = getARKSharedPath(server.userId, machine.id);
      serverPath = `${sharedPath}/instances/${id}`;
    } else {
      serverPath = `/opt/servers/${id}`;
    }

    // Szerver könyvtár törlése (de csak a tartalmat, ne a könyvtárat magát)
    // Biztonságos törlés: csak a szerver könyvtár tartalmát töröljük
    const deleteCommand = `if [ -d "${serverPath}" ]; then rm -rf "${serverPath}"/* "${serverPath}"/.* 2>/dev/null || true; rm -rf "${serverPath}" 2>/dev/null || true; fi`;
    
    try {
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        deleteCommand
      );
      await appendInstallLog(id, `Régi szerver fájlok törölve: ${serverPath}`);
    } catch (error) {
      logger.warn('Error deleting old files', error as Error);
      await appendInstallLog(id, `Figyelmeztetés: Nem sikerült teljesen törölni a régi fájlokat, de folytatjuk a telepítést`);
    }

    // Systemd service törlése is (újragenerálódik a telepítés során)
    try {
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `systemctl stop server-${id}.service 2>/dev/null || true; systemctl disable server-${id}.service 2>/dev/null || true; rm -f /etc/systemd/system/server-${id}.service 2>/dev/null || true; systemctl daemon-reload || true`
      );
      await appendInstallLog(id, 'Régi systemd service törölve');
    } catch (error) {
      logger.warn('Error deleting systemd service', error as Error);
    }

    // Szerver konfiguráció kinyerése
    const config = server.configuration as any || {};
    
    // Telepítési paraméterek összeállítása
    const installConfig = {
      maxPlayers: server.maxPlayers,
      ram: config.ram || 2048, // Alapértelmezett RAM
      port: server.port || 27015,
      name: server.name,
      world: config.world,
      password: config.password,
      adminPassword: config.adminPassword,
      clusterId: config.clusterId,
      map: config.map,
    };

    await appendInstallLog(id, 'Újratelepítés indítása...');

    // Szerver újratelepítése (aszinkron módon, progress tracking-gel)
    // Azonnal visszatérünk, hogy a frontend elkezdhesse a progress polling-ot
    installGameServer(
      server.id,
      server.gameType,
      installConfig,
      { writeProgress: true } // Progress tracking engedélyezése
    ).catch((error) => {
      logger.error('Background installation error', error as Error);
      // A hiba már a progress fájlban lesz, nem kell itt kezelni
    });

    // Azonnal visszatérünk, mert a telepítés háttérben fut
    // A frontend a /api/admin/servers/[id]/install-progress endpoint-on keresztül követheti a folyamatot
    return NextResponse.json({
      success: true,
      message: 'Szerver újratelepítés elindítva. A telepítés folyamatát az élő terminálban követheted.',
    });
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params;
    logger.error('Server reinstall error', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a szerver újratelepítése során' },
      { status: 500 }
    );
  }
}

