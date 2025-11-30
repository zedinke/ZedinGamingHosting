/**
 * Seven Days to Die telepítő script
 * Több szerver futtatására optimalizálva - külön felhasználó és sfgames csoport
 */

export const installScript = `#!/bin/bash
# Seven Days to Die Dedicated Server Telepítő Script
# Verzió: 2024.06.01
# Frissítve a legújabb Linux telepítési irányelvek szerint

set -eu
trap 'echo "Hiba történt a script végrehajtása közben."; exit 1' ERR

# Globális változók
SERVER_DIR="/opt/servers/{serverId}"
STEAM_APP_ID="294420"  # Seven Days to Die dedicated server AppID
SERVER_USER="seven{serverId}"
SERVER_GROUP="sfgames"
MAX_RETRIES=3
STEAM_HOME="/tmp/steamcmd-home-$$"

# Logolási funkció
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Rendszer előkészítése
prepare_system() {
    log "Rendszer előkészítése..."
    
    # 32-bites támogatás és SteamCMD telepítése
    if ! dpkg --print-architecture | grep -q i386; then
        log "32-bites architektúra engedélyezése..."
        dpkg --add-architecture i386
        apt-get update
    fi
    
    # SteamCMD és alapvető függőségek
    apt-get install -y steamcmd lib32gcc-s1 libstdc++6:i386
    
    # 7 Days to Die kritikus audio könyvtárak (Unity motor miatt)
    # A szerver összeomlását megelőzendő, mert még szerver módban is megpróbálja inicializálni a hangrendszert
    log "Audio könyvtárak telepítése (7 Days to Die Unity motor támogatás)..."
    apt-get install -y libpulse0 libasound2 libatomic1 libpulse0:i386 libasound2:i386
}

# Felhasználók és csoportok létrehozása
setup_users_and_groups() {
    log "Felhasználók és csoportok beállítása..."
    
    # Csoport létrehozása
    if ! getent group "$SERVER_GROUP" &>/dev/null; then
        groupadd "$SERVER_GROUP"
    fi
    
    # Felhasználó létrehozása
    if ! id "$SERVER_USER" &>/dev/null; then
        useradd -r -s /bin/bash -m -g "$SERVER_GROUP" "$SERVER_USER"
    fi
    
    usermod -a -G "$SERVER_GROUP" "$SERVER_USER"
}

# Szerver könyvtárának előkészítése
prepare_server_directory() {
    log "Szerver könyvtár előkészítése..."
    
    mkdir -p "$SERVER_DIR"
    mkdir -p "$SERVER_DIR/Saves"
    mkdir -p "$SERVER_DIR/7DaysToDie_Data"
    
    chown -R "$SERVER_USER:$SERVER_GROUP" "$SERVER_DIR"
    chmod -R 755 "$SERVER_DIR"
    find "$SERVER_DIR" -type d -exec chmod g+s {} +
    chmod -R g+w "$SERVER_DIR"
}

# Szerver telepítése SteamCMD-vel
install_server() {
    log "Szerverfájlok letöltése..."
    
    mkdir -p "$STEAM_HOME"
    chown -R "$SERVER_USER:$SERVER_GROUP" "$STEAM_HOME"
    chmod -R 755 "$STEAM_HOME"
    
    local retry_count=0
    local install_success=false
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        log "SteamCMD futtatása (próbálkozás $((retry_count + 1))/$MAX_RETRIES)..."
        
        # SteamCMD parancs meghatározása
        STEAMCMD_CMD=""
        if [ -f /opt/steamcmd/steamcmd.sh ]; then
            STEAMCMD_CMD="/opt/steamcmd/steamcmd.sh"
        elif [ -f /usr/games/steamcmd ]; then
            STEAMCMD_CMD="/usr/games/steamcmd"
        elif command -v steamcmd &> /dev/null; then
            STEAMCMD_CMD="steamcmd"
        else
            log "HIBA: SteamCMD nem található!" >&2
            exit 1
        fi
        
        sudo -u "$SERVER_USER" HOME="$STEAM_HOME" $STEAMCMD_CMD \
            +force_install_dir "$SERVER_DIR" \
            +login anonymous \
            +app_update "$STEAM_APP_ID" validate \
            +quit
        
        local exit_code=$?
        
        if [ -f "$SERVER_DIR/7DaysToDieServer.x86_64" ]; then
            install_success=true
            break
        fi
        
        log "SteamCMD exit code: $exit_code"
        ((retry_count++))
        sleep 15
    done
    
    rm -rf "$STEAM_HOME" 2>/dev/null || true
    
    if [ "$install_success" != "true" ]; then
        log "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után"
        exit 1
    fi
}

# Szerver executable jogosultságok
set_executable_permissions() {
    log "Executable jogok beállítása..."
    
    local server_exe="$SERVER_DIR/7DaysToDieServer.x86_64"
    if [ -f "$server_exe" ]; then
        chmod +x "$server_exe"
        chown "$SERVER_USER:$SERVER_GROUP" "$server_exe"
    fi
}

# Konfigurációs fájl létrehozása
create_server_config() {
    log "Alapértelmezett konfigurációs fájl létrehozása..."
    
    local config_file="$SERVER_DIR/serverconfig.xml"
    cat > "$config_file" <<EOL
<?xml version="1.0"?>
<ServerSettings>
    <property name="ServerPort" value="26900"/>
    <property name="ServerIsPublic" value="true"/>
    <property name="ServerName" value="ZedinGaming 7 Days to Die Server"/>
    <property name="ServerMaxPlayerCount" value="8"/>
    <property name="GameWorld" value="Navezgane"/>
    <property name="GameDifficulty" value="2"/>
    <property name="ZombiesRun" value="0"/>
</ServerSettings>
EOL
    
    chown "$SERVER_USER:$SERVER_GROUP" "$config_file"
    chmod 644 "$config_file"
}

# Indító script létrehozása
create_start_script() {
    log "Indító script létrehozása..."
    
    local start_script="$SERVER_DIR/start-server.sh"
    cat > "$start_script" <<'ENDSCRIPT'
#!/bin/bash
cd "$(dirname "$0")"
export LD_LIBRARY_PATH=.
./7DaysToDieServer.x86_64 \
    -configfile=serverconfig.xml \
    -dedicated \
    -logfile=server_$(date +"%Y%m%d_%H%M%S").log
ENDSCRIPT
    
    chmod +x "$start_script"
    chown "$SERVER_USER:$SERVER_GROUP" "$start_script"
}

# Főfolyamat
main() {
    log "Seven Days to Die dedicated szerver telepítése..."
    
    prepare_system
    setup_users_and_groups
    prepare_server_directory
    install_server
    set_executable_permissions
    create_server_config
    create_start_script
    
    log "Telepítés sikeres!"
    log "Szerver mappa: $SERVER_DIR"
    log "Szerver felhasználó: $SERVER_USER"
    log "Szerver indítása: $SERVER_DIR/start-server.sh"
}

# Főfolyamat végrehajtása
main
`;