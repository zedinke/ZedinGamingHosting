import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';

// GET - Szerver konfiguráció lekérése (felhasználó)
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
      select: {
        id: true,
        userId: true,
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

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // The Forest esetén a szerver nevet a konfigurációból vesszük (servername), ha nincs, akkor a server.name-t használjuk
    const config = (server.configuration as any) || {};
    const defaults = getDefaultConfig(server.gameType, server.maxPlayers);
    
    // Ha a szerver neve változott a konfigurációban, akkor azt használjuk
    if (server.gameType === 'THE_FOREST' && config.servername && typeof config.servername === 'string') {
      defaults.servername = config.servername;
    }

    return NextResponse.json({
      success: true,
      config: config,
      defaults: defaults,
    });
  } catch (error) {
    logger.error('Get server config error', error as Error, {
      serverId: params.id,
    });
    return NextResponse.json(
      { error: 'Hiba történt a konfiguráció lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Szerver konfiguráció frissítése (felhasználó)
export async function PUT(
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
    const { configuration } = body;

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

    // Konfiguráció frissítése
    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        configuration: configuration || server.configuration,
      },
    });

    // Konfiguráció alkalmazása SSH-n keresztül
    if (server.agentId && server.agent?.machine) {
      const machine = server.agent.machine;
      
      // Konfigurációs fájl elérési út meghatározása
      const isARK = server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED';
      let serverPath: string;
      
      if (isARK) {
        const { getARKSharedPath } = await import('@/lib/ark-cluster');
        const sharedPath = getARKSharedPath(server.userId, server.machineId!);
        serverPath = `${sharedPath}/instances/${server.id}`;
      } else {
        serverPath = `/opt/servers/${server.id}`;
      }
      
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
          configPath = `${serverPath}/server/server.cfg`;
          break;
        case 'VALHEIM':
          configPath = `${serverPath}/start_server.sh`;
          break;
        case 'SEVEN_DAYS_TO_DIE':
          configPath = `${serverPath}/serverconfig.xml`;
          break;
        case 'PALWORLD':
          configPath = `${serverPath}/DefaultPalWorldSettings.ini`;
          break;
        case 'CSGO':
        case 'CS2':
          configPath = `${serverPath}/csgo/cfg/server.cfg`;
          break;
        case 'THE_FOREST':
          configPath = `${serverPath}/server.cfg`;
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

        logger.info('Server config updated', {
          serverId: id,
          gameType: server.gameType,
          configPath,
        });
      }

      // The Forest esetén újra kell generálni a systemd service-t, hogy a frissített startCommand-ot használja
      if (server.gameType === 'THE_FOREST') {
        try {
          const { ALL_GAME_SERVER_CONFIGS } = await import('@/lib/game-server-configs');
          const { createSystemdServiceForServer } = await import('@/lib/game-server-installer');
          
          const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];
          if (gameConfig) {
            // A szerver név a konfigurációból jön (servername), ha nincs, akkor a server.name-t használjuk
            const serverName = configuration?.servername || server.name;
            const finalConfig = {
              ...configuration,
              name: serverName,
            };

            await createSystemdServiceForServer(
              server.id,
              server.gameType,
              gameConfig,
              finalConfig,
              machine,
              {
                isARK: false,
                sharedPath: null,
                serverPath: `/opt/servers/${server.id}`,
              }
            );

            logger.info('Systemd service regenerated for The Forest server', {
              serverId: id,
            });
          }
        } catch (error) {
          logger.error('Failed to regenerate systemd service for The Forest', error as Error, {
            serverId: id,
          });
          // Nem dobunk hibát, mert a konfiguráció már frissítve lett
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Konfiguráció sikeresen frissítve',
      config: updatedServer.configuration,
    });
  } catch (error) {
    logger.error('Update server config error', error as Error, {
      serverId: params.id,
    });
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
      'server-name': 'Minecraft Server',
      difficulty: 'normal',
      gamemode: 'survival',
      'max-players': maxPlayers,
      'view-distance': 10,
      'online-mode': true,
      pvp: true,
      'spawn-protection': 16,
      'white-list': false,
      'motd': 'A Minecraft Server',
    },
    ARK_EVOLVED: {
      ServerName: 'ARK: Survival Evolved Server',
      MaxPlayers: maxPlayers,
      DifficultyOffset: 0.2,
      HarvestAmountMultiplier: 1.0,
      TamingSpeedMultiplier: 1.0,
      XPMultiplier: 1.0,
      PvP: false,
      ServerAdminPassword: '',
      ServerPassword: '',
    },
    ARK_ASCENDED: {
      ServerName: 'ARK: Survival Ascended Server',
      MaxPlayers: maxPlayers,
      DifficultyOffset: 0.2,
      HarvestAmountMultiplier: 1.0,
      TamingSpeedMultiplier: 1.0,
      XPMultiplier: 1.0,
      PvP: false,
      ServerAdminPassword: '',
      ServerPassword: '',
    },
    RUST: {
      hostname: 'Rust Server',
      maxplayers: maxPlayers,
      seed: Math.floor(Math.random() * 2147483647),
      worldsize: 3000,
      saveinterval: 600,
      serverurl: '',
      serverdescription: '',
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
      ServerPassword: '',
      ServerDescription: '',
    },
    PALWORLD: {
      ServerName: 'Palworld Server',
      ServerDescription: '',
      ServerPassword: '',
      AdminPassword: '',
      PublicPort: 8211,
      PublicIP: '',
      MaxPlayers: maxPlayers,
      Region: '',
    },
    CSGO: {
      hostname: 'CS:GO Server',
      maxplayers: maxPlayers,
      sv_region: 255,
      sv_password: '',
      rcon_password: '',
      sv_lan: 0,
    },
    CS2: {
      hostname: 'CS2 Server',
      maxplayers: maxPlayers,
      sv_region: 255,
      sv_password: '',
      rcon_password: '',
      sv_lan: 0,
    },
    CONAN_EXILES: {
      ServerName: 'Conan Exiles Server',
      MaxPlayers: maxPlayers,
      ServerPassword: '',
      AdminPassword: '',
      PvPEnabled: false,
    },
    DAYZ: {
      hostname: 'DayZ Server',
      maxPlayers: maxPlayers,
      password: '',
      passwordAdmin: '',
    },
    PROJECT_ZOMBOID: {
      ServerName: 'Project Zomboid Server',
      MaxPlayers: maxPlayers,
      PauseEmpty: true,
      PublicName: '',
      PublicDescription: '',
      Password: '',
      AdminPassword: '',
    },
    V_RISING: {
      Name: 'V Rising Server',
      Description: '',
      Port: 27015,
      QueryPort: 27016,
      MaxConnectedUsers: maxPlayers,
      Password: '',
    },
    THE_FOREST: {
      servername: 'The Forest Server',
      serverpassword: '',
      serverplayers: maxPlayers,
      serverautosaveinterval: 15,
      difficulty: 'Normal',
      inittype: 'Continue',
      enableVAC: 'on',
      // IP, port, slot NEM változtatható (csomaghoz kötött)
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
      let arkConfig = '[ServerSettings]\n';
      arkConfig += Object.entries(config)
        .map(([key, value]) => {
          if (typeof value === 'boolean') {
            return `${key}=${value ? 'True' : 'False'}`;
          }
          return `${key}=${value}`;
        })
        .join('\n');
      return arkConfig;
    
    case 'RUST':
      return Object.entries(config)
        .map(([key, value]) => `${key} "${value}"`)
        .join('\n');
    
    case 'VALHEIM':
      return `#!/bin/bash\n./valheim_server.x86_64 -name "${config.name || 'Valheim Server'}" -port 2456 -world "${config.world || 'Dedicated'}" -password "${config.password || ''}" -public ${config.public || 1}`;
    
    case 'SEVEN_DAYS_TO_DIE':
      let xmlConfig = '<?xml version="1.0" encoding="UTF-8"?>\n<ServerSettings>\n';
      xmlConfig += Object.entries(config)
        .map(([key, value]) => `  <property name="${key}" value="${value}"/>`)
        .join('\n');
      xmlConfig += '\n</ServerSettings>';
      return xmlConfig;
    
    case 'PALWORLD':
      return Object.entries(config)
        .map(([key, value]) => {
          if (typeof value === 'boolean') {
            return `${key}=${value ? 'True' : 'False'}`;
          }
          return `${key}=${value}`;
        })
        .join('\n');
    
    case 'CSGO':
    case 'CS2':
      return Object.entries(config)
        .map(([key, value]) => `${key} "${value}"`)
        .join('\n');
    
    case 'THE_FOREST':
      // The Forest konfiguráció - a server.cfg fájlba írjuk, de a startCommand-ban is használjuk
      // A konfigurációs fájl csak dokumentációként szolgál, a tényleges beállítások a startCommand-ban vannak
      return `# The Forest Dedicated Server Configuration
# Generated automatically
# Note: Most settings are applied via command line parameters in startCommand

# Server Name
serverName="${config.servername || 'The Forest Server'}"

# Server Password (leave empty for no password)
serverPassword="${config.serverpassword || ''}"

# Max Players
maxPlayers=${config.serverplayers || 8}

# Auto Save Interval (minutes)
serverautosaveinterval=${config.serverautosaveinterval || 15}

# Difficulty: Normal, Hard, Hard Survival
difficulty=${config.difficulty || 'Normal'}

# Init Type: Continue, New
inittype=${config.inittype || 'Continue'}

# VAC Enabled: on, off
enableVAC=${config.enableVAC || 'on'}

# Note: IP, port, slot are fixed and cannot be changed (package-bound)
`;
    
    default:
      return JSON.stringify(config, null, 2);
  }
}

