#!/bin/bash
set -e

# ARK: Survival Ascended Server Launcher
# This script is run inside the Docker container

echo "[$(date)] Starting ARK: Survival Ascended Server..."

# Validate required environment variables
required_vars=(
    "SERVER_NAME"
    "SERVER_PORT"
    "QUERY_PORT"
    "STEAM_API_KEY"
    "MAP_NAME"
    "MAX_PLAYERS"
    "DIFFICULTY"
    "SERVER_PASSWORD"
    "ADMIN_PASSWORD"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "[$(date)] ERROR: Required environment variable '$var' is not set"
        exit 1
    fi
done

# Set up Wine environment
export DISPLAY=:99
export WINEARCH=win64
export WINEPREFIX=/wine

# Start Xvfb for headless Wine
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
XVFB_PID=$!

# Create server directories
SERVER_DIR="/data/ark-ascended"
mkdir -p "$SERVER_DIR/ShooterGame/Saved/Config/WindowsServer"
mkdir -p "$SERVER_DIR/ShooterGame/Saved/SavedArks"
mkdir -p "$SERVER_DIR/ShooterGame/Saved/Logs"

# Generate GameUserSettings.ini
cat > "$SERVER_DIR/ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini" << EOF
[/Script/ShooterGame.ShooterGameUserSettings]
ServerName=$SERVER_NAME
ServerPassword=$SERVER_PASSWORD
AdminPassword=$ADMIN_PASSWORD
MaxPlayers=$MAX_PLAYERS
DifficultyOffset=$(($(echo "$DIFFICULTY" | awk '{printf "%d\n", ($1/0.2)}')))
MapName=$MAP_NAME
QueryPort=$QUERY_PORT
Port=$SERVER_PORT
ClusterID=${CLUSTER_ID:-}
ClusterDataDir=/cluster

[/Script/ShooterGame.ShooterGameMode]
bUseCorpseLocator=True
bPreventSpawnAnimations=False
bRaidDinoCharacterFood=False
bAllowCrateSpawnsOnTopOfStructures=True
PreventOfflinePvPInterval=900.0
AutoPvEStartTimeSeconds=1200
AutoPvEEndTimeSeconds=10800
AutoPvEUseSystemTime=False
AutoPvECooldownOverride=0

[/Script/Engine.GameSession]
MaxPlayers=$MAX_PLAYERS
MaxSpectatorsPerPlayer=2

; Cluster settings if enabled
$(if [ -n "$CLUSTER_ID" ]; then echo "
[/Script/ShooterGame.ShooterGameMode]
ClusteringEnabled=True
"; fi)
EOF

echo "[$(date)] Configuration file created at $SERVER_DIR/ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini"

# Download and install ARK server if not present
if [ ! -d "$SERVER_DIR/ShooterGame/Binaries/Win64" ] || [ ! -f "$SERVER_DIR/ShooterGame/Binaries/Win64/ArkAscendedServer.exe" ]; then
    echo "[$(date)] Installing ARK: Survival Ascended server..."
    
    # Create temporary Steam home
    STEAM_HOME=$(mktemp -d)
    trap "rm -rf $STEAM_HOME" EXIT
    
    # Install server using SteamCMD
    HOME="$STEAM_HOME" /steamcmd/steamcmd.sh \
        +force_install_dir "$SERVER_DIR" \
        +login anonymous \
        +app_update 2430930 validate \
        +quit
    
    if [ $? -ne 0 ]; then
        echo "[$(date)] ERROR: Failed to install ARK: Survival Ascended server"
        kill $XVFB_PID 2>/dev/null || true
        exit 1
    fi
    
    echo "[$(date)] Installation completed successfully"
fi

# Start the server
echo "[$(date)] Starting server on port $SERVER_PORT..."

cd "$SERVER_DIR"

# Launch server with Wine
wine64 ShooterGame/Binaries/Win64/ArkAscendedServer.exe \
    "$MAP_NAME" \
    -server \
    -log \
    -WinLiveMaxPlayers=$MAX_PLAYERS \
    -gameport=$SERVER_PORT \
    -queryport=$QUERY_PORT \
    $([ -n "$SERVER_PASSWORD" ] && echo "-ServerPassword=$SERVER_PASSWORD") \
    $([ -n "$ADMIN_PASSWORD" ] && echo "-ServerAdminPassword=$ADMIN_PASSWORD") \
    $([ -n "$CLUSTER_ID" ] && echo "-ClusterID=$CLUSTER_ID") \
    $([ -n "$CLUSTER_ID" ] && echo "-ClusterDataDir=/cluster") \
    &

SERVER_PID=$!

# Cleanup trap
cleanup() {
    echo "[$(date)] Shutting down server gracefully..."
    kill $SERVER_PID 2>/dev/null || true
    sleep 5
    kill -9 $SERVER_PID 2>/dev/null || true
    kill $XVFB_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT EXIT

# Wait for server process
wait $SERVER_PID
