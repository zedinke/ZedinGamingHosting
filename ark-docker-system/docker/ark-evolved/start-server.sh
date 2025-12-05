#!/bin/bash
set -e

# ARK Survival Evolved Server Startup Script
# Runs within Docker container on Linux

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Load configuration from environment
SERVER_NAME="${SERVER_NAME:-ARK Evolved Server}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
SERVER_PASSWORD="${SERVER_PASSWORD:-}"
MAX_PLAYERS="${MAX_PLAYERS:-70}"
MAP="${MAP:-TheIsland}"
DIFFICULTY="${DIFFICULTY:-1}"
PVP="${PVP:-1}"
CLUSTER_ENABLED="${CLUSTER_ENABLED:-0}"
CLUSTER_NAME="${CLUSTER_NAME:-}"
ENABLE_CROSSPLAY="${ENABLE_CROSSPLAY:-0}"
PVE_DISABLE_FRIENDLY_FIRE="${PVE_DISABLE_FRIENDLY_FIRE:-0}"

# Directory configuration
DATA_DIR="${DATA_DIR:-/ark/data}"
BACKUP_DIR="${BACKUP_DIR:-/ark/backups}"
LOG_DIR="${LOG_DIR:-/ark/logs}"
STEAMCMD_DIR="${STEAMCMD_DIR:-/ark/steamcmd}"

# Performance configuration
THREAD_COUNT="${THREAD_COUNT:-4}"
MAX_FRAME_RATE="${MAX_FRAME_RATE:-60}"
ENABLE_CROSSHAIR="${ENABLE_CROSSHAIR:-1}"

# Ensure directories exist
mkdir -p "$DATA_DIR" "$BACKUP_DIR" "$LOG_DIR"

log "========================================"
log "ARK Evolved Server - Docker Startup"
log "========================================"
log "Server Name: $SERVER_NAME"
log "Map: $MAP"
log "Max Players: $MAX_PLAYERS"
log "Difficulty: $DIFFICULTY"
log "PVP: $PVP"
log "Crossplay: $ENABLE_CROSSPLAY"
log "Cluster Mode: $CLUSTER_ENABLED"
log "Thread Count: $THREAD_COUNT"
log "========================================"

# Check SteamCMD availability
if [ ! -f "$STEAMCMD_DIR/steamcmd.sh" ]; then
    error "SteamCMD not found at $STEAMCMD_DIR/steamcmd.sh"
fi

log "SteamCMD found at $STEAMCMD_DIR"

# Check if server is installed
SERVER_EXE="/ark/server/ShooterGame/Binaries/Linux/ShooterGameServer"
if [ ! -f "$SERVER_EXE" ]; then
    warn "Server executable not found at $SERVER_EXE"
    warn "Attempting to download server via SteamCMD..."
    
    log "Downloading ARK Evolved server..."
    bash "$STEAMCMD_DIR/steamcmd.sh" \
        +@sSteamCmdForcePlatformType linux \
        +login anonymous \
        +app_update 376030 validate \
        +quit \
        || error "Failed to download ARK Evolved server"
    
    if [ ! -f "$SERVER_EXE" ]; then
        error "Server download completed but executable not found"
    fi
    
    log "Server downloaded successfully"
fi

# Make executable
chmod +x "$SERVER_EXE"

log "Preparing server configuration..."

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
CMD_ARGS="$CMD_ARGS?PvEAllowStructuresAtSupplyDrops=True"
CMD_ARGS="$CMD_ARGS?bPvEDisableFriendlyFire=$PVE_DISABLE_FRIENDLY_FIRE"
CMD_ARGS="$CMD_ARGS?EnableCrossplay=$ENABLE_CROSSPLAY"

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

# Add additional arguments
CMD_ARGS="$CMD_ARGS -log"
CMD_ARGS="$CMD_ARGS -servergamelog"
CMD_ARGS="$CMD_ARGS -NoBattlEye"
CMD_ARGS="$CMD_ARGS -NoBattlEyeServer"

# Set environment variables for performance
export LD_LIBRARY_PATH="/ark/server/ShooterGame/Binaries/Linux:$LD_LIBRARY_PATH"
export OMP_NUM_THREADS="$THREAD_COUNT"

# Set up backup automation (optional)
if [ -d "$BACKUP_DIR" ]; then
    log "Backup directory: $BACKUP_DIR"
    info "Backups should be scheduled via cron or container orchestration"
fi

# Log startup information
{
    echo "========================================"
    echo "ARK Evolved Server Startup Log"
    echo "Date: $(date)"
    echo "========================================"
    echo "Server Name: $SERVER_NAME"
    echo "Map: $MAP"
    echo "Max Players: $MAX_PLAYERS"
    echo "Difficulty: $DIFFICULTY"
    echo "Thread Count: $THREAD_COUNT"
    echo "Command: $SERVER_EXE $CMD_ARGS"
    echo "========================================"
} >> "$LOG_DIR/startup.log"

# Pre-startup checks
log "Running pre-startup checks..."

# Check data directory permissions
if [ ! -w "$DATA_DIR" ]; then
    error "Data directory is not writable: $DATA_DIR"
fi

# Check backup directory
if [ ! -w "$BACKUP_DIR" ]; then
    warn "Backup directory is not writable: $BACKUP_DIR"
fi

# Calculate memory and thread info
TOTAL_MEM=$(free -m | awk 'NR==2 {print $2}')
log "Total available memory: ${TOTAL_MEM}MB"
log "Thread count: $THREAD_COUNT"

# Start the ARK Evolved server
log "Starting ARK Evolved Server..."
log "Command: $SERVER_EXE $CMD_ARGS"
info "Server startup initiated - watch logs below"

# Execute server with error handling
if exec "$SERVER_EXE" $CMD_ARGS; then
    log "Server started successfully"
else
    error "Server failed to start with exit code: $?"
fi
