import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Szerver konfiguráció lekérése
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
        gameType: true,
        configuration: true,
        maxPlayers: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: server.configuration || {},
      defaults: getDefaultConfig(server.gameType, server.maxPlayers),
    });
  } catch (error) {
    console.error('Get server config error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a konfiguráció lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Szerver konfiguráció frissítése
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
    const { configuration } = body;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Konfiguráció frissítése
    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        configuration: configuration || server.configuration,
      },
    });

    // Konfiguráció alkalmazása SSH-n keresztül
    if (server.agentId) {
      const serverWithAgent = await prisma.server.findUnique({
        where: { id },
        include: {
          agent: {
            include: {
              machine: true,
            },
          },
        },
      });

      if (serverWithAgent?.agent?.machine) {
        const { executeSSHCommand } = await import('@/lib/ssh-client');
        const machine = serverWithAgent.agent.machine;
        
        // Konfigurációs fájl elérési út meghatározása
        const serverPath = (server.configuration as any)?.instancePath || 
                          (server.configuration as any)?.sharedPath || 
                          `/opt/servers/${id}`;
        
        let configPath = '';
        switch (server.gameType) {
          case 'MINECRAFT':
            configPath = `${serverPath}/server.properties`;
            break;
          case 'ARK_EVOLVED':
          case 'ARK_ASCENDED':
            configPath = `${serverPath}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini`;
            break;
          case 'RUST':
            configPath = `${serverPath}/server.cfg`;
            break;
          case 'VALHEIM':
            configPath = `${serverPath}/start_server.sh`;
            break;
          default:
            configPath = `${serverPath}/server.cfg`;
        }

        // Konfiguráció fájlba írása (JSON-ból játék specifikus formátumba konvertálva)
        const configContent = convertConfigToGameFormat(server.gameType, configuration);
        
        if (configContent) {
          await executeSSHCommand(
            {
              host: machine.ipAddress,
              port: machine.sshPort,
              user: machine.sshUser,
              keyPath: machine.sshKeyPath || undefined,
            },
            `mkdir -p $(dirname ${configPath}) && cat > ${configPath} << 'CONFIG_EOF'\n${configContent}\nCONFIG_EOF`
          );

          // Szerver újraindítása, hogy a változások érvénybe lépjenek
          if (server.status === 'ONLINE') {
            await executeSSHCommand(
              {
                host: machine.ipAddress,
                port: machine.sshPort,
                user: machine.sshUser,
                keyPath: machine.sshKeyPath || undefined,
              },
              `systemctl restart server-${id}`
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Konfiguráció sikeresen frissítve',
      config: updatedServer.configuration,
    });
  } catch (error) {
    console.error('Update server config error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a konfiguráció frissítése során' },
      { status: 500 }
    );
  }
}

/**
 * Alapértelmezett konfiguráció játék típus alapján
 */
function getDefaultConfig(gameType: string, maxPlayers: number): any {
  const defaults: Record<string, any> = {
    MINECRAFT: {
      serverName: 'Minecraft Server',
      difficulty: 'normal',
      gamemode: 'survival',
      maxPlayers: maxPlayers,
      viewDistance: 10,
      onlineMode: true,
      pvp: true,
      spawnProtection: 16,
      whitelist: false,
    },
    ARK_EVOLVED: {
      serverName: 'ARK: Survival Evolved Server',
      maxPlayers: maxPlayers,
      difficultyOffset: 0.2,
      harvestAmountMultiplier: 1.0,
      tamingSpeedMultiplier: 1.0,
      xpMultiplier: 1.0,
      pvp: false,
    },
    ARK_ASCENDED: {
      serverName: 'ARK: Survival Ascended Server',
      maxPlayers: maxPlayers,
      difficultyOffset: 0.2,
      harvestAmountMultiplier: 1.0,
      tamingSpeedMultiplier: 1.0,
      xpMultiplier: 1.0,
      pvp: false,
    },
    CSGO: {
      hostname: 'CS:GO Server',
      maxPlayers: maxPlayers,
      tickrate: 64,
      svRegion: 255, // World
      svPassword: '',
      rconPassword: '',
    },
    RUST: {
      hostname: 'Rust Server',
      maxPlayers: maxPlayers,
      seed: Math.floor(Math.random() * 2147483647),
      worldSize: 3000,
      saveInterval: 600,
    },
    VALHEIM: {
      name: 'Valheim Server',
      world: 'Dedicated',
      password: '',
      public: 1,
    },
    SEVEN_DAYS_TO_DIE: {
      ServerName: '7 Days to Die Server',
      ServerPort: 26900,
      ServerMaxPlayerCount: maxPlayers,
      GameDifficulty: 2,
      GameWorld: 'Navezgane',
    },
  };

  return defaults[gameType] || {};
}

/**
 * Konfiguráció konvertálása játék specifikus formátumba
 */
function convertConfigToGameFormat(gameType: string, config: any): string {
  switch (gameType) {
    case 'MINECRAFT':
      return Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    case 'ARK_EVOLVED':
    case 'ARK_ASCENDED':
      return `[ServerSettings]\n${Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')}`;
    
    case 'RUST':
    case 'CSGO':
    case 'CS2':
      return Object.entries(config)
        .map(([key, value]) => `${key} "${value}"`)
        .join('\n');
    
    case 'VALHEIM':
      return `#!/bin/bash\n./valheim_server.x86_64 -name "${config.name}" -port 2456 -world "${config.world}" -password "${config.password}" -public ${config.public}`;
    
    default:
      return JSON.stringify(config, null, 2);
  }
}

