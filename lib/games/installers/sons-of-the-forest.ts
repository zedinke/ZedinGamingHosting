/**
 * Sons of the Forest telepítő script
 */

export const installScript = `
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

# Sons of the Forest szerver telepítése globális SteamCMD-vel
echo "Installing Sons of the Forest dedicated server..."

MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  # Sons of the Forest dedicated server installation attempts
  # The server may require Windows platform or specific configuration
  if [ $RETRY_COUNT -eq 0 ]; then
    # First attempt: Windows platform (like The Forest)
    echo "Próbálkozás Windows platformmal..."
    HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +@sSteamCmdForcePlatformType windows +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1326470 validate +quit
  elif [ $RETRY_COUNT -eq 1 ]; then
    # Second attempt: Linux platform with beta branch
    echo "Próbálkozás Linux platformmal beta branch-szel..."
    HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1326470 -beta public validate +quit
  else
    # Third attempt: Linux platform without validate
    echo "Próbálkozás Linux platformmal validate nélkül..."
    HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1326470 +quit
  fi
  EXIT_CODE=$?
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 5
  
  # Ellenőrizzük, hogy a telepítés sikeres volt-e
  # Check for both Windows (.exe) and Linux executables, and common directory structures
  if [ -f "$SERVER_DIR/SonsOfTheForestServer" ] || \
     [ -f "$SERVER_DIR/SonsOfTheForestServer.exe" ] || \
     [ -f "$SERVER_DIR/SonsOfTheForestDedicatedServer.exe" ] || \
     [ -d "$SERVER_DIR/steamapps/common/SonsOfTheForestDedicatedServer" ] || \
     [ -d "$SERVER_DIR/steamapps/common/Sons of the Forest Dedicated Server" ] || \
     [ -f "$SERVER_DIR/steamapps/common/SonsOfTheForestDedicatedServer/SonsOfTheForestServer.exe" ] || \
     [ -f "$SERVER_DIR/steamapps/common/Sons of the Forest Dedicated Server/SonsOfTheForestServer.exe" ]; then
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
  echo "" >&2
  echo "Lehetséges okok:" >&2
  echo "1. A Sons of the Forest dedikált szerver telepítéséhez szükség lehet a játék tulajdonjogára" >&2
  echo "2. A szerver nem érhető el névtelen (anonymous) SteamCMD bejelentkezéssel" >&2
  echo "3. A SteamCMD konfigurációja nem megfelelő" >&2
  echo "" >&2
  echo "Ellenőrizd a SteamCMD log fájlokat további részletekért." >&2
  exit 1
fi

# Könyvtárak létrehozása
mkdir -p "$SERVER_DIR/Saved"
chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"

# Executable jogok beállítása (Windows és Linux verziókhoz)
if [ -f "$SERVER_DIR/SonsOfTheForestServer" ]; then
  chmod +x "$SERVER_DIR/SonsOfTheForestServer"
elif [ -f "$SERVER_DIR/SonsOfTheForestServer.exe" ]; then
  chmod +x "$SERVER_DIR/SonsOfTheForestServer.exe"
elif [ -f "$SERVER_DIR/SonsOfTheForestDedicatedServer.exe" ]; then
  chmod +x "$SERVER_DIR/SonsOfTheForestDedicatedServer.exe"
elif [ -f "$SERVER_DIR/steamapps/common/SonsOfTheForestDedicatedServer/SonsOfTheForestServer.exe" ]; then
  chmod +x "$SERVER_DIR/steamapps/common/SonsOfTheForestDedicatedServer/SonsOfTheForestServer.exe"
  # Symlink létrehozása a root könyvtárba
  ln -sf "$SERVER_DIR/steamapps/common/SonsOfTheForestDedicatedServer/SonsOfTheForestServer.exe" "$SERVER_DIR/SonsOfTheForestServer.exe"
elif [ -f "$SERVER_DIR/steamapps/common/Sons of the Forest Dedicated Server/SonsOfTheForestServer.exe" ]; then
  chmod +x "$SERVER_DIR/steamapps/common/Sons of the Forest Dedicated Server/SonsOfTheForestServer.exe"
  # Symlink létrehozása a root könyvtárba
  ln -sf "$SERVER_DIR/steamapps/common/Sons of the Forest Dedicated Server/SonsOfTheForestServer.exe" "$SERVER_DIR/SonsOfTheForestServer.exe"
fi
`;