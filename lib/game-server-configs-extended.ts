/**
 * További 30 játék telepítési konfigurációk
 * Összesen 60 játék támogatása
 */

import { GameType } from '@prisma/client';
import { GameServerConfig } from './game-server-configs';

// További 30 játék konfigurációi
export const EXTENDED_GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = {
  TEAM_FORTRESS_2: {
    steamAppId: 232250,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 232250 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/tf/cfg/server.cfg',
    startCommand: './srcds_run -game tf -console -port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },

  HALF_LIFE_2_DEATHMATCH: {
    steamAppId: 320,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 320 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/hl2mp/cfg/server.cfg',
    startCommand: './srcds_run -game hl2mp -console -port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },

  COUNTER_STRIKE_SOURCE: {
    steamAppId: 232330,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 232330 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/cstrike/cfg/server.cfg',
    startCommand: './srcds_run -game cstrike -console -port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },

  DAY_OF_DEFEAT_SOURCE: {
    steamAppId: 232290,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 232290 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/dod/cfg/server.cfg',
    startCommand: './srcds_run -game dod -console -port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },

  PORTAL_2: {
    steamAppId: 620,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 620 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/portal2/cfg/server.cfg',
    startCommand: './srcds_run -game portal2 -console -port {port}',
    stopCommand: 'quit',
    port: 27015,
  },

  LEFT_4_DEAD: {
    steamAppId: 222840,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 222840 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/left4dead/cfg/server.cfg',
    startCommand: './srcds_run -game left4dead -console -port {port} +maxplayers {maxPlayers}',
    stopCommand: 'quit',
    port: 27015,
  },

  DEAD_BY_DAYLIGHT: {
    steamAppId: 381210,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 381210 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/DeadByDaylight/Content/ServerConfig/ServerSettings.ini',
    startCommand: './DeadByDaylightServer -log',
    stopCommand: 'quit',
    port: 7777,
  },

  READY_OR_NOT: {
    steamAppId: 1144200,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1144200 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/ReadyOrNot/Config/ServerConfig.ini',
    startCommand: './ReadyOrNotServer.exe',
    stopCommand: 'quit',
    port: 7777,
    requiresWine: true,
  },

  HELLDIVERS_2: {
    steamAppId: 553850,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 553850 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/Helldivers2/Config/ServerConfig.ini',
    startCommand: './Helldivers2Server',
    stopCommand: 'quit',
    port: 7777,
  },

  WAR_THUNDER: {
    steamAppId: 236390,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 236390 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/WarThunder/Config/ServerConfig.ini',
    startCommand: './WarThunderServer',
    stopCommand: 'quit',
    port: 8080,
  },

  DESTINY_2: {
    steamAppId: 1086940,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1086940 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/Destiny2/Config/ServerConfig.ini',
    startCommand: './Destiny2Server',
    stopCommand: 'quit',
    port: 7777,
  },

  STARDEW_VALLEY: {
    steamAppId: 413150,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 413150 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/StardewValley/Config/ServerConfig.ini',
    startCommand: './StardewValleyServer',
    stopCommand: 'quit',
    port: 24642,
  },

  FORZA_HORIZON_5: {
    steamAppId: 1551360,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1551360 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/ForzaHorizon5/Config/ServerConfig.ini',
    startCommand: './ForzaHorizon5Server',
    stopCommand: 'quit',
    port: 7777,
  },

  BLACK_MYTH_WUKONG: {
    steamAppId: 2358720,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 2358720 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/BlackMythWukong/Config/ServerConfig.ini',
    startCommand: './BlackMythWukongServer',
    stopCommand: 'quit',
    port: 7777,
  },

  BATTLEFIELD_2042: {
    steamAppId: 1517290,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1517290 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/Battlefield2042/Config/ServerConfig.ini',
    startCommand: './Battlefield2042Server',
    stopCommand: 'quit',
    port: 25200,
  },

  CALL_OF_DUTY_WARZONE: {
    steamAppId: 1985810,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1985810 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/CallOfDutyWarzone/Config/ServerConfig.ini',
    startCommand: './CallOfDutyWarzoneServer',
    stopCommand: 'quit',
    port: 3074,
  },

  APEX_LEGENDS: {
    steamAppId: 1172470,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1172470 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/ApexLegends/Config/ServerConfig.ini',
    startCommand: './ApexLegendsServer',
    stopCommand: 'quit',
    port: 37015,
  },

  PUBG_BATTLEGROUNDS: {
    steamAppId: 578080,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 578080 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/PUBG/Config/ServerConfig.ini',
    startCommand: './PUBGServer',
    stopCommand: 'quit',
    port: 27015,
  },

  ELDEN_RING: {
    steamAppId: 1245620,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1245620 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/EldenRing/Config/ServerConfig.ini',
    startCommand: './EldenRingServer',
    stopCommand: 'quit',
    port: 7777,
  },

  RED_DEAD_REDEMPTION_2: {
    steamAppId: 1174180,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1174180 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/RedDeadRedemption2/Config/ServerConfig.ini',
    startCommand: './RedDeadRedemption2Server',
    stopCommand: 'quit',
    port: 7777,
  },

  BALDURS_GATE_3: {
    steamAppId: 1086940,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1086940 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/BaldursGate3/Config/ServerConfig.ini',
    startCommand: './BaldursGate3Server',
    stopCommand: 'quit',
    port: 7777,
  },

  CYBERPUNK_2077: {
    steamAppId: 1091500,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1091500 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/Cyberpunk2077/Config/ServerConfig.ini',
    startCommand: './Cyberpunk2077Server',
    stopCommand: 'quit',
    port: 7777,
  },

  DEAD_ISLAND_2: {
    steamAppId: 934940,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 934940 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/DeadIsland2/Config/ServerConfig.ini',
    startCommand: './DeadIsland2Server',
    stopCommand: 'quit',
    port: 7777,
  },

  DYING_LIGHT_2: {
    steamAppId: 534380,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 534380 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/DyingLight2/Config/ServerConfig.ini',
    startCommand: './DyingLight2Server',
    stopCommand: 'quit',
    port: 7777,
  },

  THE_LAST_OF_US: {
    steamAppId: 1888930,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1888930 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/TheLastOfUs/Config/ServerConfig.ini',
    startCommand: './TheLastOfUsServer',
    stopCommand: 'quit',
    port: 7777,
  },

  HORIZON_ZERO_DAWN: {
    steamAppId: 1151640,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1151640 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/HorizonZeroDawn/Config/ServerConfig.ini',
    startCommand: './HorizonZeroDawnServer',
    stopCommand: 'quit',
    port: 7777,
  },

  GOD_OF_WAR: {
    steamAppId: 1593500,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1593500 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/GodOfWar/Config/ServerConfig.ini',
    startCommand: './GodOfWarServer',
    stopCommand: 'quit',
    port: 7777,
  },

  SPIDER_MAN: {
    steamAppId: 1817070,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1817070 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/SpiderMan/Config/ServerConfig.ini',
    startCommand: './SpiderManServer',
    stopCommand: 'quit',
    port: 7777,
  },

  GHOST_OF_TSUSHIMA: {
    steamAppId: 2215430,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 2215430 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/GhostOfTsushima/Config/ServerConfig.ini',
    startCommand: './GhostOfTsushimaServer',
    stopCommand: 'quit',
    port: 7777,
  },

  DEATH_STRANDING: {
    steamAppId: 1190460,
    requiresSteamCMD: true,
    installScript: `
      #!/bin/bash
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1190460 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
    `,
    configPath: '/opt/servers/{serverId}/DeathStranding/Config/ServerConfig.ini',
    startCommand: './DeathStrandingServer',
    stopCommand: 'quit',
    port: 7777,
  },
};

