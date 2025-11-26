/**
 * Game szerver telepítő
 * 30 legnépszerűbb Steam játék támogatása
 * ARK Cluster funkcionalitással
 */

import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from './ssh-client';
import { GameType } from '@prisma/client';
import { ALL_GAME_SERVER_CONFIGS } from './game-server-configs';
import { addServerToCluster, createClusterFolder } from './ark-cluster';
import { logger } from './logger';

/**
 * Game szerver telepítése
 */
export async function installGameServer(
  serverId: string,
  gameType: GameType,
  config: {
    maxPlayers: number;
    ram: number;
    port: number;
    name: string;
    world?: string;
    password?: string;
    adminPassword?: string;
    clusterId?: string; // ARK Cluster ID (ha van)
    map?: string; // ARK map (TheIsland, TheCenter, Ragnarok, stb.)
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Installing game server', {
      serverId,
      gameType,
      config: { ...config, password: '***' },
    });

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
        user: true,
      },
    });

    if (!server || !server.agent) {
      return {
        success: false,
        error: 'Szerver vagy agent nem található',
      };
    }

    const machine = server.agent.machine;
    const gameConfig = ALL_GAME_SERVER_CONFIGS[gameType];

    if (!gameConfig || gameType === 'OTHER') {
      return {
        success: false,
        error: 'Játék típus nem támogatott automatikus telepítéshez',
      };
    }

    // ARK játékoknál közös fájlokat használunk felhasználó + szervergép kombinációként
    // Minden szervergépen külön shared mappa van felhasználónként
    const isARK = gameType === 'ARK_EVOLVED' || gameType === 'ARK_ASCENDED';
    const { getARKSharedPath } = await import('./ark-cluster');
    const sharedPath = isARK ? getARKSharedPath(server.userId, machine.id) : null;
    const serverPath = isARK ? `${sharedPath}/instances/${serverId}` : `/opt/servers/${serverId}`;

    // Szerver könyvtár létrehozása
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `mkdir -p ${serverPath}`
    );

    // Függőségek telepítése
    if (gameConfig.requiresJava) {
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `which java || (apt-get update && apt-get install -y openjdk-17-jre-headless)`
      );
    }

    if (gameConfig.requiresWine) {
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `which wine || (apt-get update && apt-get install -y wine64)`
      );
    }

    // Telepítési script generálása (csak ha nem ARK, vagy ha még nincs telepítve)
    if (!isARK || !(await checkARKSharedInstallation(server.userId, machine.id, gameType, machine))) {
      let installScript = gameConfig.installScript;
      
      // ARK-nál a közös path-ot használjuk
      if (isARK && sharedPath) {
        installScript = installScript.replace(/\/opt\/servers\/\{serverId\}/g, sharedPath);
      }
      
      // Placeholder-ek cseréje
      installScript = installScript
        .replace(/{serverId}/g, serverId)
        .replace(/{port}/g, config.port.toString())
        .replace(/{maxPlayers}/g, config.maxPlayers.toString())
        .replace(/{ram}/g, config.ram.toString())
        .replace(/{name}/g, config.name)
        .replace(/{world}/g, config.world || 'Dedicated')
        .replace(/{password}/g, config.password || '')
        .replace(/{adminPassword}/g, config.adminPassword || 'changeme')
        .replace(/{queryPort}/g, (gameConfig.queryPort || config.port + 1).toString());

      // Script fájl létrehozása és futtatása
      const scriptPath = `/tmp/install-${isARK ? `ark-shared-${server.userId}` : serverId}.sh`;
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `cat > ${scriptPath} << 'EOF'\n${installScript}\nEOF`
      );

      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `chmod +x ${scriptPath} && ${scriptPath}`
      );
    }

    // Konfigurációs fájl létrehozása
    const configContent = generateConfigFile(gameType, config, gameConfig);
    if (configContent) {
      let configPath = gameConfig.configPath;
      
      // ARK-nál az instance path-ot használjuk a konfigurációhoz
      if (isARK && sharedPath) {
        configPath = `${serverPath}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini`;
      } else {
        configPath = configPath.replace(/{serverId}/g, serverId);
      }
      
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `mkdir -p $(dirname ${configPath}) && cat > ${configPath} << 'EOF'\n${configContent}\nEOF`
      );
    }

    // Szerver konfiguráció mentése az adatbázisba (ARK path-okkal)
    if (isARK && sharedPath) {
      const currentConfig = (server.configuration as any) || {};
      await prisma.server.update({
        where: { id: serverId },
        data: {
          configuration: {
            ...currentConfig,
            instancePath: serverPath,
            sharedPath: sharedPath,
            machineId: machine.id, // Szervergép ID mentése
          },
        },
      });
    }

    // ARK Cluster kezelés
    if ((gameType === 'ARK_EVOLVED' || gameType === 'ARK_ASCENDED') && config.clusterId) {
      // Cluster mappa létrehozása (ha még nincs)
      const clusterResult = await createClusterFolder(config.clusterId);
      if (!clusterResult.success) {
        logger.warn('Failed to create cluster folder', { clusterId: config.clusterId });
      }

      // Szerver hozzáadása cluster-hez
      const addToClusterResult = await addServerToCluster(serverId, config.clusterId, machine);
      if (!addToClusterResult.success) {
        logger.warn('Failed to add server to cluster', {
          serverId,
          clusterId: config.clusterId,
          error: addToClusterResult.error,
        });
      } else {
        logger.info('Server added to ARK cluster', {
          serverId,
          clusterId: config.clusterId,
        });
      }
    }

    // Systemd service létrehozása
    await createSystemdServiceForServer(serverId, gameType, gameConfig, config, machine, {
      isARK,
      sharedPath,
      serverPath,
    });

    logger.info('Game server installed successfully', {
      serverId,
      gameType,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error('Game server installation error', error as Error, {
      serverId,
      gameType,
    });
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a szerver telepítése során',
    };
  }
}

/**
 * Konfigurációs fájl generálása
 */
function generateConfigFile(
  gameType: GameType,
  config: any,
  gameConfig: any
): string {
  const queryPort = gameConfig.queryPort || config.port + 1;

  switch (gameType) {
    case 'MINECRAFT':
      return `
server-port=${config.port}
max-players=${config.maxPlayers}
online-mode=false
white-list=false
motd=${config.name}
difficulty=normal
gamemode=survival
      `.trim();

    case 'ARK_EVOLVED':
    case 'ARK_ASCENDED':
      const map = config.map || 'TheIsland';
      return `
[ServerSettings]
ServerAdminPassword=${config.adminPassword || 'changeme'}
MaxPlayers=${config.maxPlayers}
ServerPassword=${config.password || ''}
ServerName=${config.name}
${config.clusterId ? `ClusterDirOverride=/mnt/ark-cluster/${config.clusterId}` : ''}
${config.clusterId ? `ClusterId=${config.clusterId}` : ''}

[/Script/ShooterGame.ShooterGameMode]
      `.trim();

    case 'CS2':
    case 'CSGO':
      return `
hostname "${config.name}"
maxplayers ${config.maxPlayers}
sv_lan 0
rcon_password "${config.password || 'changeme'}"
      `.trim();

    case 'RUST':
      return `
server.hostname "${config.name}"
server.identity "${config.name}"
server.maxplayers ${config.maxPlayers}
server.port ${config.port}
server.queryport ${queryPort}
      `.trim();

    case 'VALHEIM':
      return `
# Valheim Server Config
# Generated automatically
      `.trim();

    case 'SEVEN_DAYS_TO_DIE':
      return `
<property name="ServerName" value="${config.name}"/>
<property name="ServerPort" value="${config.port}"/>
<property name="ServerMaxPlayerCount" value="${config.maxPlayers}"/>
<property name="ServerPassword" value="${config.password || ''}"/>
      `.trim();

    case 'PALWORLD':
      return `
[/Script/Pal.PalGameWorldSettings]
OptionSettings=(
  Difficulty=None,
  DayTimeSpeedRate=1.000000,
  NightTimeSpeedRate=1.000000,
  ExpRate=1.000000,
  PalCaptureRate=1.000000,
  PalSpawnNumRate=1.000000,
  PalDamageRateAttack=1.000000,
  PalDamageRateDefense=1.000000,
  PlayerDamageRateAttack=1.000000,
  PlayerDamageRateDefense=1.000000,
  PlayerStaminaRateConsume=1.000000,
  PlayerAutoHPRegeneRate=1.000000,
  PlayerAutoHpRegeneRateInSleep=1.000000,
  PalStaminaRateConsume=1.000000,
  PalAutoHPRegeneRate=1.000000,
  PalAutoHpRegeneRateInSleep=1.000000,
  BuildObjectDamageRate=1.000000,
  BuildObjectDeteriorationDamageRate=1.000000,
  CollectionDropRate=1.000000,
  CollectionObjectHpRate=1.000000,
  CollectionObjectRespawnSpeedRate=1.000000,
  EnemyDropItemRate=1.000000,
  DeathPenalty=None,
  bEnablePlayerToPlayerDamage=False,
  bEnableFriendlyFire=False,
  bEnableInvaderEnemy=True,
  bActiveUNKO=False,
  bEnableAimAssistPad=True,
  bEnableAimAssistKeyboard=False,
  DropItemMaxNum=3000,
  DropItemMaxNum_UNKO=100,
  BaseCampMaxNum=128,
  BaseCampWorkerMaxNum=15,
  GuildPlayerMaxNum=20,
  PalEggDefaultHatchingTime=72.000000,
  WorkSpeedRate=1.000000,
  bIsMultiplay=False,
  bIsPvP=False,
  bCanPickupOtherGuildDeathPenaltyDrop=False,
  bEnableNonLoginPenalty=True,
  bEnableFastTravel=True,
  bIsStartLocationSelectByMap=True,
  bExistPlayerAfterLogout=False,
  bEnableDefenseOtherGuildPlayer=False,
  CoopPlayerMaxNum=4,
  ServerPlayerMaxNum=32,
  ServerName="${config.name}",
  ServerDescription="",
  AdminPassword="${config.adminPassword || 'changeme'}",
  ServerPassword="${config.password || ''}",
  PublicPort=${config.port},
  PublicIP="",
  RCONEnabled=True,
  RCONPort=25575,
  Region="",
  bUseAuth=True,
  BanListURL="https://api.palworldgame.com/api/banlist.txt"
)
      `.trim();

    default:
      return '';
  }
}

/**
 * ARK közös telepítés ellenőrzése
 */
async function checkARKSharedInstallation(
  userId: string,
  machineId: string,
  gameType: GameType,
  machine: any
): Promise<boolean> {
  const { getARKSharedPath } = await import('./ark-cluster');
  const sharedPath = getARKSharedPath(userId, machineId);
  try {
    const checkCommand = gameType === 'ARK_EVOLVED'
      ? `test -f ${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer && echo "installed" || echo "not_installed"`
      : `test -f ${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer && echo "installed" || echo "not_installed"`;
    
    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      checkCommand
    );

    return result.stdout?.includes('installed') || false;
  } catch (error) {
    logger.warn('Failed to check ARK shared installation', { sharedPath, gameType });
    return false;
  }
}

/**
 * ARK közös fájlok telepítése
 * Felhasználó + szervergép kombinációhoz telepíti az ARK fájlokat
 */
async function installARKSharedFiles(
  sharedPath: string,
  gameType: GameType,
  machine: any
): Promise<void> {
  const steamAppId = gameType === 'ARK_EVOLVED' ? 376030 : 2430930;
  
  logger.info('Installing ARK shared files', { 
    sharedPath, 
    gameType, 
    steamAppId,
    machineId: machine.id 
  });
  
  const installScript = `
    #!/bin/bash
    set -e
    echo "Creating shared directory: ${sharedPath}"
    mkdir -p ${sharedPath}
    cd ${sharedPath}
    
    # SteamCMD letöltése ha nincs
    if [ ! -f steamcmd.sh ]; then
      echo "Downloading SteamCMD..."
      wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
    fi
    
    # ARK szerver fájlok letöltése
    echo "Installing ARK server files (this may take a while)..."
    ./steamcmd.sh +force_install_dir ${sharedPath} +login anonymous +app_update ${steamAppId} validate +quit
    
    # Szükséges könyvtárak létrehozása
    mkdir -p ShooterGame/Saved/Config/LinuxServer
    mkdir -p ShooterGame/Saved/SavedArks
    
    echo "ARK shared files installation completed"
  `;

  const scriptPath = `/tmp/install-ark-shared-${machine.id}-${Date.now()}.sh`;
  
  try {
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `cat > ${scriptPath} << 'EOF'\n${installScript}\nEOF && chmod +x ${scriptPath}`
    );

    // Script futtatása háttérben (hosszú folyamat lehet)
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `nohup ${scriptPath} > ${sharedPath}/install.log 2>&1 &`
    );

    logger.info('ARK shared files installation started', { 
      sharedPath, 
      gameType,
      machineId: machine.id,
      logFile: `${sharedPath}/install.log`
    });
  } catch (error: any) {
    logger.error('Failed to install ARK shared files', error as Error, {
      sharedPath,
      gameType,
      machineId: machine.id,
    });
    throw error;
  }
}

/**
 * Systemd service létrehozása (exportálva újratelepítéshez)
 */
export async function createSystemdServiceForServer(
  serverId: string,
  gameType: GameType,
  gameConfig: any,
  config: any,
  machine: any,
  paths?: {
    isARK: boolean;
    sharedPath: string | null;
    serverPath: string;
  }
): Promise<void> {
  let startCommand = gameConfig.startCommand;
  
  // ARK-nál a közös fájlokat használjuk, de az instance könyvtárban dolgozunk
  if (paths?.isARK && paths.sharedPath) {
    // ARK start command a közös binárist használja, de az instance Saved könyvtárát
    const map = config.map || 'TheIsland';
    const port = config.port;
    const queryPort = gameConfig.queryPort || config.port + 1;
    const adminPassword = config.adminPassword || 'changeme';
    
    startCommand = `cd ${paths.sharedPath} && ./ShooterGame/Binaries/Linux/ShooterGameServer ${map}?listen?Port=${port}?QueryPort=${queryPort}?ServerAdminPassword=${adminPassword} -servergamelog -servergamelogincludetribelogs -NoBattlEye -UseBattlEye -clusterid=${config.clusterId || ''} -ClusterDirOverride=${paths.serverPath}/ShooterGame/Saved`;
  } else {
    // Normál játékok
    startCommand = startCommand
      .replace(/{port}/g, config.port.toString())
      .replace(/{maxPlayers}/g, config.maxPlayers.toString())
      .replace(/{ram}/g, config.ram.toString())
      .replace(/{name}/g, config.name)
      .replace(/{world}/g, config.world || 'Dedicated')
      .replace(/{password}/g, config.password || '')
      .replace(/{adminPassword}/g, config.adminPassword || 'changeme')
      .replace(/{queryPort}/g, (gameConfig.queryPort || config.port + 1).toString())
      .replace(/{map}/g, config.map || 'TheIsland');
  }

  const workingDir = paths?.serverPath || `/opt/servers/${serverId}`;
  const execDir = paths?.isARK && paths.sharedPath ? paths.sharedPath : workingDir;

  // Escape speciális karakterek a startCommand-ban
  const escapedStartCommand = startCommand.replace(/\$/g, '\\$').replace(/"/g, '\\"');
  
  const serviceContent = `[Unit]
Description=Game Server ${serverId} (${gameType})
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${execDir}
ExecStart=/bin/bash -c "cd ${execDir} && ${escapedStartCommand}"
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target`;

  await executeSSHCommand(
    {
      host: machine.ipAddress,
      port: machine.sshPort,
      user: machine.sshUser,
      keyPath: machine.sshKeyPath || undefined,
    },
    `cat > /etc/systemd/system/server-${serverId}.service << 'EOF'\n${serviceContent}\nEOF && systemctl daemon-reload`
  );

  logger.info('Systemd service created', {
    serverId,
    gameType,
  });
}
