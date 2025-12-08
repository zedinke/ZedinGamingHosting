#!/bin/bash
# Rust - Container Start Script

set -e

RUST_DIR=${RUST_DIR:-/rust}
STEAMCMD_DIR="/steamcmd"
APPID=258550  # Rust Dedicated Server App ID

echo "================================"
echo "Rust - Server"
echo "================================"
echo ""

# 1. Szerver fájlok letöltése (ha szükséges)
if [ ! -f "$RUST_DIR/RustDedicated" ]; then
    echo "📥 Rust szerver letöltése SteamCMD-vel..."
    echo "   AppID: $APPID"
    echo "   Cél: $RUST_DIR"
    echo ""
    
    cd "$STEAMCMD_DIR"
    ./steamcmd.sh \
        +@sSteamCmdForcePlatformType linux \
        +force_install_dir "$RUST_DIR" \
        +login anonymous \
        +app_update $APPID validate \
        +quit
    
    echo "✅ Szerver fájlok letöltve"
    echo ""
fi

# 2. Konfiguráció beolvasása
CONFIG_FILE="$RUST_DIR/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  Konfiguráció nem található: $CONFIG_FILE"
    echo "Alapértelmezett konfigurációt használunk..."
    
    cat > "$CONFIG_FILE" << 'EOF'
{
  "serverName": "Rust Server",
  "maxPlayers": 100,
  "seed": 12345,
  "worldSize": 3500,
  "ports": {
    "game": 28015,
    "query": 28016,
    "rcon": 28017
  }
}
EOF
fi

SERVER_NAME=$(jq -r '.serverName // "Rust Server"' "$CONFIG_FILE")
MAX_PLAYERS=$(jq -r '.maxPlayers // 100' "$CONFIG_FILE")
SEED=$(jq -r '.seed // 12345' "$CONFIG_FILE")
WORLD_SIZE=$(jq -r '.worldSize // 3500' "$CONFIG_FILE")
RCON_PASS=$(jq -r '.rconPassword // "password"' "$CONFIG_FILE")
GAME_PORT=$(jq -r '.ports.game // 28015' "$CONFIG_FILE")
QUERY_PORT=$(jq -r '.ports.query // 28016' "$CONFIG_FILE")
RCON_PORT=$(jq -r '.ports.rcon // 28017' "$CONFIG_FILE")

echo "🎮 Szerver indítása:"
echo "   Név: $SERVER_NAME"
echo "   Max játékosok: $MAX_PLAYERS"
echo "   World seed: $SEED"
echo "   World size: $WORLD_SIZE"
echo "   Portok: game=$GAME_PORT query=$QUERY_PORT rcon=$RCON_PORT"
echo ""

# 3. Szerver indítása
cd "$RUST_DIR"

./RustDedicated \
    -batchmode \
    -nographics \
    +server.hostname "$SERVER_NAME" \
    +server.maxplayers $MAX_PLAYERS \
    +server.port $GAME_PORT \
    +server.queryport $QUERY_PORT \
    +rcon.port $RCON_PORT \
    +rcon.password $RCON_PASS \
    +server.seed $SEED \
    +server.worldsize $WORLD_SIZE \
    +server.description "Rust Server" \
    +server.url "" \
    +server.headerimage "" \
    +server.tags "" \
    -logfile "$RUST_DIR/logs/server.log"

echo "❌ Szerver leállt"
