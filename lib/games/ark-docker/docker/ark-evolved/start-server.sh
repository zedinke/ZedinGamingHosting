#!/bin/bash
set -e

# ARK: Survival Evolved Server Launcher
# This script is run inside the Docker container

echo "[$(date)] Starting ARK: Survival Evolved Server..."

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

# Create server directories
SERVER_DIR="/data/ark-evolved"
mkdir -p "$SERVER_DIR/ShooterGame/Saved/Config/LinuxServer"
mkdir -p "$SERVER_DIR/ShooterGame/Saved/SavedArks"
mkdir -p "$SERVER_DIR/ShooterGame/Saved/Logs"

# Generate GameUserSettings.ini for Linux
cat > "$SERVER_DIR/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini" << EOF
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

echo "[$(date)] Configuration file created at $SERVER_DIR/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini"

# Download and install ARK server if not present
if [ ! -d "$SERVER_DIR/ShooterGame/Binaries/Linux" ] || [ ! -f "$SERVER_DIR/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
    echo "[$(date)] Installing ARK: Survival Evolved server..."
    
    # Create temporary Steam home
    STEAM_HOME=$(mktemp -d)
    trap "rm -rf $STEAM_HOME" EXIT
    
    # Install server using SteamCMD (App ID: 376030 for Linux)
    HOME="$STEAM_HOME" /steamcmd/steamcmd.sh \
        +force_install_dir "$SERVER_DIR" \
        +login anonymous \
        +app_update 376030 validate \
        +quit
    
    if [ $? -ne 0 ]; then
        echo "[$(date)] ERROR: Failed to install ARK: Survival Evolved server"
        exit 1
    fi
    
    echo "[$(date)] Installation completed successfully"
fi

# Make server binary executable
chmod +x "$SERVER_DIR/ShooterGame/Binaries/Linux/ShooterGameServer"

# Start the server
echo "[$(date)] Starting server on port $SERVER_PORT..."

cd "$SERVER_DIR"

# Launch server (Linux native)
./ShooterGame/Binaries/Linux/ShooterGameServer \
    "$MAP_NAME" \
    -server \
    -log \
    -MaxPlayers=$MAX_PLAYERS \
    -port=$SERVER_PORT \
    -QueryPort=$QUERY_PORT \
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
    exit 0
}

trap cleanup SIGTERM SIGINT EXIT

# Wait for server process
wait $SERVER_PID
