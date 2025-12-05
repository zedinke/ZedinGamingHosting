#!/bin/bash
set -e

# ARK Ascended Server Startup Script
# Runs within Docker container with Wine

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1
}

# Load configuration from environment
export WINEPREFIX="${WINE_PREFIX:-/root/.wine}"
export WINE_CPU_TOPOLOGY="${WINE_CPU_TOPOLOGY:-4:2}"
export WINE_SHARED_MEMORY="${WINE_SHARED_MEMORY:-1}"
export DXVK_HUD="${DXVK_HUD:-memory,fps}"

# Server parameters
SERVER_NAME="${SERVER_NAME:-ARK Ascended Server}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
SERVER_PASSWORD="${SERVER_PASSWORD:-}"
MAX_PLAYERS="${MAX_PLAYERS:-70}"
MAP="${MAP:-TheIsland}"
DIFFICULTY="${DIFFICULTY:-1}"
PVP="${PVP:-1}"
CLUSTER_ENABLED="${CLUSTER_ENABLED:-0}"
CLUSTER_NAME="${CLUSTER_NAME:-}"
ENABLE_CROSSPLAY="${ENABLE_CROSSPLAY:-1}"
PVE_DISABLE_FRIENDLY_FIRE="${PVE_DISABLE_FRIENDLY_FIRE:-0}"

# Directory configuration
DATA_DIR="${DATA_DIR:-/ark/data}"
BACKUP_DIR="${BACKUP_DIR:-/ark/backups}"
LOG_DIR="${LOG_DIR:-/ark/logs}"
STEAM_DIR="${STEAM_DIR:-/steam}"

# Ensure directories exist
mkdir -p "$DATA_DIR" "$BACKUP_DIR" "$LOG_DIR" "$STEAM_DIR"

log "========================================"
log "ARK Ascended Server - Docker Startup"
log "========================================"
log "Server Name: $SERVER_NAME"
log "Map: $MAP"
log "Max Players: $MAX_PLAYERS"
log "Difficulty: $DIFFICULTY"
log "PVP: $PVP"
log "Crossplay: $ENABLE_CROSSPLAY"
log "Cluster Mode: $CLUSTER_ENABLED"
log "Wine Prefix: $WINEPREFIX"
log "CPU Topology: $WINE_CPU_TOPOLOGY"
log "========================================"

# Check if server executable exists
SERVER_EXE="/ark/server/Binaries/Win64/ArkAscendedServer.exe"
if [ ! -f "$SERVER_EXE" ]; then
    warn "Server executable not found at $SERVER_EXE"
    warn "Server installation may be needed"
fi

# Build server command line arguments
CMD_ARGS="$MAP?listen"
CMD_ARGS="$CMD_ARGS?Port=7777"
CMD_ARGS="$CMD_ARGS?QueryPort=7778"
CMD_ARGS="$CMD_ARGS?RCONPort=27015"
CMD_ARGS="$CMD_ARGS?MaxPlayers=$MAX_PLAYERS"
CMD_ARGS="$CMD_ARGS?ServerAdminPassword=$ADMIN_PASSWORD"
CMD_ARGS="$CMD_ARGS?Difficulty=$DIFFICULTY"
CMD_ARGS="$CMD_ARGS?AllowThirdPersonPlayer=True"
CMD_ARGS="$CMD_ARGS?UseVSync=False"
CMD_ARGS="$CMD_ARGS?UseRallyHereBackend=False"
CMD_ARGS="$CMD_ARGS?EnableCrossplay=$ENABLE_CROSSPLAY"
CMD_ARGS="$CMD_ARGS?PvEAllowStructuresAtSupplyDrops=True"
CMD_ARGS="$CMD_ARGS?bPvEDisableFriendlyFire=$PVE_DISABLE_FRIENDLY_FIRE"

# Add server password if provided
if [ -n "$SERVER_PASSWORD" ]; then
    CMD_ARGS="$CMD_ARGS?ServerPassword=$SERVER_PASSWORD"
fi

# Add cluster configuration if enabled
if [ "$CLUSTER_ENABLED" = "1" ] || [ "$CLUSTER_ENABLED" = "true" ]; then
    if [ -n "$CLUSTER_NAME" ]; then
        CMD_ARGS="$CMD_ARGS?ClusterDirOverride=/ark/data/cluster"
        mkdir -p "/ark/data/cluster"
        log "Cluster mode enabled: $CLUSTER_NAME"
    else
        warn "Cluster enabled but no cluster name provided"
    fi
fi

# Add additional server arguments
CMD_ARGS="$CMD_ARGS -log"
CMD_ARGS="$CMD_ARGS -HighQualityLods"
CMD_ARGS="$CMD_ARGS -servergamelog"

# Initialize Wine if needed
if [ ! -d "$WINEPREFIX" ]; then
    log "Initializing Wine environment..."
    WINEPREFIX="$WINEPREFIX" wineboot -i
    log "Wine initialization complete"
fi

# Prepare backup directory for game saves
log "Setting up backup and data directories..."
chmod 755 "$DATA_DIR" "$BACKUP_DIR" "$LOG_DIR"

# Log startup information
{
    echo "========================================"
    echo "ARK Ascended Server Startup Log"
    echo "Date: $(date)"
    echo "========================================"
    echo "Server Name: $SERVER_NAME"
    echo "Map: $MAP"
    echo "Max Players: $MAX_PLAYERS"
    echo "Difficulty: $DIFFICULTY"
    echo "Wine Prefix: $WINEPREFIX"
    echo "Command: wine \"$SERVER_EXE\" $CMD_ARGS"
    echo "========================================"
} >> "$LOG_DIR/startup.log"

# Start the ARK Ascended server
log "Starting ARK Ascended Server..."
log "Command: wine \"$SERVER_EXE\" $CMD_ARGS"

# Execute server
exec wine "$SERVER_EXE" $CMD_ARGS
