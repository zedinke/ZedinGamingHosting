/**
 * Satisfactory telepítő script
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

# Wine telepítése (ha még nincs)
if ! command -v wine &> /dev/null; then
  echo "Wine telepítése..."
  apt-get update
  apt-get install -y wine wine32 wine64 winetricks xvfb
fi

# Wine prefix beállítása
export WINEPREFIX="$SERVER_DIR/wineprefix"
export WINEARCH=win64
mkdir -p "$WINEPREFIX"

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
  EXIT_CODE=$?
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 5
  
  # Ellenőrizzük, hogy a telepítés sikeres volt-e
  # Satisfactory Windows bináris, ezért Win64 könyvtárban keresünk
  # Ellenőrizzük, hogy van-e Windows bináris
  if [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer.exe" ] || \
     [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryGameServer.exe" ] || \
     [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer-Win64-Shipping.exe" ] || \
     [ -d "$SERVER_DIR/FactoryGame/Binaries/Win64" ]; then
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

# Konfigurációs könyvtárak létrehozása (Windows szerver, ezért WindowsServer)
mkdir -p "$SERVER_DIR/FactoryGame/Saved/Config/WindowsServer"
chmod -R 755 "$SERVER_DIR/FactoryGame/Saved/Config/WindowsServer"
chown -R root:root "$SERVER_DIR/FactoryGame/Saved/Config/WindowsServer"

# Bináris fájl ellenőrzése (Windows .exe fájl)
BINARY_FOUND=false
BINARY_PATH=""

# Próbáljuk a Windows binárist Win64 könyvtárban
if [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer.exe" ]; then
  echo "FactoryServer.exe található: $SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer.exe"
  BINARY_PATH="$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer.exe"
  BINARY_FOUND=true
elif [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryGameServer.exe" ]; then
  echo "FactoryGameServer.exe található: $SERVER_DIR/FactoryGame/Binaries/Win64/FactoryGameServer.exe"
  BINARY_PATH="$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryGameServer.exe"
  BINARY_FOUND=true
elif [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer-Win64-Shipping.exe" ]; then
  echo "FactoryServer-Win64-Shipping.exe található: $SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer-Win64-Shipping.exe"
  BINARY_PATH="$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer-Win64-Shipping.exe"
  BINARY_FOUND=true
fi

# Ha még mindig nem található, keresés és hibaüzenet
if [ "$BINARY_FOUND" = "false" ]; then
  echo "FIGYELMEZTETÉS: Satisfactory Windows bináris nem található a várt helyen" >&2
  echo "Keresés a FactoryGame könyvtárban..." >&2
  FOUND_EXE=$(find "$SERVER_DIR/FactoryGame" -type f -name "*Factory*Server*.exe" 2>/dev/null | head -1)
  if [ -n "$FOUND_EXE" ]; then
    echo "Talált .exe fájl: $FOUND_EXE" >&2
    BINARY_PATH="$FOUND_EXE"
    BINARY_FOUND=true
  else
    echo "Nem található .exe fájl" >&2
    echo "Elérhető fájlok a Win64 könyvtárban:" >&2
    ls -la "$SERVER_DIR/FactoryGame/Binaries/Win64/" 2>/dev/null || echo "Win64 könyvtár nem létezik" >&2
  fi
fi

# Wine prefix inicializálása (első futtatáskor)
if [ ! -d "$WINEPREFIX/drive_c" ]; then
  echo "Wine prefix inicializálása..."
  export WINEPREFIX
  export WINEARCH=win64
  wineboot --init 2>/dev/null || true
  # Várunk egy kicsit, hogy a wine prefix létrejöjjön
  sleep 3
fi

# Indító script létrehozása a Win64 könyvtárban
if [ "$BINARY_FOUND" = "true" ] && [ -n "$BINARY_PATH" ]; then
  BINARY_DIR=$(dirname "$BINARY_PATH")
  BINARY_NAME=$(basename "$BINARY_PATH")
  
  echo "Indító script létrehozása: $BINARY_DIR/start-server.sh"
  cat > "$BINARY_DIR/start-server.sh" << 'EOFSCRIPT'
#!/bin/bash
set +e

# Könyvtár beállítása
cd "$(dirname "$0")"
BINARY_DIR="$(pwd)"

# Wine prefix beállítása (szerver könyvtárban)
SERVER_DIR="$(cd ../../.. && pwd)"
WINEPREFIX="${WINEPREFIX:-$SERVER_DIR/wineprefix}"
export WINEPREFIX
export WINEARCH="${WINEARCH:-win64}"

# Wine parancs meghatározása
WINE_CMD="wine"
if command -v wine64 &> /dev/null; then
  WINE_CMD="wine64"
fi

# Bináris fájl meghatározása
if [ -f "FactoryServer.exe" ]; then
  BINARY="FactoryServer.exe"
elif [ -f "FactoryGameServer.exe" ]; then
  BINARY="FactoryGameServer.exe"
elif [ -f "FactoryServer-Win64-Shipping.exe" ]; then
  BINARY="FactoryServer-Win64-Shipping.exe"
else
  echo "HIBA: Nem található bináris fájl!" >&2
  echo "Elérhető fájlok:" >&2
  ls -la *.exe 2>/dev/null || echo "Nincs .exe fájl" >&2
  exit 1
fi

# Argumentumok environment változókból (systemd service állítja be)
PORT="${PORT:-15777}"
QUERY_PORT="${QUERY_PORT:-7777}"
BEACON_PORT="${BEACON_PORT:-15000}"

echo "Satisfactory szerver indítása..."
echo "Könyvtár: $BINARY_DIR"
echo "Bináris: $BINARY"
echo "Wine prefix: $WINEPREFIX"
echo "Port: $PORT"
echo "Query Port: $QUERY_PORT"
echo "Beacon Port: $BEACON_PORT"

# Szerver indítása xvfb-run-nal (virtuális display)
if command -v xvfb-run &> /dev/null; then
  echo "xvfb-run használata..."
  xvfb-run -a $WINE_CMD "$BINARY" -log -unattended -multihome=0.0.0.0 -Port=$PORT -BeaconPort=$BEACON_PORT -ServerQueryPort=$QUERY_PORT
else
  echo "Wine használata (xvfb-run nélkül)..."
  $WINE_CMD "$BINARY" -log -unattended -multihome=0.0.0.0 -Port=$PORT -BeaconPort=$BEACON_PORT -ServerQueryPort=$QUERY_PORT
fi
EOFSCRIPT
  
  chmod +x "$BINARY_DIR/start-server.sh"
  echo "Indító script létrehozva: $BINARY_DIR/start-server.sh"
  
  # Ellenőrizzük, hogy a script létezik és futtatható
  if [ -x "$BINARY_DIR/start-server.sh" ]; then
    echo "Indító script sikeresen létrehozva és futtatható"
  else
    echo "HIBA: Az indító script nem futtatható!" >&2
    exit 1
  fi
fi

# Szerver felhasználó beállítása (ha létezik)
SERVER_USER="satisfactory"
if id "$SERVER_USER" &>/dev/null; then
    chown -R $SERVER_USER:$SERVER_USER "$SERVER_DIR"
    echo "Fájlok tulajdonosa átállítva: $SERVER_USER"
else
    chown -R root:root "$SERVER_DIR"
fi

chmod -R 755 "$SERVER_DIR"

echo "Satisfactory szerver telepítése sikeresen befejezve."
`;