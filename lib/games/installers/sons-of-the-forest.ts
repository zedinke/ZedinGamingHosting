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
DOCKER_IMAGE="cm2network/steamcmd:wine"
CONTAINER_NAME="sotf-server-$SERVER_ID"

echo "======================================"
echo "Sons of the Forest Server Installation"
echo "AppID: 2465200 (Dedicated Server)"
echo "Method: Docker + Wine (Windows binary)"
echo "======================================"
echo ""

# Ellenőrizzük, hogy Docker telepítve van-e
if ! command -v docker &> /dev/null; then
  echo "⚠️  Docker nincs telepítve. Automatikus telepítés folyamatban..."
  echo "Ez eltarthat 1-2 percig..."
  echo ""
  
  # Docker hivatalos telepítő script futtatása
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
  
  # Docker szolgáltatás indítása
  systemctl start docker
  systemctl enable docker
  
  # Ellenőrzés
  if ! command -v docker &> /dev/null; then
    echo "❌ HIBA: Docker telepítés sikertelen!"
    echo "Kézi telepítés: curl -fsSL https://get.docker.com | sh"
    exit 1
  fi
  
  echo "✅ Docker sikeresen telepítve: \$(docker --version)"
  echo ""
else
  echo "✅ Docker már telepítve: \$(docker --version)"
  echo ""
fi

# Szerver könyvtár létrehozása
mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
cd "$SERVER_DIR"

# Docker konténer leállítása ha fut
echo "🔄 Meglévő konténer ellenőrzése..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true
echo ""

# SteamCMD Docker konténerrel telepítés (Wine support)
echo "📦 Sons of the Forest szerver letöltése SteamCMD-vel..."
echo "   AppID: 2465200 (Dedicated Server)"
echo "   Platform: Windows (Wine emuláció)"
echo "   Méret: ~4-5 GB"
echo ""
echo "⏳ Ez eltarthat 5-10 percig a hálózati sebességtől függően..."
echo ""

docker run --rm \\
  -v "$SERVER_DIR:/data" \\
  "$DOCKER_IMAGE" \\
  +@sSteamCmdForcePlatformType windows \\
  +force_install_dir /data \\
  +login anonymous \\
  +app_update 2465200 validate \\
  +quit

echo ""

# Ellenőrizzük a telepítést
if [ ! -f "$SERVER_DIR/SonsOfTheForestDS.exe" ]; then
  echo "❌ HIBA: Szerver fájlok nem találhatók!"
  echo "Keresett fájl: SonsOfTheForestDS.exe"
  echo ""
  echo "Könyvtár tartalma:"
  ls -la "$SERVER_DIR/" | head -20
  exit 1
fi

echo "✅ Szerver fájlok sikeresen letöltve!"
echo ""

# Könyvtárak létrehozása
echo "📁 Szerver könyvtárak előkészítése..."
mkdir -p "$SERVER_DIR/userdata"
mkdir -p "$SERVER_DIR/logs"
mkdir -p "$SERVER_DIR/configs"
chmod -R 777 "$SERVER_DIR"

# Alapértelmezett konfiguráció létrehozása
cat > "$SERVER_DIR/dedicatedserver.cfg" << 'EOFCFG'
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

# Docker indító script létrehozása
cat > "$SERVER_DIR/start-server.sh" << 'EOFSTART'
#!/bin/bash
SERVER_ID="{serverId}"
SERVER_DIR="/opt/servers/$SERVER_ID"
CONTAINER_NAME="sotf-server-$SERVER_ID"

echo "🚀 Sons of the Forest szerver indítása..."

docker run -d \\
  --name "$CONTAINER_NAME" \\
  --restart unless-stopped \\
  -v "$SERVER_DIR:/server" \\
  -p 8766:8766/udp \\
  -p 27016:27016/udp \\
  -p 9700:9700/udp \\
  cm2network/steamcmd:wine \\
  wine /server/SonsOfTheForestDS.exe -batchmode -nographics

if [ \$? -eq 0 ]; then
  echo "✅ Szerver sikeresen elindítva!"
  echo "📊 Státusz: docker ps -f name=$CONTAINER_NAME"
  echo "📋 Logok: docker logs -f $CONTAINER_NAME"
else
  echo "❌ HIBA: Szerver indítás sikertelen!"
  exit 1
fi
EOFSTART

chmod +x "$SERVER_DIR/start-server.sh"

# Stop script létrehozása
cat > "$SERVER_DIR/stop-server.sh" << 'EOFSTOP'
#!/bin/bash
SERVER_ID="{serverId}"
CONTAINER_NAME="sotf-server-$SERVER_ID"

echo "🛑 Sons of the Forest szerver leállítása..."

docker stop "$CONTAINER_NAME"
docker rm "$CONTAINER_NAME"

if [ \$? -eq 0 ]; then
  echo "✅ Szerver sikeresen leállítva!"
else
  echo "⚠️  Figyelmeztetés: Konténer leállítás során hiba lépett fel"
fi
EOFSTOP

chmod +x "$SERVER_DIR/stop-server.sh"

echo ""
echo "✅ ======================================"
echo "✅ Sons of the Forest Szerver TELEPÍTVE!"
echo "✅ ======================================"
echo ""
echo "📋 Szerver információk:"
echo "   - AppID: 2465200 (Dedicated Server)"
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
