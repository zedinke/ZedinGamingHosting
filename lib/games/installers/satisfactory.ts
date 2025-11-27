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
  if [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer.exe" ] || [ -d "$SERVER_DIR/FactoryGame" ]; then
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

# Próbáljuk a Windows binárist
if [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer.exe" ]; then
  echo "FactoryServer.exe található"
  BINARY_FOUND=true
elif [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryGameServer.exe" ]; then
  echo "FactoryGameServer.exe található"
  BINARY_FOUND=true
elif [ -f "$SERVER_DIR/FactoryGame/Binaries/Win64/FactoryServer-Win64-Shipping.exe" ]; then
  echo "FactoryServer-Win64-Shipping.exe található"
  BINARY_FOUND=true
fi

# Ha még mindig nem található, keresés és hibaüzenet
if [ "$BINARY_FOUND" = "false" ]; then
  echo "FIGYELMEZTETÉS: Satisfactory Windows bináris nem található a várt helyen" >&2
  echo "Keresés a FactoryGame könyvtárban..." >&2
  find "$SERVER_DIR/FactoryGame" -type f -name "*.exe" 2>/dev/null | head -10 || echo "Nem található .exe fájl" >&2
fi

# Wine prefix inicializálása (első futtatáskor)
if [ ! -d "$WINEPREFIX/drive_c" ]; then
  echo "Wine prefix inicializálása..."
  wineboot --init 2>/dev/null || true
  # Várunk egy kicsit, hogy a wine prefix létrejöjjön
  sleep 3
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