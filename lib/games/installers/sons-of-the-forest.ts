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
  echo "❌ HIBA: Docker nincs telepítve!"
  echo "Telepítés: curl -fsSL https://get.docker.com | sh"
  exit 1
fi

# Szerver könyvtár létrehozása
mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
cd "$SERVER_DIR"

# Docker konténer leállítása ha fut
echo "🔄 Meglévő konténer ellenőrzése..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# SteamCMD Docker konténerrel telepítés (Wine support)
echo "📦 Sons of the Forest szerver letöltése SteamCMD-vel (AppID 2465200)..."
echo "⚠️  Windows bináris - Wine emuláció szükséges"
echo ""

docker run --rm \
  -v "$SERVER_DIR:/data" \
  "$DOCKER_IMAGE" \
  +@sSteamCmdForcePlatformType windows \
  +force_install_dir /data \
  +login anonymous \
  +app_update 2465200 validate \
  +quit

if [ ! -f "$SERVER_DIR/SonsOfTheForestDS.exe" ]; then
  echo "❌ HIBA: Szerver fájlok nem találhatók!"
  echo "Keresett fájl: SonsOfTheForestDS.exe"
  ls -la "$SERVER_DIR/"
  exit 1
fi

echo "✅ Szerver fájlok sikeresen letöltve!"

# Könyvtárak létrehozása
echo "📁 Szerver könyvtárak előkészítése..."
mkdir -p "$SERVER_DIR/userdata"
mkdir -p "$SERVER_DIR/logs"
mkdir -p "$SERVER_DIR/configs"
chmod -R 777 "$SERVER_DIR"

# Alapértelmezett konfiguráció létrehozása
cat > "$SERVER_DIR/dedicatedserver.cfg" << 'EOFCFG'
# Sons of the Forest Dedicated Server Config
# Generated: $(date)

IpAddress 0.0.0.0
GamePort 8766
QueryPort 27016
BlobSyncPort 9700
ServerName "Sons of the Forest Server"
MaxPlayers 8
Password ""
LanOnly false
SkipNetworkAccessibilityTest false
GameMode Normal
GameSettings {}
CustomGameModeSettings {}
EOFCFG

echo "✅ Konfiguráció létrehozva: dedicatedserver.cfg"

# Docker indító script létrehozása
cat > "$SERVER_DIR/start-server.sh" << 'EOFSTART'
#!/bin/bash
SERVER_ID="{serverId}"
SERVER_DIR="/opt/servers/$SERVER_ID"
CONTAINER_NAME="sotf-server-$SERVER_ID"

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -v "$SERVER_DIR:/server" \
  -p 8766:8766/udp \
  -p 27016:27016/udp \
  -p 9700:9700/udp \
  cm2network/steamcmd:wine \
  wine /server/SonsOfTheForestDS.exe -batchmode -nographics
EOFSTART

AJÁNLOTT MEGOLDÁSOK:
====================

1. **LEGEGYSZERŰBB** - Más játék kiválasztása:
   ✅ Rust - AppID 258550 (teljes támogatás)
   ✅ ARK: Survival Evolved - AppID 376030
   ✅ Valheim - AppID 896660
   ✅ Minecraft Java - Open-source szerver
   ✅ CSGO 2 / CS2 - AppID 730
   ✅ Garry's Mod - AppID 4000

2. **FIZETETT ALTERNATÍVÁK** - Harmadik fél hosztok:
   - G-Portal.com
     * Sons of the Forest szerver: ~5-15 EUR/hó
     * Profi támogatás magyar nyelven
   - Nitrado.net
   - GameServers.com
   - Auf.net

3. **HOSSZÚ TÁVÚ MEGOLDÁS**:
   - Ha Zed Gaming szeretne Sons of the Forest támogatást,
     szükséges Valve kapcsolattartó szintű megállapodás
   - Ez jelenleg nem lehetséges kisebb hosztok számára

TÁMOGATÁS ÉS INFORMÁCIÓ:
=======================
E-mail: support@zedgaminghosting.hu
Discord: https://discord.gg/zedgaming
Dokumentáció: https://zedgaminghosting.hu/docs
Támogatott játékok: https://zedgaminghosting.hu/games

Készítési dátum: 2025-12-07
EOFMSG

chmod +x "$SERVER_DIR/start-server.sh"

# Stop script létrehozása
cat > "$SERVER_DIR/stop-server.sh" << 'EOFSTOP'
#!/bin/bash
SERVER_ID="{serverId}"
CONTAINER_NAME="sotf-server-$SERVER_ID"
docker stop "$CONTAINER_NAME"
docker rm "$CONTAINER_NAME"
EOFSTOP

chmod +x "$SERVER_DIR/stop-server.sh"

echo ""
echo "✅ ======================================"
echo "✅ Sons of the Forest Szerver TELEPÍTVE!"
echo "✅ ======================================"
echo ""
echo "📋 Szerver információk:"
echo "   - AppID: 2465200 (Dedicated Server)"
echo "   - Platform: Windows (Wine/Docker)"
echo "   - Port: 8766 (UDP)"
echo "   - Query Port: 27016 (UDP)"
echo "   - Max Players: 8"
echo ""
echo "🚀 Indítás: bash $SERVER_DIR/start-server.sh"
echo "🛑 Leállítás: bash $SERVER_DIR/stop-server.sh"
echo ""
echo "📁 Szerver mappa: $SERVER_DIR"
echo "⚙️  Konfig: $SERVER_DIR/dedicatedserver.cfg"
echo ""

exit 0
`;

// Export config
export const config = {
  name: "Sons of the Forest",
  appId: 2465200, // ✅ CORRECT - Dedicated Server
  platform: "windows",
  method: "docker-wine",
  supported: true, // ✅ NOW SUPPORTED via Docker
  ports: [8766, 27016, 9700],
  requiresDocker: true,
};
