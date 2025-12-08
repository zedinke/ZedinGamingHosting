import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createSystemdServiceForServer } from '@/lib/game-server-installer';
import { ALL_GAME_SERVER_CONFIGS } from '@/lib/game-server-configs';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';

// GET - Erőforrás limitok lekérése
export async function GET(
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

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        configuration: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    const config = (server.configuration as any) || {};
    const limits = config.resourceLimits || {
      cpu: { max: 100, min: 0 }, // CPU százalék
      ram: { max: 4096, min: 512 }, // RAM MB
      disk: { max: 10240, min: 1024 }, // Disk MB
    };

    return NextResponse.json({
      success: true,
      limits,
    });
  } catch (error) {
    console.error('Get resource limits error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az erőforrás limitok lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Erőforrás limitok frissítése
export async function PUT(
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
    const body = await request.json();
    const { limits } = body;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    const config = (server.configuration as any) || {};
    config.resourceLimits = limits;

    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        configuration: config,
      },
      include: {
        machine: true,
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    // Systemd service fájl frissítése az új RAM limitokkal
    if (updatedServer.machineId && updatedServer.machine) {
      try {
        const gameConfig = ALL_GAME_SERVER_CONFIGS[updatedServer.gameType];
        if (gameConfig) {
          // RAM érték MB-ban van, konvertáljuk GB-ba a systemd service-hez
          const ramGB = Math.ceil(limits.ram.max / 1024);
          
          // CPU érték százalékban van, konvertáljuk CPU core-okra
          // Feltételezzük, hogy 100% = 1 core
          const cpuCores = Math.ceil(limits.cpu.max / 100);
          
          // Újrageneráljuk a systemd service fájlt az új limitokkal
          await createSystemdServiceForServer(
            updatedServer.id,
            updatedServer.gameType,
            gameConfig,
            {
              port: updatedServer.port || gameConfig.ports?.game || 27015,
              maxPlayers: updatedServer.maxPlayers,
              ram: limits.ram.max, // MB-ban
              cpuCores: cpuCores,
              name: updatedServer.name,
              password: (config as any).password || '',
              adminPassword: (config as any).adminPassword || 'changeme',
              world: (config as any).world || 'Dedicated',
              map: (config as any).map || 'TheIsland',
              clusterId: (config as any).clusterId || undefined,
            },
            updatedServer.machine,
            {
              isARK: updatedServer.gameType === 'ARK_EVOLVED' || updatedServer.gameType === 'ARK_ASCENDED',
              sharedPath: (config as any).sharedPath || null,
              serverPath: `/opt/servers/${updatedServer.id}`,
            }
          );

          // Systemd daemon reload és service újraindítás (ha fut)
          const serviceName = `server-${updatedServer.id}`;
          await executeSSHCommand(
            {
              host: updatedServer.machine.ipAddress,
              port: updatedServer.machine.sshPort,
              user: updatedServer.machine.sshUser,
              keyPath: updatedServer.machine.sshKeyPath || undefined,
            },
            `systemctl daemon-reload && systemctl is-active ${serviceName} >/dev/null 2>&1 && systemctl restart ${serviceName} || echo "Service not running, no restart needed"`
          );

          logger.info('Systemd service updated with new resource limits', {
            serverId: updatedServer.id,
            ramMB: limits.ram.max,
            ramGB,
            cpuCores,
          });
        }
      } catch (serviceError: any) {
        // Nem dobunk hibát, mert a limitok már mentve vannak
        // Csak logoljuk a hibát
        logger.warn('Failed to update systemd service with new resource limits', {
          serverId: updatedServer.id,
          error: serviceError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Erőforrás limitok sikeresen frissítve és systemd service újragenerálva',
      limits: (updatedServer.configuration as any)?.resourceLimits,
    });
  } catch (error) {
    console.error('Update resource limits error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az erőforrás limitok frissítése során' },
      { status: 500 }
    );
  }
}

