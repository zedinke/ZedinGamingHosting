import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from './ssh-client';
import { GameType } from '@prisma/client';

/**
 * Game szerver telepítési konfigurációk
 */
const GAME_SERVER_CONFIGS: Record<GameType, {
  downloadUrl: string;
  installScript: string;
  configPath: string;
  startCommand: string;
  stopCommand: string;
  port: number;
}> = {
  MINECRAFT: {
    downloadUrl: 'https://piston-data.mojang.com/v1/objects/.../server.jar',
    installScript: `
      #!/bin/bash
      cd /opt/servers/{serverId}
      wget -O server.jar {downloadUrl}
      echo "eula=true" > eula.txt
      mkdir -p plugins worlds logs
    `,
    configPath: '/opt/servers/{serverId}/server.properties',
    startCommand: 'java -Xmx{ram}M -Xms{ram}M -jar server.jar nogui',
    stopCommand: 'stop',
    port: 25565,
  },
  ARK: {
    downloadUrl: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
    installScript: `
      #!/bin/bash
      cd /opt/servers/{serverId}
      steamcmd +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 376030 validate +quit
      mkdir -p ShooterGame/Saved/Config/LinuxServer
    `,
    configPath: '/opt/servers/{serverId}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini',
    startCommand: './ShooterGame/Binaries/Linux/ShooterGameServer TheIsland?listen?Port={port}?QueryPort={queryPort}',
    stopCommand: 'quit',
    port: 7777,
  },
  CSGO: {
    downloadUrl: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
    installScript: `
      #!/bin/bash
      cd /opt/servers/{serverId}
      steamcmd +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 740 validate +quit
      mkdir -p csgo/logs
    `,
    configPath: '/opt/servers/{serverId}/csgo/cfg/server.cfg',
    startCommand: './srcds_run -game csgo -console -usercon +port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },
  RUST: {
    downloadUrl: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
    installScript: `
      #!/bin/bash
      cd /opt/servers/{serverId}
      steamcmd +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 258550 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/server/server.cfg',
    startCommand: './RustDedicated -batchmode -server.port {port} -server.maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 28015,
  },
  VALHEIM: {
    downloadUrl: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
    installScript: `
      #!/bin/bash
      cd /opt/servers/{serverId}
      steamcmd +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 896660 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/start_server.sh',
    startCommand: './valheim_server.x86_64 -name "{name}" -port {port} -world "{world}" -password "{password}"',
    stopCommand: 'quit',
    port: 2456,
  },
  SEVEN_DAYS_TO_DIE: {
    downloadUrl: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
    installScript: `
      #!/bin/bash
      cd /opt/servers/{serverId}
      steamcmd +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 294420 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/serverconfig.xml',
    startCommand: './7DaysToDieServer.x86_64 -configfile=serverconfig.xml -port {port} -maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 26900,
  },
  OTHER: {
    downloadUrl: '',
    installScript: '',
    configPath: '',
    startCommand: '',
    stopCommand: '',
    port: 0,
  },
};

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
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent) {
      return {
        success: false,
        error: 'Szerver vagy agent nem található',
      };
    }

    const machine = server.agent.machine;
    const gameConfig = GAME_SERVER_CONFIGS[gameType];

    if (!gameConfig || gameType === 'OTHER') {
      return {
        success: false,
        error: 'Játék típus nem támogatott automatikus telepítéshez',
      };
    }

    const serverPath = `/opt/servers/${serverId}`;

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

    // Telepítési script generálása
    const installScript = gameConfig.installScript
      .replace(/{serverId}/g, serverId)
      .replace(/{downloadUrl}/g, gameConfig.downloadUrl)
      .replace(/{port}/g, config.port.toString())
      .replace(/{maxPlayers}/g, config.maxPlayers.toString())
      .replace(/{ram}/g, config.ram.toString())
      .replace(/{name}/g, config.name)
      .replace(/{world}/g, config.world || 'Dedicated')
      .replace(/{password}/g, config.password || '');

    // Script fájl létrehozása és futtatása
    const scriptPath = `/tmp/install-${serverId}.sh`;
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

    // Konfigurációs fájl létrehozása
    const configContent = generateConfigFile(gameType, config);
    if (configContent) {
      const configPath = gameConfig.configPath.replace(/{serverId}/g, serverId);
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `cat > ${configPath} << 'EOF'\n${configContent}\nEOF`
      );
    }

    // Systemd service létrehozása (opcionális)
    await createSystemdService(serverId, gameType, gameConfig, config, machine);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Game server installation error:', error);
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
  config: any
): string {
  switch (gameType) {
    case 'MINECRAFT':
      return `
server-port=${config.port}
max-players=${config.maxPlayers}
online-mode=false
white-list=false
motd=${config.name}
      `.trim();
    
    case 'ARK':
      return `
[ServerSettings]
ServerAdminPassword=${config.password || 'changeme'}
MaxPlayers=${config.maxPlayers}
ServerPassword=${config.password || ''}
      `.trim();
    
    case 'CSGO':
      return `
hostname "${config.name}"
maxplayers ${config.maxPlayers}
sv_lan 0
      `.trim();
    
    default:
      return '';
  }
}

/**
 * Systemd service létrehozása
 */
async function createSystemdService(
  serverId: string,
  gameType: GameType,
  gameConfig: any,
  config: any,
  machine: any
): Promise<void> {
  const startCommand = gameConfig.startCommand
    .replace(/{port}/g, config.port.toString())
    .replace(/{maxPlayers}/g, config.maxPlayers.toString())
    .replace(/{ram}/g, config.ram.toString())
    .replace(/{name}/g, config.name);

  const serviceContent = `
[Unit]
Description=Game Server ${serverId}
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/servers/${serverId}
ExecStart=${startCommand}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
  `.trim();

  await executeSSHCommand(
    {
      host: machine.ipAddress,
      port: machine.sshPort,
      user: machine.sshUser,
      keyPath: machine.sshKeyPath || undefined,
    },
    `cat > /etc/systemd/system/server-${serverId}.service << 'EOF'\n${serviceContent}\nEOF && systemctl daemon-reload`
  );
}

