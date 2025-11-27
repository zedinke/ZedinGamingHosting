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
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      # Minden könyvtárat root tulajdonba teszünk, mivel root-ként futunk mindent
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      # Szerver könyvtár létrehozása root tulajdonban
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      # SteamCMD home könyvtár létrehozása és jogosultságok beállítása
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      # Ellenőrizzük, hogy a globális SteamCMD létezik-e
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      # ARK Evolved szerver telepítése globális SteamCMD-vel
      echo "Installing ARK: Survival Evolved dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 376030 validate +quit
      EXIT_CODE=$?
      
      # Ideiglenes Steam home könyvtár törlése
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      
      # Könyvtárak létrehozása
      mkdir -p ShooterGame/Saved/Config/LinuxServer
      mkdir -p ShooterGame/Saved/SavedArks
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      set +e
      SERVER_DIR="/opt/servers/{serverId}"
      
      # Minden könyvtárat root tulajdonba teszünk, mivel root-ként futunk mindent
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      # Szerver könyvtár létrehozása root tulajdonban
      mkdir -p "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      cd "$SERVER_DIR"
      
      # SteamCMD home könyvtár létrehozása és jogosultságok beállítása
      STEAM_HOME="/tmp/steamcmd-home-$$"
      mkdir -p "$STEAM_HOME"
      chown -R root:root "$STEAM_HOME"
      chmod -R 755 "$STEAM_HOME"
      
      # Ellenőrizzük, hogy a globális SteamCMD létezik-e
      if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
        echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
        exit 1
      fi
      
      # ARK Ascended szerver telepítése globális SteamCMD-vel
      echo "Installing ARK: Survival Ascended dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 2430930 validate +quit
        EXIT_CODE=$?
        
        # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
        sleep 5
        
        # Ellenőrizzük, hogy a telepítés sikeres volt-e (könyvtárak léteznek)
        if [ -d "$SERVER_DIR/ShooterGame" ] || [ -d "$SERVER_DIR/steamapps/common/ARK Survival Ascended" ]; then
          INSTALL_SUCCESS=true
          break
        fi
        
        echo "SteamCMD exit code: $EXIT_CODE" >&2
        echo "Telepítés még nem teljes, újrapróbálkozás..." >&2
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
          echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
          sleep 15
        fi
      done
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      
      if [ "$INSTALL_SUCCESS" != "true" ]; then
        echo "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után" >&2
        exit 1
      fi
      
      # Könyvtárak létrehozása
      mkdir -p ShooterGame/Saved/Config/LinuxServer
      mkdir -p ShooterGame/Saved/SavedArks
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      # Ellenőrizzük, hogy root-ként futunk-e
      CURRENT_USER=$(whoami)
      CURRENT_UID=$(id -u)
      echo "Jelenlegi felhasználó: $CURRENT_USER (UID: $CURRENT_UID)"
      
      if [ "$CURRENT_UID" != "0" ]; then
        echo "FIGYELMEZTETÉS: Nem root-ként futunk! (UID: $CURRENT_UID)" >&2
      fi
      
      # Minden könyvtárat root tulajdonba teszünk, mivel root-ként futunk mindent
      mkdir -p /opt/servers
      chmod 755 /opt/servers
      chown root:root /opt/servers
      
      # Ellenőrizzük a /opt/servers könyvtár jogosultságait
      echo "Jogosultságok ellenőrzése:"
      ls -ld /opt/servers || true
      
      # Szerver könyvtár létrehozása root tulajdonban
      mkdir -p "$SERVER_DIR/server"
      chmod -R 755 "$SERVER_DIR"
      chown -R root:root "$SERVER_DIR"
      
      # Ellenőrizzük a szerver könyvtár jogosultságait
      echo "Szerver könyvtár jogosultságok:"
      ls -ld "$SERVER_DIR" || true
      ls -ld "$SERVER_DIR/server" || true
      
      # Teszteljük, hogy írhatunk-e a könyvtárba
      echo "Írási teszt a könyvtárba..."
      touch "$SERVER_DIR/.write_test" 2>&1 && rm -f "$SERVER_DIR/.write_test" && echo "Írási teszt sikeres" || echo "Írási teszt SIKERTELEN" >&2
      
      cd "$SERVER_DIR"
      
      # Rust szerver telepítése SteamCMD-vel
      # A fájlok a server/ alkönyvtárba kerülnek
      echo "Rust szerver telepítése kezdődik..."
      echo "Szerver könyvtár: $SERVER_DIR"
      
      # SteamCMD futtatása - több próbálkozás, ha szükséges
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        # Biztosítjuk, hogy minden root tulajdonban legyen
        chown -R root:root "$SERVER_DIR"
        chmod -R 755 "$SERVER_DIR"
        
        # SteamCMD home könyvtár létrehozása és jogosultságok beállítása
        STEAM_HOME="/tmp/steamcmd-home-$$"
        mkdir -p "$STEAM_HOME"
        chown -R root:root "$STEAM_HOME"
        chmod -R 755 "$STEAM_HOME"
        
        # Ellenőrizzük, hogy a SteamCMD létezik-e és végrehajtható-e
        if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
          echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
          exit 1
        fi
        
        # Ellenőrizzük a SteamCMD jogosultságait
        if [ ! -x /opt/steamcmd/steamcmd.sh ]; then
          chmod +x /opt/steamcmd/steamcmd.sh
        fi
        
        # Ellenőrizzük a /opt/steamcmd könyvtár jogosultságait
        chown -R root:root /opt/steamcmd 2>/dev/null || true
        chmod -R 755 /opt/steamcmd 2>/dev/null || true
        
        # SteamCMD futtatása ideiglenes HOME könyvtárral
        # Ez biztosítja, hogy a SteamCMD nem használja a /root/.local/share/Steam/ könyvtárat
          HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 258550 validate +quit
        EXIT_CODE=$?
        
        # Ideiglenes Steam home könyvtár törlése
        rm -rf "$STEAM_HOME" 2>/dev/null || true
        
        # Letöltött fájlok jogosultságainak beállítása (root tulajdonban maradnak)
        if [ -d "$SERVER_DIR/server" ]; then
          chown -R root:root "$SERVER_DIR/server"
          chmod -R 755 "$SERVER_DIR/server"
        fi
        
        # Ellenőrizzük, hogy a bináris létezik-e (ez a legfontosabb, nem az exit code)
        # A SteamCMD közvetlenül a SERVER_DIR-be telepíti, nem a server/ alkönyvtárba
        if [ -f "$SERVER_DIR/RustDedicated" ]; then
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
      if [ ! -f "$SERVER_DIR/RustDedicated" ]; then
        echo "HIBA: RustDedicated bináris nem található a $SERVER_DIR könyvtárban" >&2
        echo "Könyvtár tartalma:" >&2
        ls -la "$SERVER_DIR" >&2 || true
        echo "SteamCMD utolsó exit code: $EXIT_CODE" >&2
        exit 1
      fi
      
      # Végrehajtási jogosultság beállítása
      chmod +x "$SERVER_DIR/RustDedicated" || true
      
      # Ellenőrizzük a fájl méretét is (nem lehet 0)
      FILE_SIZE=$(stat -f%z "$SERVER_DIR/RustDedicated" 2>/dev/null || stat -c%s "$SERVER_DIR/RustDedicated" 2>/dev/null || echo "0")
      if [ "$FILE_SIZE" = "0" ]; then
        echo "FIGYELMEZTETÉS: RustDedicated bináris mérete 0, lehet, hogy sérült" >&2
      fi
      
      echo "Rust szerver sikeresen telepítve: $SERVER_DIR/RustDedicated (méret: $FILE_SIZE bytes)"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Valheim dedicated server..."
          HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 896660 validate +quit
        EXIT_CODE=$?
        
        # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
        sleep 5
        
        # Ellenőrizzük, hogy a telepítés sikeres volt-e
        if [ -f "$SERVER_DIR/valheim_server.x86_64" ] || [ -d "$SERVER_DIR/steamapps/common/valheim dedicated server" ]; then
          INSTALL_SUCCESS=true
          break
        fi
        
        echo "SteamCMD exit code: $EXIT_CODE" >&2
        echo "Telepítés még nem teljes, újrapróbálkozás..." >&2
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
          echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
          sleep 15
        fi
      done
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      
      if [ "$INSTALL_SUCCESS" != "true" ]; then
        echo "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után" >&2
        exit 1
      fi
      
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing 7 Days to Die dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 294420 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Conan Exiles dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 443030 validate +quit
        EXIT_CODE=$?
        
        # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
        sleep 5
        
        # Ellenőrizzük, hogy a telepítés sikeres volt-e
        if [ -f "$SERVER_DIR/ConanSandboxServer.sh" ] || [ -d "$SERVER_DIR/steamapps/common/Conan Exiles Dedicated Server" ]; then
          INSTALL_SUCCESS=true
          break
        fi
        
        echo "SteamCMD exit code: $EXIT_CODE" >&2
        echo "Telepítés még nem teljes, újrapróbálkozás..." >&2
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
          echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
          sleep 15
        fi
      done
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      
      if [ "$INSTALL_SUCCESS" != "true" ]; then
        echo "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után" >&2
        exit 1
      fi
      
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing DayZ dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 223350 validate +quit
        EXIT_CODE=$?
        
        # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
        sleep 5
        
        # Ellenőrizzük, hogy a telepítés sikeres volt-e
        if [ -f "$SERVER_DIR/DayZServer" ] || [ -d "$SERVER_DIR/steamapps/common/DayZServer" ]; then
          INSTALL_SUCCESS=true
          break
        fi
        
        echo "SteamCMD exit code: $EXIT_CODE" >&2
        echo "Telepítés még nem teljes, újrapróbálkozás..." >&2
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
          echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
          sleep 15
        fi
      done
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      
      if [ "$INSTALL_SUCCESS" != "true" ]; then
        echo "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után" >&2
        exit 1
      fi
      
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Project Zomboid dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 108600 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Palworld dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 2394010 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Enshrouded dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 2278520 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Sons of the Forest dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1326470 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing The Forest dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 556450 validate +quit
        EXIT_CODE=$?
        
        # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
        # A SteamCMD néha időt vesz igénybe, hogy a fájlokat a megfelelő helyre mozgassa
        sleep 10
        
        # Keresés a bináris után - több helyen is
        SERVER_FILE=""
        
        # Részletes debug információ
        echo "Keresés a bináris után..."
        echo "SERVER_DIR: $SERVER_DIR"
        if [ -d "$SERVER_DIR/steamapps" ]; then
          echo "steamapps/ könyvtár tartalma:"
          find "$SERVER_DIR/steamapps" -type d -maxdepth 4 2>/dev/null | head -30
          echo "steamapps/ fájlok (összes .x86_64 és Forest/Dedicated):"
          find "$SERVER_DIR/steamapps" -type f \( -name "*.x86_64" -o -name "*Forest*" -o -name "*Dedicated*" \) 2>/dev/null | head -30
        fi
        
        # 1. Közvetlenül a SERVER_DIR-ben
        if [ -f "$SERVER_DIR/TheForestDedicatedServer.x86_64" ]; then
          SERVER_FILE="$SERVER_DIR/TheForestDedicatedServer.x86_64"
        # 2. linux64/ könyvtárban
        elif [ -f "$SERVER_DIR/linux64/TheForestDedicatedServer.x86_64" ]; then
          SERVER_FILE="$SERVER_DIR/linux64/TheForestDedicatedServer.x86_64"
        # 3. steamapps/temp/ könyvtárban (ideiglenes telepítés)
        elif [ -f "$SERVER_DIR/steamapps/temp/556450/TheForestDedicatedServer.x86_64" ]; then
          SERVER_FILE="$SERVER_DIR/steamapps/temp/556450/TheForestDedicatedServer.x86_64"
        elif [ -d "$SERVER_DIR/steamapps/temp/556450" ]; then
          SERVER_FILE=$(find "$SERVER_DIR/steamapps/temp/556450" -name "TheForestDedicatedServer.x86_64" -type f 2>/dev/null | head -1)
          if [ -z "$SERVER_FILE" ]; then
            SERVER_FILE=$(find "$SERVER_DIR/steamapps/temp/556450" -name "*Forest*Dedicated*" -type f -executable 2>/dev/null | head -1)
          fi
        # 4. steamapps/downloading/ könyvtárban (letöltés alatt)
        elif [ -f "$SERVER_DIR/steamapps/downloading/556450/TheForestDedicatedServer.x86_64" ]; then
          SERVER_FILE="$SERVER_DIR/steamapps/downloading/556450/TheForestDedicatedServer.x86_64"
        elif [ -d "$SERVER_DIR/steamapps/downloading/556450" ]; then
          SERVER_FILE=$(find "$SERVER_DIR/steamapps/downloading/556450" -name "TheForestDedicatedServer.x86_64" -type f 2>/dev/null | head -1)
          if [ -z "$SERVER_FILE" ]; then
            SERVER_FILE=$(find "$SERVER_DIR/steamapps/downloading/556450" -name "*Forest*Dedicated*" -type f -executable 2>/dev/null | head -1)
          fi
        # 5. steamapps/common/ könyvtárban - több lehetséges név
        elif [ -f "$SERVER_DIR/steamapps/common/The Forest Dedicated Server/TheForestDedicatedServer.x86_64" ]; then
          SERVER_FILE="$SERVER_DIR/steamapps/common/The Forest Dedicated Server/TheForestDedicatedServer.x86_64"
        elif [ -f "$SERVER_DIR/steamapps/common/TheForestDedicatedServer/TheForestDedicatedServer.x86_64" ]; then
          SERVER_FILE="$SERVER_DIR/steamapps/common/TheForestDedicatedServer/TheForestDedicatedServer.x86_64"
        elif [ -f "$SERVER_DIR/steamapps/common/TheForestDedicatedServer/TheForestDedicatedServer" ]; then
          SERVER_FILE="$SERVER_DIR/steamapps/common/TheForestDedicatedServer/TheForestDedicatedServer"
        # 6. Keresés a teljes könyvtárban - több lehetséges név
        else
          SERVER_FILE=$(find "$SERVER_DIR" -name "TheForestDedicatedServer.x86_64" -type f 2>/dev/null | head -1)
          if [ -z "$SERVER_FILE" ]; then
            SERVER_FILE=$(find "$SERVER_DIR" -name "TheForestDedicatedServer" -type f 2>/dev/null | head -1)
          fi
          if [ -z "$SERVER_FILE" ]; then
            SERVER_FILE=$(find "$SERVER_DIR" -name "*Forest*Dedicated*" -type f -executable 2>/dev/null | head -1)
          fi
        fi
        
        if [ -n "$SERVER_FILE" ] && [ -f "$SERVER_FILE" ]; then
          FILE_SIZE=$(stat -c%s "$SERVER_FILE" 2>/dev/null || echo "0")
          if [ "$FILE_SIZE" -gt "0" ]; then
            echo "TheForestDedicatedServer.x86_64 bináris megtalálva: $SERVER_FILE (méret: $FILE_SIZE bytes)"
            
            # Ha a bináris a temp vagy downloading könyvtárban van, mozgassuk át a SERVER_DIR-be
            if [[ "$SERVER_FILE" == *"/steamapps/temp/"* ]] || [[ "$SERVER_FILE" == *"/steamapps/downloading/"* ]]; then
              echo "Bináris ideiglenes könyvtárban található, mozgatás a SERVER_DIR-be..."
              cp "$SERVER_FILE" "$SERVER_DIR/TheForestDedicatedServer.x86_64"
              chmod +x "$SERVER_DIR/TheForestDedicatedServer.x86_64"
              SERVER_FILE="$SERVER_DIR/TheForestDedicatedServer.x86_64"
              echo "Bináris sikeresen átmozgatva: $SERVER_FILE"
            fi
            
            INSTALL_SUCCESS=true
            break
          fi
        fi
        
        echo "SteamCMD exit code: $EXIT_CODE" >&2
        echo "TheForestDedicatedServer.x86_64 bináris még nem található, újrapróbálkozás..." >&2
        RETRY_COUNT=$((RETRY_COUNT + 1))
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
          echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
          sleep 15
        fi
      done
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      
      if [ "$INSTALL_SUCCESS" != "true" ]; then
        echo "HIBA: TheForestDedicatedServer.x86_64 bináris nem található $MAX_RETRIES próbálkozás után" >&2
        echo "Könyvtár tartalma:" >&2
        ls -la "$SERVER_DIR" >&2 || true
        if [ -d "$SERVER_DIR/steamapps" ]; then
          echo "steamapps/ directory contents:" >&2
          find "$SERVER_DIR/steamapps" -type f -name "*Forest*" 2>/dev/null | head -20 >&2 || true
        fi
        exit 1
      fi
      
      # Symlink létrehozása, ha nem a root könyvtárban van
      if [ "$SERVER_FILE" != "$SERVER_DIR/TheForestDedicatedServer.x86_64" ]; then
        ln -sf "$SERVER_FILE" "$SERVER_DIR/TheForestDedicatedServer.x86_64"
        echo "Created symlink to server file at $SERVER_DIR/TheForestDedicatedServer.x86_64"
      fi
      
      # Végrehajtási jogosultságok beállítása
      chmod +x "$SERVER_FILE" 2>/dev/null || true
      chmod +x "$SERVER_DIR/TheForestDedicatedServer.x86_64" 2>/dev/null || true
      
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
      
      echo "The Forest szerver sikeresen telepítve: $SERVER_DIR/TheForestDedicatedServer.x86_64"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Grounded dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 962130 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing V Rising dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1604030 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Don't Starve Together dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 343050 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Counter-Strike 2 dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 730 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Counter-Strike: Global Offensive dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 740 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Left 4 Dead 2 dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 222860 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Killing Floor 2 dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 232130 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Insurgency: Sandstorm dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 581330 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Squad dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 393380 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Hell Let Loose dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 686810 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Post Scriptum dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 736220 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Arma 3 dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 107410 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Terraria dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 105600 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Starbound dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 211820 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Factorio dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 427520 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Satisfactory dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1690800 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Space Engineers dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 298420 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Garry's Mod dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 4020 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Unturned dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 304930 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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
      
      MAX_RETRIES=3
      RETRY_COUNT=0
      INSTALL_SUCCESS=false
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
        
        echo "Installing Dota 2 dedicated server..."
        HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 570 validate +quit
      
      rm -rf "$STEAM_HOME" 2>/dev/null || true
      chown -R root:root "$SERVER_DIR"
      chmod -R 755 "$SERVER_DIR"
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

