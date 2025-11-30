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
    // Fontos: az összes portot az adatbázisból kinyerjük
    const serverWithPorts = await prisma.server.findUnique({
      where: { id },
      select: {
        port: true,
        queryPort: true,
        beaconPort: true,
        steamPeerPort: true,
        rustPlusPort: true,
        telnetPort: true,
        webMapPort: true,
        configuration: true,
      },
    });

    const config = {
      port: serverWithPorts?.port || server.port || gameConfig.port,
      maxPlayers: server.maxPlayers,
      ram: 2048, // Alapértelmezett, mert nincs a szerverben
      name: server.name,
      password: (server.configuration as any)?.password || '',
      adminPassword: (server.configuration as any)?.adminPassword || 'changeme',
      world: (server.configuration as any)?.world || 'Dedicated',
      map: (server.configuration as any)?.map || 'TheIsland',
      clusterId: (server.configuration as any)?.clusterId || undefined,
    };

    // Generáljuk az indító sort - az összes portot az adatbázisból kinyerjük
    let startCommand = gameConfig.startCommand;
    
    // Satisfactory esetén az adatbázisból kinyerjük az összes portot
    if (server.gameType === 'SATISFACTORY') {
      const gamePort = serverWithPorts?.port || config.port || 7777;
      const queryPort = serverWithPorts?.queryPort || (gamePort + 2);
      const beaconPort = serverWithPorts?.beaconPort || (queryPort + 2);
      const multihomeIp = server.machine?.ipAddress || '0.0.0.0';
      
      startCommand = startCommand
        .replace(/{gamePort}/g, gamePort.toString())
        .replace(/{port}/g, gamePort.toString())
        .replace(/{queryPort}/g, queryPort.toString())
        .replace(/{beaconPort}/g, beaconPort.toString())
        .replace(/{multihome}/g, multihomeIp);
    } else if (server.gameType === 'VALHEIM') {
      // Valheim: port és queryPort az adatbázisból
      const port = serverWithPorts?.port || config.port || 2456;
      const queryPort = serverWithPorts?.queryPort || (port + 1);
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{maxPlayers}/g, config.maxPlayers.toString())
        .replace(/{ram}/g, config.ram.toString())
        .replace(/{name}/g, config.name)
        .replace(/{world}/g, config.world)
        .replace(/{queryPort}/g, queryPort.toString())
        .replace(/{password}/g, config.password);
    } else if (server.gameType === 'THE_FOREST') {
      // The Forest: port, queryPort, steamPeerPort az adatbázisból
      const port = serverWithPorts?.port || config.port || 27015;
      const queryPort = serverWithPorts?.queryPort || (port + 1);
      const steamPeerPort = (serverWithPorts as any)?.steamPeerPort || (queryPort + 1);
      
      // The Forest konfigurációs értékek a configuration-ből
      const serverConfig = server.configuration ? (typeof server.configuration === 'string' ? JSON.parse(server.configuration) : server.configuration) : {};
      const serverautosaveinterval = serverConfig.serverautosaveinterval || serverConfig.serverAutoSaveInterval || 15;
      const difficulty = serverConfig.difficulty || 'Normal';
      const inittype = serverConfig.inittype || serverConfig.initType || 'Continue';
      const enableVAC = serverConfig.enableVAC || 'on';
      const slot = serverConfig.slot || 3;
      const serverip = server.machine?.ipAddress || '0.0.0.0';
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{maxPlayers}/g, config.maxPlayers.toString())
        .replace(/{ram}/g, config.ram.toString())
        .replace(/{name}/g, config.name)
        .replace(/{queryPort}/g, queryPort.toString())
        .replace(/{steamPeerPort}/g, steamPeerPort.toString())
        .replace(/{password}/g, config.password)
        .replace(/{serverautosaveinterval}/g, serverautosaveinterval.toString())
        .replace(/{difficulty}/g, difficulty)
        .replace(/{inittype}/g, inittype)
        .replace(/{enableVAC}/g, enableVAC)
        .replace(/{slot}/g, slot.toString())
        .replace(/{serverip}/g, serverip);
    } else if (server.gameType === 'RUST') {
      // Rust: port, queryPort, rustPlusPort az adatbázisból
      const port = serverWithPorts?.port || config.port || 28015;
      const queryPort = serverWithPorts?.queryPort || (port + 1);
      const rustPlusPort = (serverWithPorts as any)?.rustPlusPort || (port + 67);
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{maxPlayers}/g, config.maxPlayers.toString())
        .replace(/{ram}/g, config.ram.toString())
        .replace(/{name}/g, config.name)
        .replace(/{queryPort}/g, queryPort.toString())
        .replace(/{rustPlusPort}/g, rustPlusPort.toString());
    } else if (server.gameType === 'SEVEN_DAYS_TO_DIE') {
      // 7 Days to Die: portok az adatbázisból (mint a többi játéknál)
      const port = serverWithPorts?.port || config.port || 26900;
      const telnetPort = (serverWithPorts as any)?.telnetPort || (port + 2);
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{telnetPort}/g, telnetPort.toString())
        .replace(/{name}/g, config.name)
        .replace(/{maxPlayers}/g, config.maxPlayers.toString());
    } else if (server.gameType === 'PALWORLD') {
      // Palworld: port az adatbázisból
      const port = serverWithPorts?.port || config.port || 8211;
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{maxPlayers}/g, config.maxPlayers.toString());
    } else if (server.gameType === 'ENSHROUDED') {
      // Enshrouded: port az adatbázisból
      const port = serverWithPorts?.port || config.port || 15636;
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{ServerName}/g, config.name);
    } else if (server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED') {
      // ARK: port és queryPort az adatbázisból
      const port = serverWithPorts?.port || config.port || 7777;
      const queryPort = serverWithPorts?.queryPort || (port + 1);
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{queryPort}/g, queryPort.toString())
        .replace(/{adminPassword}/g, config.adminPassword)
        .replace(/{name}/g, config.name)
        .replace(/{maxPlayers}/g, config.maxPlayers.toString());
    } else if (server.gameType === 'CONAN_EXILES') {
      // Conan Exiles: port és queryPort az adatbázisból
      const port = serverWithPorts?.port || config.port || 7777;
      const queryPort = serverWithPorts?.queryPort || (port + 1);
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{queryPort}/g, queryPort.toString());
    } else if (server.gameType === 'DAYZ') {
      // DayZ: port az adatbázisból
      const port = serverWithPorts?.port || config.port || 2302;
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString());
    } else if (server.gameType === 'CS2') {
      // CS2: port az adatbázisból
      const port = serverWithPorts?.port || config.port || 27015;
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString());
    } else if (server.gameType === 'KILLING_FLOOR_2') {
      // Killing Floor 2: port és queryPort az adatbázisból
      const port = serverWithPorts?.port || config.port || 7777;
      const queryPort = serverWithPorts?.queryPort || (port + 1);
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{queryPort}/g, queryPort.toString())
        .replace(/{maxPlayers}/g, config.maxPlayers.toString());
    } else if (server.gameType === 'TERRARIA') {
      // Terraria: port az adatbázisból
      const port = serverWithPorts?.port || config.port || 7777;
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{world}/g, config.world)
        .replace(/{maxPlayers}/g, config.maxPlayers.toString());
    } else if (server.gameType === 'V_RISING') {
      // V Rising: port az adatbázisból
      const port = serverWithPorts?.port || config.port || 27015;
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{name}/g, config.name);
    } else if (server.gameType === 'GROUNDED') {
      // Grounded: port és queryPort az adatbázisból
      const port = serverWithPorts?.port || config.port || 7777;
      const queryPort = serverWithPorts?.queryPort || (port + 1);
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{queryPort}/g, queryPort.toString());
    } else if (server.gameType === 'SONS_OF_THE_FOREST') {
      // Sons of the Forest: port és queryPort az adatbázisból
      const port = serverWithPorts?.port || config.port || 8766;
      const queryPort = serverWithPorts?.queryPort || (port + 1);
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
        .replace(/{queryPort}/g, queryPort.toString());
    } else if (server.gameType === 'PROJECT_ZOMBOID') {
      // Project Zomboid: port az adatbázisból
      const port = serverWithPorts?.port || config.port || 16261;
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString());
    } else if (server.gameType === 'DONT_STARVE_TOGETHER') {
      // Don't Starve Together: port az adatbázisból
      const port = serverWithPorts?.port || config.port || 10999;
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString());
    } else {
      // Más játékok: alapértelmezett logika, de az adatbázisból kinyert portokat használjuk
      const port = serverWithPorts?.port || config.port;
      const queryPort = serverWithPorts?.queryPort || (gameConfig.queryPort || port + 1);
      const beaconPort = serverWithPorts?.beaconPort || (gameConfig.beaconPort || (gameConfig.queryPort ? gameConfig.queryPort + 1 : port + 2));
      
      startCommand = startCommand
        .replace(/{port}/g, port.toString())
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

    // Válasz config objektum az adatbázisból kinyert portokkal
    let responseConfig: any = {
      port: config.port,
      maxPlayers: config.maxPlayers,
      name: config.name,
    };
    
    if (server.gameType === 'SATISFACTORY') {
      responseConfig.gamePort = serverWithPorts?.port || config.port || 7777;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.gamePort + 2);
      responseConfig.beaconPort = serverWithPorts?.beaconPort || (responseConfig.queryPort + 2);
    } else if (server.gameType === 'VALHEIM') {
      responseConfig.port = serverWithPorts?.port || config.port || 2456;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
    } else if (server.gameType === 'THE_FOREST') {
      responseConfig.port = serverWithPorts?.port || config.port || 27015;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
      responseConfig.steamPeerPort = (serverWithPorts as any)?.steamPeerPort || (responseConfig.queryPort + 1);
    } else if (server.gameType === 'RUST') {
      responseConfig.port = serverWithPorts?.port || config.port || 28015;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
      responseConfig.rustPlusPort = (serverWithPorts as any)?.rustPlusPort || (responseConfig.port + 67);
    } else if (server.gameType === 'SEVEN_DAYS_TO_DIE') {
      // 7 Days to Die: portok az adatbázisból (mint a többi játéknál)
      responseConfig.port = serverWithPorts?.port || config.port || 26900;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
      responseConfig.telnetPort = (serverWithPorts as any)?.telnetPort || (responseConfig.port + 2);
      responseConfig.webMapPort = (serverWithPorts as any)?.webMapPort || (responseConfig.port + 3);
    } else if (server.gameType === 'PALWORLD') {
      responseConfig.port = serverWithPorts?.port || config.port || 8211;
    } else if (server.gameType === 'ENSHROUDED') {
      responseConfig.port = serverWithPorts?.port || config.port || 15636;
    } else if (server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED') {
      responseConfig.port = serverWithPorts?.port || config.port || 7777;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
    } else if (server.gameType === 'CONAN_EXILES') {
      responseConfig.port = serverWithPorts?.port || config.port || 7777;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
    } else if (server.gameType === 'DAYZ') {
      responseConfig.port = serverWithPorts?.port || config.port || 2302;
    } else if (server.gameType === 'CS2') {
      responseConfig.port = serverWithPorts?.port || config.port || 27015;
    } else if (server.gameType === 'KILLING_FLOOR_2') {
      responseConfig.port = serverWithPorts?.port || config.port || 7777;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
    } else if (server.gameType === 'TERRARIA') {
      responseConfig.port = serverWithPorts?.port || config.port || 7777;
    } else if (server.gameType === 'V_RISING') {
      responseConfig.port = serverWithPorts?.port || config.port || 27015;
    } else if (server.gameType === 'GROUNDED') {
      responseConfig.port = serverWithPorts?.port || config.port || 7777;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
    } else if (server.gameType === 'SONS_OF_THE_FOREST') {
      responseConfig.port = serverWithPorts?.port || config.port || 8766;
      responseConfig.queryPort = serverWithPorts?.queryPort || (responseConfig.port + 1);
    } else if (server.gameType === 'PROJECT_ZOMBOID') {
      responseConfig.port = serverWithPorts?.port || config.port || 16261;
    } else if (server.gameType === 'DONT_STARVE_TOGETHER') {
      responseConfig.port = serverWithPorts?.port || config.port || 10999;
    } else {
      responseConfig.queryPort = serverWithPorts?.queryPort || (gameConfig.queryPort || config.port + 1);
      responseConfig.beaconPort = serverWithPorts?.beaconPort || (gameConfig.beaconPort || (gameConfig.queryPort ? gameConfig.queryPort + 1 : config.port + 2));
    }

    return NextResponse.json({
      success: true,
      startCommand,
      source: 'generated',
      config: responseConfig,
    });
  } catch (error: any) {
    console.error('Start command fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az indító sor lekérése során: ' + error.message },
      { status: 500 }
    );
  }
}

