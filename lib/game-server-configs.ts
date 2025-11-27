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

export const GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = {
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
      # Ne használjunk set -e-t, mert a SteamCMD exit code 8 lehet warning, de a fájlok letöltődhetnek
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      # Először biztosítjuk, hogy az /opt/servers/ könyvtár létezik és megfelelő jogosultságokkal
      mkdir -p /opt/servers
      chmod 755 /opt/servers || true
      chown root:root /opt/servers 2>/dev/null || true
      
      # Könyvtár létrehozása megfelelő jogosultságokkal
      mkdir -p "$SERVER_DIR"
      # Előre létrehozzuk a server/ alkönyvtárat is, mert a SteamCMD nem tudja létrehozni
      mkdir -p "$SERVER_DIR/server"
      # Biztosítjuk, hogy a root írni tudjon (SteamCMD root-ként fut)
      chmod 755 "$SERVER_DIR" || true
      chmod 755 "$SERVER_DIR/server" || true
      chown -R root:root "$SERVER_DIR" 2>/dev/null || true
      
      # Ellenőrizzük a jogosultságokat
      echo "Szülőkönyvtár (/opt/servers) jogosultságok:"
      ls -ld /opt/servers || true
      echo "Szerver könyvtár jogosultságok:"
      ls -ld "$SERVER_DIR" || true
      echo "Server alkönyvtár jogosultságok:"
      ls -ld "$SERVER_DIR/server" || true
      
      cd "$SERVER_DIR"
      
      # Rust szerver telepítése SteamCMD-vel
      # A fájlok a server/ alkönyvtárba kerülnek
      echo "Rust szerver telepítése kezdődik..."
      echo "Szerver könyvtár: $SERVER_DIR"
      echo "Könyvtár jogosultságok:"
      ls -ld "$SERVER_DIR" || true
      
      # SteamCMD futtatása - több próbálkozás, ha szükséges
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        # Jogosultságok ellenőrzése és beállítása SteamCMD előtt
        # A SteamCMD root-ként fut, ezért a könyvtárat root tulajdonba tesszük
        # Ez biztosítja, hogy a SteamCMD írni tudjon
        chmod 755 "$SERVER_DIR" || true
        chown -R root:root "$SERVER_DIR" 2>/dev/null || true
        
        # Ellenőrizzük a jogosultságokat
        echo "Könyvtár jogosultságok SteamCMD előtt:"
        ls -ld "$SERVER_DIR" || true
        
        # SteamCMD futtatása - nem használunk if-t, mert az exit code-ot külön kezeljük
        # A SteamCMD root-ként fut, ezért biztosítjuk, hogy írni tudjon
        /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 258550 validate +quit
        EXIT_CODE=$?
        
        # Jogosultságok beállítása a letöltött fájlokra
        # A fájlokat root tulajdonban hagyjuk, mert a systemd service is root-ként fut
        if [ -d "$SERVER_DIR/server" ]; then
          chmod -R 755 "$SERVER_DIR/server" || true
          chown -R root:root "$SERVER_DIR/server" 2>/dev/null || true
          echo "server/ könyvtár jogosultságok beállítva"
        fi
        
        # Ellenőrizzük, hogy a bináris létezik-e (ez a legfontosabb, nem az exit code)
        if [ -f "$SERVER_DIR/server/RustDedicated" ]; then
          echo "RustDedicated bináris megtalálva, telepítés sikeres!"
          INSTALL_SUCCESS=true
          break
        else
          echo "SteamCMD exit code: $EXIT_CODE" >&2
          echo "RustDedicated bináris még nem található, újrapróbálkozás..." >&2
          RETRY_COUNT=$((RETRY_COUNT + 1))
          
          if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
            sleep 15
          fi
        fi
      done
      
      # Végleges ellenőrzés - ha a bináris nem létezik, akkor hiba
      if [ ! -f "$SERVER_DIR/server/RustDedicated" ]; then
        echo "HIBA: RustDedicated bináris nem található a $SERVER_DIR/server/ könyvtárban" >&2
        echo "Könyvtár tartalma:" >&2
        ls -la "$SERVER_DIR" >&2 || true
        if [ -d "$SERVER_DIR/server" ]; then
          echo "server/ könyvtár tartalma:" >&2
          ls -la "$SERVER_DIR/server" >&2 || true
        else
          echo "server/ könyvtár nem létezik!" >&2
        fi
        echo "SteamCMD utolsó exit code: $EXIT_CODE" >&2
        exit 1
      fi
      
      # Végrehajtási jogosultság beállítása
      chmod +x "$SERVER_DIR/server/RustDedicated" || true
      
      # Ellenőrizzük a fájl méretét is (nem lehet 0)
      FILE_SIZE=$(stat -f%z "$SERVER_DIR/server/RustDedicated" 2>/dev/null || stat -c%s "$SERVER_DIR/server/RustDedicated" 2>/dev/null || echo "0")
      if [ "$FILE_SIZE" = "0" ]; then
        echo "FIGYELMEZTETÉS: RustDedicated bináris mérete 0, lehet, hogy sérült" >&2
      fi
      
      echo "Rust szerver sikeresen telepítve: $SERVER_DIR/server/RustDedicated (méret: $FILE_SIZE bytes)"
    `,
    configPath: '/opt/servers/{serverId}/server/server.cfg',
    startCommand: './server/RustDedicated -batchmode -server.port {port} -server.queryport {queryPort} -server.maxplayers {maxPlayers} -server.hostname "{name}"',
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
      SERVER_DIR="/opt/servers/{serverId}"
      cd "$SERVER_DIR"
      
      # SteamCMD letöltése ha nincs
      if [ ! -f steamcmd.sh ]; then
        echo "Downloading SteamCMD..."
        wget -qO- https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar zxf -
      fi
      
      # The Forest szerver telepítése
      echo "Installing The Forest dedicated server..."
      ./steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 556450 validate +quit
      
      # A The Forest szerver fájlok általában a root könyvtárban vannak, de ellenőrizzük
      if [ ! -f "$SERVER_DIR/TheForestDedicatedServer.x86_64" ]; then
        echo "Searching for TheForestDedicatedServer.x86_64..."
        SERVER_FILE=$(find "$SERVER_DIR" -name "TheForestDedicatedServer.x86_64" -type f 2>/dev/null | head -1)
        if [ -n "$SERVER_FILE" ]; then
          echo "Found server file at: $SERVER_FILE"
          # Ha nem a root könyvtárban van, létrehozunk egy symlink-et
          if [ "$SERVER_FILE" != "$SERVER_DIR/TheForestDedicatedServer.x86_64" ]; then
            ln -sf "$SERVER_FILE" "$SERVER_DIR/TheForestDedicatedServer.x86_64"
            echo "Created symlink to server file"
          fi
        else
          echo "ERROR: TheForestDedicatedServer.x86_64 not found after installation!"
          echo "Installation directory contents:"
          ls -la "$SERVER_DIR" || true
          exit 1
        fi
      fi
      
      # Végrehajtási jogosultságok beállítása
      echo "Setting executable permissions..."
      chmod +x "$SERVER_DIR/TheForestDedicatedServer.x86_64" 2>/dev/null || true
      find "$SERVER_DIR" -name "TheForestDedicatedServer.x86_64" -exec chmod +x {} \\; 2>/dev/null || true
      
      # Ellenőrizzük, hogy a fájl végrehajtható-e
      if [ -x "$SERVER_DIR/TheForestDedicatedServer.x86_64" ]; then
        echo "Server file is executable - installation successful"
      else
        echo "WARNING: Server file is not executable, attempting to fix..."
        chmod +x "$SERVER_DIR/TheForestDedicatedServer.x86_64"
      fi
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
export const ALL_GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = {
  ...GAME_SERVER_CONFIGS,
  ...EXTENDED_GAME_SERVER_CONFIGS,
};

