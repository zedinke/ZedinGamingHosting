#!/bin/bash
# ARK Survival Ascended - Container Start Script

set -e

ARK_DIR=${ARK_DIR:-/ark}
STEAMCMD_DIR="/steamcmd"
APPID=2430930  # ARK Ascended App ID

echo "================================"
echo "ARK Survival Ascended - Server"
echo "================================"
echo ""

# 1. Szerver fájlok letöltése (ha szükséges)
if [ ! -f "$ARK_DIR/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
    echo "📥 ARK szerver letöltése SteamCMD-vel..."
    echo "   AppID: $APPID"
    echo "   Cél: $ARK_DIR"
    echo ""
    
    cd "$STEAMCMD_DIR"
    ./steamcmd.sh \
        +@sSteamCmdForcePlatformType linux \
        +force_install_dir "$ARK_DIR" \
        +login anonymous \
        +app_update $APPID validate \
        +quit
    
    echo "✅ Szerver fájlok letöltve"
    echo ""
fi

# 2. Konfiguráció beolvasása
CONFIG_FILE="$ARK_DIR/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  Konfiguráció nem található: $CONFIG_FILE"
    echo "Alapértelmezett konfigurációt használunk..."
    
    cat > "$CONFIG_FILE" << 'EOF'
{
  "serverName": "ARK Survival Ascended Server",
  "maxPlayers": 70,
  "adminPassword": "adminpassword",
  "ports": {
    "game": 7777,
    "query": 27015,
    "rcon": 27020
  }
}
EOF
fi

SERVER_NAME=$(jq -r '.serverName // "ARK Server"' "$CONFIG_FILE")
MAX_PLAYERS=$(jq -r '.maxPlayers // 70' "$CONFIG_FILE")
ADMIN_PASS=$(jq -r '.adminPassword // "admin123"' "$CONFIG_FILE")

echo "🎮 Szerver indítása:"
echo "   Név: $SERVER_NAME"
echo "   Max játékosok: $MAX_PLAYERS"
echo ""

# 3. Szerver indítása
cd "$ARK_DIR/ShooterGame/Binaries/Linux"

./ShooterGameServer \
    -AllowCrossplayPlatformUnsupportedClientConnect \
    -automanagedmods \
    -clusterid=Cluster_0 \
    -MaxPlayers=$MAX_PLAYERS \
    -ServerAdminPassword=$ADMIN_PASS \
    -PublicIPForEurekaClient=0.0.0.0:7777 \
    -ServerPassword="" \
    -Port=7777 \
    -QueryPort=27015 \
    -RCONPort=27020 \
    -ServerRCONEnabled=True \
    -log

echo "❌ Szerver leállt"
