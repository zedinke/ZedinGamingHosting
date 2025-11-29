import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';
import { ALL_GAME_SERVER_CONFIGS } from '@/lib/game-server-configs';
import { createSystemdServiceForServer } from '@/lib/game-server-installer';

export async function GET(
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

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
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

    if (!server.machineId || !server.machine) {
      return NextResponse.json(
        { error: 'A szervernek nincs hozzárendelt gépe' },
        { status: 400 }
      );
    }

    const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];
    if (!gameConfig) {
      return NextResponse.json(
        { error: 'Játék konfiguráció nem található' },
        { status: 400 }
      );
    }

    // Próbáljuk meg lekérni a systemd service fájlból
    const serviceName = `server-${id}`;
    const serviceFilePath = `/etc/systemd/system/${serviceName}.service`;

    try {
      const result = await executeSSHCommand(
        {
          host: server.machine.ipAddress,
          port: server.machine.sshPort,
          user: server.machine.sshUser,
          keyPath: server.machine.sshKeyPath || undefined,
        },
        `cat ${serviceFilePath} 2>/dev/null | grep -E '^ExecStart=' | sed 's/^ExecStart=//' || echo 'NOT_FOUND'`
      );

      if (result.stdout?.trim() && result.stdout.trim() !== 'NOT_FOUND') {
        const startCommand = result.stdout.trim();
        
        // Ha escape-elt karakterek vannak, visszaalakítjuk
        const unescapedCommand = startCommand
          .replace(/\\\$/g, '$')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');

        return NextResponse.json({
          success: true,
          startCommand: unescapedCommand,
          source: 'systemd_service',
        });
      }
    } catch (error) {
      // Ha nem található a service fájl, generáljuk az indító sort
    }

    // Ha nem található a service fájl, generáljuk az indító sort a jelenlegi beállításokból
    const config = {
      port: server.port || gameConfig.port,
      maxPlayers: server.maxPlayers,
      ram: 2048, // Alapértelmezett, mert nincs a szerverben
      name: server.name,
      password: (server.configuration as any)?.password || '',
      adminPassword: (server.configuration as any)?.adminPassword || 'changeme',
      world: (server.configuration as any)?.world || 'Dedicated',
      map: (server.configuration as any)?.map || 'TheIsland',
      clusterId: (server.configuration as any)?.clusterId || undefined,
    };

    // Generáljuk az indító sort
    let startCommand = gameConfig.startCommand;
    const queryPort = gameConfig.queryPort || config.port + 1;
    const beaconPort = gameConfig.beaconPort || (gameConfig.queryPort ? gameConfig.queryPort + 1 : config.port + 2);

    if (server.gameType === 'SATISFACTORY') {
      startCommand = startCommand
        .replace(/{port}/g, config.port.toString())
        .replace(/{queryPort}/g, queryPort.toString())
        .replace(/{beaconPort}/g, beaconPort.toString());
    } else {
      startCommand = startCommand
        .replace(/{port}/g, config.port.toString())
        .replace(/{maxPlayers}/g, config.maxPlayers.toString())
        .replace(/{ram}/g, config.ram.toString())
        .replace(/{name}/g, config.name)
        .replace(/{world}/g, config.world)
        .replace(/{adminPassword}/g, config.adminPassword)
        .replace(/{queryPort}/g, queryPort.toString())
        .replace(/{beaconPort}/g, beaconPort.toString())
        .replace(/{map}/g, config.map)
        .replace(/{password}/g, config.password);
    }

    return NextResponse.json({
      success: true,
      startCommand,
      source: 'generated',
      config: {
        port: config.port,
        queryPort,
        beaconPort,
        maxPlayers: config.maxPlayers,
        name: config.name,
      },
    });
  } catch (error: any) {
    console.error('Start command fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az indító sor lekérése során: ' + error.message },
      { status: 500 }
    );
  }
}

