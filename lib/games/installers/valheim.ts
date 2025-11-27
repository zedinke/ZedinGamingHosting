/**
 * Valheim telepítő script
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
  if [ -f "$SERVER_DIR/valheim_server.x86_64" ] || [ -f "$SERVER_DIR/start_server.sh" ]; then
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

# Start script executable jogok beállítása
if [ -f "$SERVER_DIR/start_server.sh" ]; then
  chmod +x "$SERVER_DIR/start_server.sh"
fi

if [ -f "$SERVER_DIR/valheim_server.x86_64" ]; then
  chmod +x "$SERVER_DIR/valheim_server.x86_64"
fi

# Steam runtime beállítása Valheim-hoz
# A Valheim szervernek szüksége van a steamclient.so fájlra
if [ -d "/opt/steamcmd/linux64" ]; then
  # Másoljuk a steamclient.so fájlt a szerver könyvtárba, ha nincs
  if [ ! -f "$SERVER_DIR/linux64/steamclient.so" ]; then
    mkdir -p "$SERVER_DIR/linux64"
    if [ -f "/opt/steamcmd/linux64/steamclient.so" ]; then
      cp /opt/steamcmd/linux64/steamclient.so "$SERVER_DIR/linux64/steamclient.so"
      echo "steamclient.so másolva a szerver könyvtárba"
    fi
  fi
  
  # Másoljuk a steamclient.so fájlt a szerver gyökerébe is (alternatíva)
  if [ -f "/opt/steamcmd/linux64/steamclient.so" ] && [ ! -f "$SERVER_DIR/steamclient.so" ]; then
    cp /opt/steamcmd/linux64/steamclient.so "$SERVER_DIR/steamclient.so"
    echo "steamclient.so másolva a szerver gyökerébe"
  fi
fi

# Steam runtime könyvtár létrehozása a root home könyvtárban
mkdir -p /root/.steam/sdk64
if [ -f "/opt/steamcmd/linux64/steamclient.so" ]; then
  if [ ! -f "/root/.steam/sdk64/steamclient.so" ]; then
    cp /opt/steamcmd/linux64/steamclient.so /root/.steam/sdk64/steamclient.so
    echo "steamclient.so másolva /root/.steam/sdk64/ könyvtárba"
  fi
fi

chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"

echo "Valheim szerver telepítése sikeresen befejezve."
`;