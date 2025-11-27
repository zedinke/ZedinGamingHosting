/**
 * The Forest telepítő script
 */

export const installScript = `
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

# Telepítjük a szükséges csomagokat (Wine, Winbind, Xvfb) - az útmutató szerint
echo "Szükséges csomagok telepítése (Wine, Winbind, Xvfb)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq >/dev/null 2>&1 || true
apt-get install -y wine-stable winbind xvfb >/dev/null 2>&1 || {
  echo "FIGYELMEZTETÉS: Nem sikerült telepíteni a Wine/Winbind/Xvfb csomagokat automatikusan" >&2
  echo "Kérem telepítse manuálisan: apt-get install -y wine-stable winbind xvfb" >&2
}

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
  
  # Biztosítjuk, hogy minden root tulajdonban legyen
  chown -R root:root "$SERVER_DIR"
  chmod -R 755 "$SERVER_DIR"
  
  echo "Installing The Forest dedicated server..."
  # Először próbáljuk meg a Linux natív verziót
  # Ha nincs, akkor a Windows verziót Wine-on keresztül
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 556450 validate +quit
  EXIT_CODE=$?
  
  # Ideiglenes Steam home könyvtár törlése
  rm -rf "$STEAM_HOME" 2>/dev/null || true
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 10
  
  # Keresés a bináris után - először Linux natív verzió, majd Windows verzió
  SERVER_FILE=""
  USE_WINE=false
  
  # 1. Linux natív bináris keresése (.x86_64)
  if [ -f "$SERVER_DIR/TheForestDedicatedServer.x86_64" ]; then
    SERVER_FILE="$SERVER_DIR/TheForestDedicatedServer.x86_64"
    USE_WINE=false
  elif [ -f "$SERVER_DIR/steamapps/common/The Forest Dedicated Server/TheForestDedicatedServer.x86_64" ]; then
    SERVER_FILE="$SERVER_DIR/steamapps/common/The Forest Dedicated Server/TheForestDedicatedServer.x86_64"
    USE_WINE=false
  elif [ -f "$SERVER_DIR/steamapps/common/TheForestDedicatedServer/TheForestDedicatedServer.x86_64" ]; then
    SERVER_FILE="$SERVER_DIR/steamapps/common/TheForestDedicatedServer/TheForestDedicatedServer.x86_64"
    USE_WINE=false
  else
    # 2. Keresés Linux bináris után a teljes könyvtárban
    SERVER_FILE=$(find "$SERVER_DIR" -name "TheForestDedicatedServer.x86_64" -type f 2>/dev/null | head -1)
    if [ -n "$SERVER_FILE" ]; then
      USE_WINE=false
    else
      # 3. Ha nincs Linux bináris, próbáljuk meg a Windows verziót (.exe)
      if [ -f "$SERVER_DIR/TheForestDedicatedServer.exe" ]; then
        SERVER_FILE="$SERVER_DIR/TheForestDedicatedServer.exe"
        USE_WINE=true
      elif [ -f "$SERVER_DIR/steamapps/common/The Forest Dedicated Server/TheForestDedicatedServer.exe" ]; then
        SERVER_FILE="$SERVER_DIR/steamapps/common/The Forest Dedicated Server/TheForestDedicatedServer.exe"
        USE_WINE=true
      elif [ -f "$SERVER_DIR/steamapps/common/TheForestDedicatedServer/TheForestDedicatedServer.exe" ]; then
        SERVER_FILE="$SERVER_DIR/steamapps/common/TheForestDedicatedServer/TheForestDedicatedServer.exe"
        USE_WINE=true
      else
        SERVER_FILE=$(find "$SERVER_DIR" -name "TheForestDedicatedServer.exe" -type f 2>/dev/null | head -1)
        if [ -n "$SERVER_FILE" ]; then
          USE_WINE=true
        else
          SERVER_FILE=$(find "$SERVER_DIR" -name "*.exe" -type f 2>/dev/null | grep -i forest | head -1)
          if [ -n "$SERVER_FILE" ]; then
            USE_WINE=true
          fi
        fi
      fi
    fi
  fi
  
  if [ -n "$SERVER_FILE" ] && [ -f "$SERVER_FILE" ]; then
    FILE_SIZE=$(stat -c%s "$SERVER_FILE" 2>/dev/null || stat -f%z "$SERVER_FILE" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt "0" ]; then
      if [ "$USE_WINE" = "true" ]; then
        echo "TheForestDedicatedServer.exe bináris megtalálva (Windows verzió, Wine szükséges): $SERVER_FILE (méret: $FILE_SIZE bytes)"
      else
        echo "TheForestDedicatedServer.x86_64 bináris megtalálva (Linux natív verzió): $SERVER_FILE (méret: $FILE_SIZE bytes)"
      fi
      INSTALL_SUCCESS=true
      break
    fi
  fi
  
  echo "SteamCMD exit code: $EXIT_CODE" >&2
  echo "TheForestDedicatedServer bináris még nem található, újrapróbálkozás..." >&2
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
    sleep 15
  fi
done

# Végleges ellenőrzés - ha a bináris nem létezik, akkor hiba
if [ "$INSTALL_SUCCESS" != "true" ]; then
  echo "HIBA: TheForestDedicatedServer bináris nem található $MAX_RETRIES próbálkozás után" >&2
  echo "Keresés Linux (.x86_64) és Windows (.exe) verziók után is sikertelen volt." >&2
  echo "Könyvtár tartalma:" >&2
  ls -la "$SERVER_DIR" >&2 || true
  if [ -d "$SERVER_DIR/steamapps" ]; then
    echo "steamapps/ könyvtár tartalma:" >&2
    find "$SERVER_DIR/steamapps" -type f 2>/dev/null | head -20 >&2 || true
  fi
  exit 1
fi

# Symlink létrehozása, ha nem a root könyvtárban van
if [ "$USE_WINE" = "true" ]; then
  if [ "$SERVER_FILE" != "$SERVER_DIR/TheForestDedicatedServer.exe" ]; then
    ln -sf "$SERVER_FILE" "$SERVER_DIR/TheForestDedicatedServer.exe"
    echo "Created symlink to server file at $SERVER_DIR/TheForestDedicatedServer.exe"
    SERVER_FILE="$SERVER_DIR/TheForestDedicatedServer.exe"
  fi
  chmod +x "$SERVER_DIR/TheForestDedicatedServer.exe" 2>/dev/null || true
else
  if [ "$SERVER_FILE" != "$SERVER_DIR/TheForestDedicatedServer.x86_64" ]; then
    ln -sf "$SERVER_FILE" "$SERVER_DIR/TheForestDedicatedServer.x86_64"
    echo "Created symlink to server file at $SERVER_DIR/TheForestDedicatedServer.x86_64"
    SERVER_FILE="$SERVER_DIR/TheForestDedicatedServer.x86_64"
  fi
  chmod +x "$SERVER_DIR/TheForestDedicatedServer.x86_64" 2>/dev/null || true
fi

# Végrehajtási jogosultságok beállítása
chmod +x "$SERVER_FILE" 2>/dev/null || true

chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"

FILE_SIZE=$(stat -c%s "$SERVER_FILE" 2>/dev/null || stat -f%z "$SERVER_FILE" 2>/dev/null || echo "0")
if [ "$USE_WINE" = "true" ]; then
  echo "The Forest szerver sikeresen telepítve (Windows verzió, Wine szükséges): $SERVER_FILE (méret: $FILE_SIZE bytes)"
else
  echo "The Forest szerver sikeresen telepítve (Linux natív verzió): $SERVER_FILE (méret: $FILE_SIZE bytes)"
fi
`;

