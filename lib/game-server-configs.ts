/**
 * Game szerver telepítési konfigurációk
 * 30 legnépszerűbb Steam játék támogatása
 * További 30 játék: lib/game-server-configs-extended.ts
 */

import { GameType } from '@prisma/client';
import { EXTENDED_GAME_SERVER_CONFIGS } from './game-server-configs-extended';

export interface GameServerConfig {
  steamAppId?: number; // Steam App ID (ha SteamCMD-t használ)
  installScript: string;
  configPath: string;
  startCommand: string;
  stopCommand: string;
  port: number;
  queryPort?: number; // Query port (ha külön van)
  requiresSteamCMD: boolean;
  requiresJava?: boolean;
  requiresWine?: boolean;
}

export const GAME_SERVER_CONFIGS: Record<GameType, GameServerConfig> = {
  // ARK játékok
  ARK_EVOLVED: {
    steamAppId: 376030,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 376030 validate +quit
      mkdir -p ShooterGame/Saved/Config/LinuxServer
      mkdir -p ShooterGame/Saved/SavedArks
    `,
    configPath: '/opt/servers/{serverId}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini',
    startCommand: './ShooterGame/Binaries/Linux/ShooterGameServer TheIsland?listen?Port={port}?QueryPort={queryPort}?ServerAdminPassword={adminPassword}',
    stopCommand: 'quit',
    port: 7777,
    queryPort: 27015,
  },
  
  ARK_ASCENDED: {
    steamAppId: 2430930,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 2430930 validate +quit
      mkdir -p ShooterGame/Saved/Config/LinuxServer
      mkdir -p ShooterGame/Saved/SavedArks
    `,
    configPath: '/opt/servers/{serverId}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini',
    startCommand: './ShooterGame/Binaries/Linux/ShooterGameServer TheIsland_WP?listen?Port={port}?QueryPort={queryPort}?ServerAdminPassword={adminPassword}',
    stopCommand: 'quit',
    port: 7777,
    queryPort: 27015,
  },

  // Survival játékok
  MINECRAFT: {
    requiresSteamCMD: false,
    requiresJava: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      LATEST_VERSION=$(curl -s https://launchermeta.mojang.com/mc/game/version_manifest.json | grep -oP '"release":\s*"\K[^"]+' | head -1)
      SERVER_URL=$(curl -s "https://launchermeta.mojang.com/mc/game/version_manifest.json" | grep -A 1 "$LATEST_VERSION" | grep -oP '"url":\s*"\K[^"]+')
      JAR_URL=$(curl -s "$SERVER_URL" | grep -oP '"server":\s*\{\s*"url":\s*"\K[^"]+')
      wget -qO server.jar "$JAR_URL"
      echo "eula=true" > eula.txt
      mkdir -p plugins worlds logs
    `,
    configPath: '/opt/servers/{serverId}/server.properties',
    startCommand: 'java -Xmx{ram}M -Xms{ram}M -jar server.jar nogui',
    stopCommand: 'stop',
    port: 25565,
  },

  RUST: {
    steamAppId: 258550,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 258550 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/server/server.cfg',
    startCommand: './RustDedicated -batchmode -server.port {port} -server.queryport {queryPort} -server.maxplayers {maxPlayers} -server.hostname "{name}"',
    stopCommand: 'quit',
    port: 28015,
    queryPort: 28016,
  },

  VALHEIM: {
    steamAppId: 896660,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 896660 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/start_server.sh',
    startCommand: './valheim_server.x86_64 -name "{name}" -port {port} -world "{world}" -password "{password}" -public 1',
    stopCommand: 'quit',
    port: 2456,
  },

  SEVEN_DAYS_TO_DIE: {
    steamAppId: 294420,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 294420 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/serverconfig.xml',
    startCommand: './7DaysToDieServer.x86_64 -configfile=serverconfig.xml -port {port} -maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 26900,
  },

  CONAN_EXILES: {
    steamAppId: 443030,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 443030 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/ConanSandbox/Saved/Config/LinuxServer/ServerSettings.ini',
    startCommand: './ConanSandboxServer.sh -queryport {queryPort} -game -server -log',
    stopCommand: 'quit',
    port: 7777,
    queryPort: 27015,
  },

  DAYZ: {
    steamAppId: 223350,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 223350 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/serverDZ.cfg',
    startCommand: './DayZServer -config=serverDZ.cfg -port={port} -profiles=ServerProfile',
    stopCommand: 'quit',
    port: 2302,
  },

  PROJECT_ZOMBOID: {
    steamAppId: 108600,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 108600 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/Server/servertest.ini',
    startCommand: './start-server.sh -servername "{name}" -adminpassword "{password}"',
    stopCommand: 'quit',
    port: 16261,
  },

  PALWORLD: {
    steamAppId: 2394010,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 2394010 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/DefaultPalWorldSettings.ini',
    startCommand: './PalServer.sh -port={port} -players={maxPlayers}',
    stopCommand: 'quit',
    port: 8211,
  },

  ENSHROUDED: {
    steamAppId: 2278520,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 2278520 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/enshrouded_server.json',
    startCommand: './enshrouded_server',
    stopCommand: 'quit',
    port: 15636,
  },

  SONS_OF_THE_FOREST: {
    steamAppId: 1326470,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 1326470 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/config.json',
    startCommand: './SonsOfTheForestServer -batchmode -nographics',
    stopCommand: 'quit',
    port: 8766,
  },

  THE_FOREST: {
    steamAppId: 556450,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 556450 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/config/config.cfg',
    startCommand: './TheForestDedicatedServer.x86_64 -batchmode -nographics -dedicated',
    stopCommand: 'quit',
    port: 27015,
  },

  GROUNDED: {
    steamAppId: 962130,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 962130 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/GroundedServer.exe',
    startCommand: 'wine GroundedServer.exe -log',
    stopCommand: 'quit',
    port: 7777,
    requiresWine: true,
  },

  V_RISING: {
    steamAppId: 1604030,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 1604030 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/ServerGameSettings.json',
    startCommand: './VRisingServer -persistentDataPath ./save-data -serverName "{name}"',
    stopCommand: 'quit',
    port: 9876,
  },

  DONT_STARVE_TOGETHER: {
    steamAppId: 343050,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 343050 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/cluster.ini',
    startCommand: './dontstarve_dedicated_server_nullrenderer -cluster Cluster_1 -shard Master',
    stopCommand: 'quit',
    port: 10999,
  },

  // FPS játékok
  CS2: {
    steamAppId: 730,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 730 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/game/csgo/cfg/server.cfg',
    startCommand: './game/bin/linuxsteamrt64/cs2 -dedicated -console -usercon +port {port} +maxplayers {maxPlayers} +map de_dust2',
    stopCommand: 'quit',
    port: 27015,
  },

  CSGO: {
    steamAppId: 740,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 740 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/csgo/cfg/server.cfg',
    startCommand: './srcds_run -game csgo -console -usercon +port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },

  LEFT_4_DEAD_2: {
    steamAppId: 222860,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 222860 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/left4dead2/cfg/server.cfg',
    startCommand: './srcds_run -game left4dead2 -console -port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },

  KILLING_FLOOR_2: {
    steamAppId: 232130,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 232130 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/KFGame/Config/LinuxServer-KFGame.ini',
    startCommand: './Binaries/Win64/KFServer.exe',
    stopCommand: 'quit',
    port: 7777,
    requiresWine: true,
  },

  INSURGENCY_SANDSTORM: {
    steamAppId: 581330,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 581330 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/Insurgency/Config/Server/ServerGame.ini',
    startCommand: './Insurgency/Binaries/Linux/InsurgencyServer-Linux-Shipping',
    stopCommand: 'quit',
    port: 27102,
  },

  SQUAD: {
    steamAppId: 393380,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 393380 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/SquadGame/ServerConfig/Server.cfg',
    startCommand: './SquadGameServer.sh -Port={port} -QueryPort={queryPort}',
    stopCommand: 'quit',
    port: 7787,
    queryPort: 27165,
  },

  HELL_LET_LOOSE: {
    steamAppId: 686810,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 686810 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/HLLServer.exe',
    startCommand: 'wine HLLServer.exe',
    stopCommand: 'quit',
    port: 7777,
    requiresWine: true,
  },

  POST_SCRIPTUM: {
    steamAppId: 736220,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 736220 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/PostScriptum/ServerConfig/Server.cfg',
    startCommand: './PostScriptumServer.sh -Port={port}',
    stopCommand: 'quit',
    port: 10000,
  },

  ARMA_3: {
    steamAppId: 107410,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 107410 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/server.cfg',
    startCommand: './arma3server -port={port} -config=server.cfg',
    stopCommand: 'quit',
    port: 2302,
  },

  // Sandbox játékok
  TERRARIA: {
    steamAppId: 105600,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 105600 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/serverconfig.txt',
    startCommand: './TerrariaServer.bin.x86_64 -config serverconfig.txt',
    stopCommand: 'exit',
    port: 7777,
  },

  STARBOUND: {
    steamAppId: 211820,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 211820 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/storage/starbound_server.config',
    startCommand: './linux/starbound_server',
    stopCommand: 'quit',
    port: 21025,
  },

  FACTORIO: {
    steamAppId: 427520,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 427520 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/config/server-settings.json',
    startCommand: './bin/x64/factorio --start-server-load-latest --server-settings config/server-settings.json',
    stopCommand: '/quit',
    port: 34197,
  },

  SATISFACTORY: {
    steamAppId: 1690800,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 1690800 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/FactoryGame/Saved/Config/LinuxServer/ServerSettings.ini',
    startCommand: './FactoryServer.sh',
    stopCommand: 'quit',
    port: 7777,
  },

  SPACE_ENGINEERS: {
    steamAppId: 298420,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 298420 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/SpaceEngineersDedicated/DedicatedServer64/SpaceEngineers-Dedicated.cfg',
    startCommand: './SpaceEngineersDedicated/DedicatedServer64/SpaceEngineersDedicated',
    stopCommand: 'quit',
    port: 27016,
  },

  GARRYS_MOD: {
    steamAppId: 4020,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 4020 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/garrysmod/cfg/server.cfg',
    startCommand: './srcds_run -game garrysmod -console -port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },

  UNTURNED: {
    steamAppId: 304930,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 304930 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/Servers/{serverId}/Server.dat',
    startCommand: './Unturned_Headless.x86_64 -batchmode -nographics -silent-crashes',
    stopCommand: 'quit',
    port: 27015,
  },

  // MOBA
  DOTA_2: {
    steamAppId: 570,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set -e
      cd /opt/servers/{serverId}
      if [ ! -f steamcmd.sh ]; then
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      ./steamcmd.sh +force_install_dir /opt/servers/{serverId} +login anonymous +app_update 570 validate +quit
    `,
    configPath: '/opt/servers/{serverId}/game/dota/cfg/server.cfg',
    startCommand: './game/bin/linuxsteamrt64/dota2 -dedicated -console -port {port}',
    stopCommand: 'quit',
    port: 27015,
  },

  // Egyéb
  OTHER: {
    requiresSteamCMD: false,
    installScript: '',
    configPath: '',
    startCommand: '',
    stopCommand: '',
    port: 0,
  },
};

// Összevonjuk a két konfigurációt (alap 30 + kiterjesztett 30)
export const ALL_GAME_SERVER_CONFIGS: Record<GameType, GameServerConfig> = {
  ...GAME_SERVER_CONFIGS,
  ...EXTENDED_GAME_SERVER_CONFIGS,
} as Record<GameType, GameServerConfig>;

