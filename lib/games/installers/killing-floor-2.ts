/**
 * Killing Floor 2 telepítő script
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
  
  echo "Installing Killing Floor 2 dedicated server..."
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 232130 validate +quit
  EXIT_CODE=$?
  
  sleep 5
  
  if [ -f "$SERVER_DIR/Binaries/Linux/KFGameServer" ] || [ -d "$SERVER_DIR/KFGame" ]; then
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

mkdir -p "$SERVER_DIR/KFGame/Config"
chmod -R 755 "$SERVER_DIR/KFGame/Config"

if [ -f "$SERVER_DIR/Binaries/Linux/KFGameServer" ]; then
  chmod +x "$SERVER_DIR/Binaries/Linux/KFGameServer"
fi

chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"

echo "Killing Floor 2 szerver telepítése sikeresen befejezve."
`;
