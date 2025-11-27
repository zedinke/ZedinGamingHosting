/**
 * Conan Exiles telepítő script
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

# Conan Exiles szerver telepítése globális SteamCMD-vel
echo "Installing Conan Exiles dedicated server..."

MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 440900 validate +quit
  EXIT_CODE=$?
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 5
  
  # Ellenőrizzük, hogy a telepítés sikeres volt-e
  if [ -d "$SERVER_DIR/ConanSandbox" ] || [ -d "$SERVER_DIR/steamapps/common/Conan Exiles Dedicated Server" ]; then
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
mkdir -p "$SERVER_DIR/ConanSandbox/Config"
mkdir -p "$SERVER_DIR/ConanSandbox/Saved"
chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
`;