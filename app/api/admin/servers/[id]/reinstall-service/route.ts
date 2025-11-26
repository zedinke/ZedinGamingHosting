import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';

// POST - Systemd service újratelepítése/javítása
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;

    logger.info('Reinstalling systemd service', {
      serverId: id,
      adminId: (session.user as any).id,
    });

    // Szerver adatok lekérése
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

    if (!server.agent || !server.agent.machine) {
      return NextResponse.json(
        { error: 'Szerver nincs gépre telepítve vagy nincs agent' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const serviceName = `server-${id}`;
    const wasRunning = server.status === 'ONLINE';

    // 1. Szerver leállítása, ha fut
    if (wasRunning) {
      logger.info(`Stopping server ${id} before service reinstall`);
      await prisma.server.update({
        where: { id },
        data: { status: 'STOPPING' },
      });

      try {
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `systemctl stop ${serviceName} 2>/dev/null || true`
        );
        // Várunk, hogy a szerver leálljon
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        logger.warn('Error stopping server before reinstall', { error });
      }
    }

    // 2. Régi service fájl törlése
    logger.info(`Removing old service file: ${serviceName}`);
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `systemctl disable ${serviceName} 2>/dev/null || true && rm -f /etc/systemd/system/${serviceName}.service && systemctl daemon-reload`
    );

    // 3. Új service fájl létrehozása
    logger.info(`Creating new service file: ${serviceName}`);
    const { createSystemdServiceForServer } = await import('@/lib/game-server-installer');
    
    // Szerver konfiguráció lekérése
    const serverConfig = {
      port: server.port || 7777,
      maxPlayers: server.maxPlayers || 10,
      name: server.name,
      ram: 2048, // Alapértelmezett, vagy lehet lekérdezni
      ...((server.configuration as any) || {}),
    };

    // Game config lekérése
    const { ALL_GAME_SERVER_CONFIGS } = await import('@/lib/game-server-configs');
    const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];
    
    if (!gameConfig) {
      return NextResponse.json(
        { error: `Game type ${server.gameType} konfiguráció nem található` },
        { status: 400 }
      );
    }

    // ARK esetén külön kezelés
    const isARK = server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED';
    let paths: { isARK: boolean; sharedPath: string | null; serverPath: string } | undefined;
    
    if (isARK) {
      const { getARKSharedPath } = await import('@/lib/ark-cluster');
      const sharedPath = getARKSharedPath(server.userId, server.machineId!);
      const serverPath = `${sharedPath}/instances/${server.id}`;
      paths = {
        isARK: true,
        sharedPath,
        serverPath,
      };
    } else {
      paths = {
        isARK: false,
        sharedPath: null,
        serverPath: `/opt/servers/${server.id}`,
      };
    }

    // Service fájl létrehozása
    await createSystemdServiceForServer(
      id,
      server.gameType,
      gameConfig,
      serverConfig,
      machine,
      paths
    );

    // 4. Service aktiválása
    logger.info(`Enabling service: ${serviceName}`);
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `systemctl enable ${serviceName} && systemctl daemon-reload`
    );

    // 5. Szerver újraindítása, ha előtte futott
    if (wasRunning) {
      logger.info(`Restarting server ${id} after service reinstall`);
      await prisma.server.update({
        where: { id },
        data: { status: 'STARTING' },
      });

      try {
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `systemctl start ${serviceName} && systemctl is-active ${serviceName} || echo "failed"`
        );

        // Ellenőrizzük a státuszt
        const statusCheck = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `systemctl is-active ${serviceName} 2>&1 || echo "inactive"`
        );

        if (statusCheck.stdout.trim() === 'active') {
          await prisma.server.update({
            where: { id },
            data: { status: 'ONLINE' },
          });
        } else {
          await prisma.server.update({
            where: { id },
            data: { status: 'ERROR' },
          });
        }
      } catch (error) {
        logger.error('Error restarting server after service reinstall', { error });
        await prisma.server.update({
          where: { id },
          data: { status: 'ERROR' },
        });
      }
    } else {
      await prisma.server.update({
        where: { id },
        data: { status: 'OFFLINE' },
      });
    }

    logger.info('Systemd service reinstalled successfully', {
      serverId: id,
      wasRunning,
      newStatus: wasRunning ? 'ONLINE' : 'OFFLINE',
    });

    return NextResponse.json({
      success: true,
      message: 'Systemd service sikeresen újratelepítve',
      wasRunning,
      newStatus: wasRunning ? 'ONLINE' : 'OFFLINE',
    });
  } catch (error: any) {
    logger.error('Service reinstall error', error as Error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Hiba történt a service újratelepítése során' },
      { status: 500 }
    );
  }
}

