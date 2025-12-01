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
        port: true,
        agentId: true,
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

    // The Forest esetén a szerver nevet a konfigurációból vesszük (servername), ha nincs, akkor a server.name-t használjuk
    let config = (server.configuration as any) || {};
    let defaults = getDefaultConfig(server.gameType, server.maxPlayers);
    
    // 7 Days to Die-nál beolvassuk a teljes serverconfig.xml fájlt
    if (server.gameType === 'SEVEN_DAYS_TO_DIE' && server.agentId && server.agent?.machine) {
      try {
        const { ALL_GAME_SERVER_CONFIGS } = await import('@/lib/game-server-configs');
        const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];
        if (gameConfig) {
          const configPath = gameConfig.configPath.replace(/{serverId}/g, server.id);
          const machine = server.agent.machine;
          
          // Beolvassuk a serverconfig.xml fájlt
          const xmlResult = await executeSSHCommand(
            {
              host: machine.ipAddress,
              port: machine.sshPort,
              user: machine.sshUser,
              keyPath: machine.sshKeyPath || undefined,
            },
            `cat ${configPath} 2>/dev/null || echo ""`
          );
          
          if (xmlResult.stdout && xmlResult.stdout.trim()) {
            // Parse-oljuk az XML-t és kinyerjük az összes property-t
            const xmlContent = xmlResult.stdout.trim();
            const propertyRegex = /<property\s+name="([^"]+)"\s+value="([^"]*)"\s*\/?>/g;
            const parsedConfig: any = {};
            let match;
            
            while ((match = propertyRegex.exec(xmlContent)) !== null) {
              const propName = match[1];
              const propValue = match[2];
              
              // Kihagyjuk a ServerPort és ServerMaxPlayerCount mezőket
              if (propName !== 'ServerPort' && propName !== 'ServerMaxPlayerCount') {
                // GameWorld speciális kezelése
                if (propName === 'GameWorld') {
                  const knownWorlds = ['Navezgane', 'Pregen06k', 'Pregen08k', 'Pregen10k', 'RWG'];
                  if (knownWorlds.includes(propValue)) {
                    parsedConfig[propName] = propValue;
                  } else {
                    // Ha nem ismert térkép, akkor Custom
                    parsedConfig[propName] = 'CUSTOM';
                    parsedConfig.CustomMapName = propValue;
                  }
                } else {
                  // Próbáljuk meg számként értelmezni, ha lehet
                  const numValue = Number(propValue);
                  if (!isNaN(numValue) && propValue.trim() !== '' && !isNaN(parseFloat(propValue))) {
                    parsedConfig[propName] = numValue;
                  } else if (propValue === 'true' || propValue === 'false') {
                    parsedConfig[propName] = propValue === 'true';
                  } else {
                    parsedConfig[propName] = propValue;
                  }
                }
              }
            }
            
            // A parsedConfig-et használjuk config-ként, és a defaults-et is frissítjük
            config = { ...parsedConfig };
            defaults = { ...parsedConfig };
          }
        }
      } catch (error) {
        logger.warn('Failed to read 7 Days to Die config file, using defaults', error as Error);
        // Ha hiba van, használjuk az alapértelmezett konfigurációt
      }
    }
    
    // Ha a szerver neve változott a konfigurációban, akkor azt használjuk
    if (server.gameType === 'THE_FOREST' && config.servername && typeof config.servername === 'string') {
      defaults.servername = config.servername;
    }

    // Satisfactory esetén a tényleges portokat használjuk (amiket a rendszer generált)
    if (server.gameType === 'SATISFACTORY') {
      const { ALL_GAME_SERVER_CONFIGS } = await import('@/lib/game-server-configs');
      const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];
      if (gameConfig && server.port) {
        // A tényleges portokat beállítjuk - ezeket a rendszer generálta
        const actualGamePort = server.port;
        const actualBeaconPort = gameConfig.beaconPort || 15000;
        const actualQueryPort = gameConfig.queryPort || 7777;
        
        // A defaults-ben a tényleges portokat használjuk
        defaults.GamePort = actualGamePort;
        defaults.BeaconPort = actualBeaconPort;
        defaults.QueryPort = actualQueryPort;
        
        // A config-ban is frissítjük a tényleges portokat
        config.GamePort = actualGamePort;
        config.BeaconPort = actualBeaconPort;
        config.QueryPort = actualQueryPort;
      }
      // MaxPlayers nem módosítható - a tényleges értéket használjuk
      defaults.MaxPlayers = server.maxPlayers;
      config.MaxPlayers = server.maxPlayers;
    }

    return NextResponse.json({
      success: true,
      config: config,
      defaults: defaults,
      // Mezők, amiket nem lehet módosítani
      readonlyFields: server.gameType === 'SATISFACTORY' 
        ? ['GamePort', 'BeaconPort', 'QueryPort', 'MaxPlayers']
        : server.gameType === 'SEVEN_DAYS_TO_DIE'
        ? ['ServerPort', 'ServerMaxPlayerCount'] // 7 Days to Die-nál a port és max players nem módosítható
        : [],
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
    let { configuration } = body;

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

    // Readonly mezők ellenőrzése - nem engedélyezzük a módosításukat
    const readonlyFields: string[] = [];
    if (server.gameType === 'SATISFACTORY') {
      readonlyFields.push('GamePort', 'BeaconPort', 'QueryPort', 'MaxPlayers');
    } else if (server.gameType === 'SEVEN_DAYS_TO_DIE') {
      readonlyFields.push('ServerPort', 'ServerMaxPlayerCount');
    }
    
    // Ha readonly mezőket próbálnak módosítani, eltávolítjuk őket
    if (readonlyFields.length > 0 && configuration) {
      const currentConfig = (server.configuration as any) || {};
      readonlyFields.forEach((field) => {
        // Visszaállítjuk az eredeti értékeket
        if (configuration[field] !== undefined && configuration[field] !== currentConfig[field]) {
          configuration[field] = currentConfig[field] || server.port || (field === 'MaxPlayers' ? server.maxPlayers : undefined);
        }
      });
    }

    // The Forest esetén a szerver nevet is frissítjük, ha változott
    let updateData: any = {
      configuration: configuration || server.configuration,
    };

    // Ha a The Forest szerver neve változott, frissítjük a server.name mezőt is
    if (server.gameType === 'THE_FOREST' && configuration?.servername) {
      updateData.name = configuration.servername;
    }

    // Konfiguráció frissítése
    const updatedServer = await prisma.server.update({
      where: { id },
      data: updateData,
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
        case 'SATISFACTORY':
          // Satisfactory Linux szerver konfigurációs mappa: ~/.config/Epic/FactoryGame/Saved/Config/LinuxServer/
          configPath = `/home/satis/.config/Epic/FactoryGame/Saved/Config/LinuxServer/GameUserSettings.ini`;
          break;
        default:
          configPath = `${serverPath}/server.cfg`;
      }

      // Konfiguráció fájlba írása (JSON-ból játék specifikus formátumba konvertálva)
      // 7 Days to Die-nál a ServerPort és ServerMaxPlayerCount értékeket az adatbázisból vesszük
      let configToSave = { ...configuration };
      if (server.gameType === 'SEVEN_DAYS_TO_DIE') {
        // A ServerPort és ServerMaxPlayerCount értékeket az adatbázisból vesszük
        configToSave.ServerPort = server.port || 26900;
        configToSave.ServerMaxPlayerCount = server.maxPlayers;
      }
      
      const configContent = convertConfigToGameFormat(server.gameType, configToSave);
      
      if (configContent) {
        // Satisfactory esetén satis felhasználóként írjuk a fájlt
        // 7 Days to Die-nál seven{serverId} felhasználóként írjuk a fájlt
        let writeCommand: string;
        if (server.gameType === 'SATISFACTORY') {
          writeCommand = `sudo -u satis mkdir -p $(dirname ${configPath}) && sudo -u satis cat > ${configPath} << 'CONFIG_EOF'\n${configContent}\nCONFIG_EOF`;
        } else if (server.gameType === 'SEVEN_DAYS_TO_DIE') {
          const serverUser = `seven${server.id}`;
          // Először írjuk a fájlt, majd külön állítsuk be a jogosultságokat
          writeCommand = `sudo -u ${serverUser} mkdir -p $(dirname ${configPath}) && sudo -u ${serverUser} bash -c "cat > ${configPath} << 'CONFIG_EOF'\n${configContent}\nCONFIG_EOF"`;
        } else {
          writeCommand = `mkdir -p $(dirname ${configPath}) && cat > ${configPath} << 'CONFIG_EOF'\n${configContent}\nCONFIG_EOF`;
        }
        
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          writeCommand
        );

        // 7 Days to Die-nál külön állítjuk be a jogosultságokat, hogy ne kerüljenek a fájlba
        if (server.gameType === 'SEVEN_DAYS_TO_DIE') {
          const serverUser = `seven${server.id}`;
          await executeSSHCommand(
            {
              host: machine.ipAddress,
              port: machine.sshPort,
              user: machine.sshUser,
              keyPath: machine.sshKeyPath || undefined,
            },
            `chown ${serverUser}:sfgames ${configPath} && chmod 644 ${configPath}`
          );
        }

        logger.info('Server config updated', {
          serverId: id,
          gameType: server.gameType,
          configPath,
        });
        
        // Satisfactory esetén frissítjük a Game.ini fájlban a portot is
        // MINDIG az adatbázisból lekérdezett portot használjuk, nem a configuration.GamePort-ot
        if (server.gameType === 'SATISFACTORY' && server.port) {
          const gameIniPath = configPath.replace('GameUserSettings.ini', 'Game.ini');
          const gamePort = server.port; // Az adatbázisból lekérdezett portot használjuk
          const gameIniContent = `[/Script/Engine.GameNetworkManager]
Port=${gamePort}
TotalNetBandwidth=20000
MaxDynamicBandwidth=10000
MinDynamicBandwidth=1000
`;
          
          await executeSSHCommand(
            {
              host: machine.ipAddress,
              port: machine.sshPort,
              user: machine.sshUser,
              keyPath: machine.sshKeyPath || undefined,
            },
            `sudo -u satis cat > ${gameIniPath} << 'GAME_INI_EOF'\n${gameIniContent}\nGAME_INI_EOF`
          );
          
          logger.info('Satisfactory Game.ini port updated', {
            serverId: id,
            gameIniPath,
            port: gamePort,
          });
        }
      }

      // The Forest és Satisfactory esetén újra kell generálni a systemd service-t, hogy a frissített startCommand-ot használja
      if (server.gameType === 'THE_FOREST' || server.gameType === 'SATISFACTORY') {
        try {
          const { ALL_GAME_SERVER_CONFIGS } = await import('@/lib/game-server-configs');
          const { createSystemdServiceForServer } = await import('@/lib/game-server-installer');
          
          const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];
          if (gameConfig) {
            let finalConfig: any;
            
            if (server.gameType === 'THE_FOREST') {
              // A szerver név a konfigurációból jön (servername), ha nincs, akkor a server.name-t használjuk
              const serverName = configuration?.servername || server.name;
              finalConfig = {
                ...configuration,
                name: serverName,
              };
            } else if (server.gameType === 'SATISFACTORY') {
              // Satisfactory esetén a szerver név a konfigurációból jön (ServerName)
              const serverName = configuration?.ServerName || server.name;
              finalConfig = {
                ...configuration,
                name: serverName,
                port: configuration?.GamePort || server.port || 15777,
                maxPlayers: configuration?.MaxPlayers || server.maxPlayers,
                password: configuration?.ServerPassword || '',
                adminPassword: configuration?.AdminPassword || 'changeme123',
              };
            }

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

            logger.info(`Systemd service regenerated for ${server.gameType} server`, {
              serverId: id,
            });
          }
        } catch (error) {
          logger.error(`Failed to regenerate systemd service for ${server.gameType}`, error as Error, {
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
      GameWorld: 'Pregen08k', // Alapértelmezett: Pregen 8k (Standard)
      WorldGenSeed: '',
      WorldGenSize: 8192,
      ServerPassword: '',
      ServerDescription: '',
      CustomMapName: '',
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
    SATISFACTORY: {
      ServerName: 'Satisfactory Server',
      ServerPassword: '',
      AdminPassword: 'changeme123',
      MaxPlayers: maxPlayers,
      GamePort: 15777,
      BeaconPort: 15000,
      QueryPort: 7777,
      Autopause: false,
      AutoSaveOnDisconnect: true,
      AutoSaveInterval: 5,
      NetworkQuality: 3,
      FriendlyFire: false,
      AutoArmor: true,
      EnableCheats: false,
      GamePhase: 1,
      StartingPhase: 1,
      SkipTutorial: false,
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
      // 7 Days to Die-nál a teljes XML struktúrát generáljuk
      // A ServerPort és ServerMaxPlayerCount értékeket az adatbázisból vesszük
      const serverPort = config.ServerPort || 26900;
      const serverMaxPlayers = config.ServerMaxPlayerCount || 8;
      
      // Eltávolítjuk a ServerPort és ServerMaxPlayerCount mezőket a config-ból, mert azokat külön kezeljük
      const { ServerPort: _, ServerMaxPlayerCount: __, CustomMapName: ___, ...configWithoutPorts } = config;
      
      // Ha Custom térkép van kiválasztva, a GameWorld értékét a CustomMapName-re állítjuk
      if (config.GameWorld === 'CUSTOM' && config.CustomMapName) {
        configWithoutPorts.GameWorld = config.CustomMapName;
      }
      
      // Ha nem RWG, akkor eltávolítjuk a WorldGenSeed és WorldGenSize mezőket
      if (configWithoutPorts.GameWorld !== 'RWG') {
        delete configWithoutPorts.WorldGenSeed;
        delete configWithoutPorts.WorldGenSize;
      }
      
      let xmlConfig = '<?xml version="1.0" encoding="UTF-8"?>\n<ServerSettings>\n';
      
      // Először a ServerPort és ServerMaxPlayerCount (ezek fix értékek)
      xmlConfig += `    <property name="ServerPort" value="${serverPort}"/>\n`;
      xmlConfig += `    <property name="ServerMaxPlayerCount" value="${serverMaxPlayers}"/>\n`;
      
      // Aztán az összes többi property
      xmlConfig += Object.entries(configWithoutPorts)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => {
          // Escape XML speciális karakterek
          const escapedValue = String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          return `    <property name="${key}" value="${escapedValue}"/>`;
        })
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
    
    case 'SATISFACTORY':
      // Satisfactory konfiguráció - GameUserSettings.ini formátum
      return `[/Script/Engine.GameSession]
MaxPlayers=${config.MaxPlayers || 4}

[/Script/FactoryGame.FGServerSubsystem]
ServerName="${config.ServerName || 'Satisfactory Server'}"
ServerPassword="${config.ServerPassword || ''}"
AdminPassword="${config.AdminPassword || 'changeme123'}"
GamePort=${config.GamePort || 15777}
BeaconPort=${config.BeaconPort || 15000}
QueryPort=${config.QueryPort || 7777}
Autopause=${config.Autopause !== undefined ? config.Autopause : false}
AutoSaveOnDisconnect=${config.AutoSaveOnDisconnect !== undefined ? config.AutoSaveOnDisconnect : true}
AutoSaveInterval=${config.AutoSaveInterval || 5}
NetworkQuality=${config.NetworkQuality || 3}
FriendlyFire=${config.FriendlyFire !== undefined ? config.FriendlyFire : false}
AutoArmor=${config.AutoArmor !== undefined ? config.AutoArmor : true}
EnableCheats=${config.EnableCheats !== undefined ? config.EnableCheats : false}
GamePhase=${config.GamePhase || 1}
StartingPhase=${config.StartingPhase || 1}
SkipTutorial=${config.SkipTutorial !== undefined ? config.SkipTutorial : false}
`;
    
    default:
      return JSON.stringify(config, null, 2);
  }
}

