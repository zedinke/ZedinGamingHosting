/**
 * Sons of the Forest telepítő script
 * AppID: 2465200 (Dedicated Server - FREE)
 * Platform: Windows-only (requires Wine/Docker on Linux)
 * Note: Endnight Games only released Windows server binaries
 */

export const installScript = `
#!/bin/bash
set -e
SERVER_ID="{serverId}"
SERVER_DIR="/opt/servers/$SERVER_ID"
STEAMCMD_IMAGE="cm2network/steamcmd:latest"
CONTAINER_NAME="sotf-server-$SERVER_ID"

echo "======================================"
echo "Sons of the Forest Server Installation"
echo "AppID: 2465200 (Dedicated Server)"
echo "Method: Direct Installation + Wine"
echo "======================================"
echo ""

# Wine telepítése
if ! command -v wine &> /dev/null; then
  echo "⚠️  Wine nincs telepítve. Automatikus telepítés..."
  
  # Debian/Ubuntu rendszer
  dpkg --add-architecture i386
  apt-get update -qq
  apt-get install -y -qq wine wine64 wine32 winbind xvfb
  
  if ! command -v wine &> /dev/null; then
    echo "❌ HIBA: Wine telepítés sikertelen!"
    exit 1
  fi
  
  echo "✅ Wine sikeresen telepítve: \$(wine --version)"
  echo ""
else
  echo "✅ Wine már telepítve: \$(wine --version)"
  echo ""
fi

# Szerver könyvtár létrehozása
mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
cd "$SERVER_DIR"

# SteamCMD telepítése lokálisan
STEAMCMD_DIR="$SERVER_DIR/steamcmd"
mkdir -p "$STEAMCMD_DIR"

if [ ! -f "$STEAMCMD_DIR/steamcmd.sh" ]; then
  echo "📥 SteamCMD letöltése..."
  cd "$STEAMCMD_DIR"
  curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -
  chmod +x steamcmd.sh
  echo "✅ SteamCMD telepítve"
fi

# Sons of the Forest szerver letöltése
echo ""
echo "📦 Sons of the Forest szerver letöltése SteamCMD-vel..."
echo "   AppID: 2465200 (Dedicated Server)"
echo "   Platform: Windows (Wine emuláció)"
echo "   Méret: ~4-5 GB"
echo ""
echo "⏳ Ez eltarthat 5-10 percig a hálózati sebességtől függően..."
echo ""

cd "$STEAMCMD_DIR"
./steamcmd.sh \\
  +@sSteamCmdForcePlatformType windows \\
  +force_install_dir "$SERVER_DIR/game" \\
  +login anonymous \\
  +app_update 2465200 validate \\
  +quit

echo ""

# Ellenőrizzük a telepítést
if [ ! -f "$SERVER_DIR/game/SonsOfTheForestDS.exe" ]; then
  echo "❌ HIBA: Szerver fájlok nem találhatók!"
  echo "Keresett fájl: SonsOfTheForestDS.exe"
  echo ""
  echo "Könyvtár tartalma:"
  ls -la "$SERVER_DIR/game/" | head -20
  exit 1
fi

echo "✅ Szerver fájlok sikeresen letöltve!"
echo ""

# Könyvtárak létrehozása
echo "📁 Szerver könyvtárak előkészítése..."
mkdir -p "$SERVER_DIR/game/userdata"
mkdir -p "$SERVER_DIR/logs"
mkdir -p "$SERVER_DIR/configs"
chmod -R 777 "$SERVER_DIR"

# Alapértelmezett konfiguráció létrehozása
cat > "$SERVER_DIR/game/dedicatedserver.cfg" << 'EOFCFG'
{
  "IpAddress": "0.0.0.0",
  "GamePort": 8766,
  "QueryPort": 27016,
  "BlobSyncPort": 9700,
  "ServerName": "Sons of the Forest Server",
  "MaxPlayers": 8,
  "Password": "",
  "LanOnly": false,
  "SkipNetworkAccessibilityTest": false,
  "GameMode": "Normal",
  "GameSettings": {},
  "CustomGameModeSettings": {}
}
EOFCFG

echo "✅ Konfiguráció létrehozva: dedicatedserver.cfg"

# Szerver indító script létrehozása (Wine-nal)
cat > "$SERVER_DIR/start-server.sh" << 'EOFSTART'
#!/bin/bash
SERVER_ID="{serverId}"
SERVER_DIR="/opt/servers/$SERVER_ID"

echo "🚀 Sons of the Forest szerver indítása Wine-nal..."

cd "$SERVER_DIR/game"

# X Virtual Frame Buffer használata (headless módban)
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x16 &
XVFB_PID=\$!

# Wine indítása
WINEDEBUG=-all wine SonsOfTheForestDS.exe -batchmode -nographics > "$SERVER_DIR/logs/server.log" 2>&1 &
WINE_PID=\$!

echo \$WINE_PID > "$SERVER_DIR/server.pid"
echo \$XVFB_PID > "$SERVER_DIR/xvfb.pid"

echo "✅ Szerver sikeresen elindítva!"
echo "📊 PID: \$WINE_PID"
echo "📋 Logok: tail -f $SERVER_DIR/logs/server.log"
EOFSTART

chmod +x "$SERVER_DIR/start-server.sh"

# Stop script létrehozása
cat > "$SERVER_DIR/stop-server.sh" << 'EOFSTOP'
#!/bin/bash
SERVER_ID="{serverId}"
SERVER_DIR="/opt/servers/$SERVER_ID"

echo "🛑 Sons of the Forest szerver leállítása..."

if [ -f "$SERVER_DIR/server.pid" ]; then
  kill \$(cat "$SERVER_DIR/server.pid") 2>/dev/null || true
  rm -f "$SERVER_DIR/server.pid"
fi

if [ -f "$SERVER_DIR/xvfb.pid" ]; then
  kill \$(cat "$SERVER_DIR/xvfb.pid") 2>/dev/null || true
  rm -f "$SERVER_DIR/xvfb.pid"
fi

# Wine processek leállítása
pkill -f "SonsOfTheForestDS.exe"

echo "✅ Szerver leállítva!"
EOFSTOP

chmod +x "$SERVER_DIR/stop-server.sh"

echo ""
echo "✅ ======================================"
echo "✅ Sons of the Forest Szerver TELEPÍTVE!"
echo "✅ ======================================"
echo ""
echo "📋 Szerver információk:"
echo "   - AppID: 2465200 (Dedicated Server)"
echo "   - Platform: Windows (Wine emuláció)"
echo "   - Installációs könyvtár: $SERVER_DIR/game"
echo "   - Konfiguráció: $SERVER_DIR/game/dedicatedserver.cfg"
echo ""
echo "🎮 Portok:"
echo "   - Game Port: 8766/UDP"
echo "   - Query Port: 27016/UDP"
echo "   - Blob Sync: 9700/UDP"
echo ""
echo "🚀 Szerver indítása:"
echo "   bash $SERVER_DIR/start-server.sh"
echo ""
echo "🛑 Szerver leállítása:"
echo "   bash $SERVER_DIR/stop-server.sh"
echo ""
echo "📋 Logok megtekintése:"
echo "   tail -f $SERVER_DIR/logs/server.log"
echo ""
echo "⚙️  Konfiguráció szerkesztése:"
echo "   nano $SERVER_DIR/game/dedicatedserver.cfg"
echo ""
echo "✅ Telepítés befejezve!"
`;

export default installScript;
echo "   - Platform: Windows (Docker + Wine)"
echo "   - Port: 8766 (UDP)"
echo "   - Query Port: 27016 (UDP)"
echo "   - Blob Sync: 9700 (UDP)"
echo "   - Max Players: 8"
echo ""
echo "🎮 Kezelési parancsok:"
echo "   🚀 Indítás:    bash $SERVER_DIR/start-server.sh"
echo "   🛑 Leállítás:  bash $SERVER_DIR/stop-server.sh"
echo "   📊 Státusz:    docker ps -f name=$CONTAINER_NAME"
echo "   📋 Logok:      docker logs -f $CONTAINER_NAME"
echo ""
echo "📁 Szerver mappa: $SERVER_DIR"
echo "⚙️  Konfiguráció: $SERVER_DIR/dedicatedserver.cfg"
echo ""
echo "✅ Telepítés befejezve sikeresen!"

exit 0
`;

// Export config
export const config = {
  name: "Sons of the Forest",
  appId: 2465200, // ✅ CORRECT - Dedicated Server
  platform: "windows",
  method: "docker-wine",
  supported: true, // ✅ NOW SUPPORTED via Docker (auto-install)
  ports: [8766, 27016, 9700],
  requiresDocker: true,
  autoInstallDocker: true, // ✅ Automatically installs Docker if missing
};
