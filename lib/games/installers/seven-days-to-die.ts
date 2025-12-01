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
    
    # SteamCMD előkészítése: /tmp/dumps* könyvtárak törlése vagy tulajdonos javítása
    log "SteamCMD előkészítése: /tmp/dumps* könyvtárak ellenőrzése..."
    if [ -d /tmp ] && [ -w /tmp ]; then
        # Töröljük a régi dump könyvtárakat, amelyek problémát okozhatnak
        find /tmp -maxdepth 1 -type d -name "dumps*" -user "$SERVER_USER" -exec rm -rf {} + 2>/dev/null || true
        # Ha más felhasználóé, akkor próbáljuk meg törölni vagy tulajdonost változtatni
        find /tmp -maxdepth 1 -type d -name "dumps*" 2>/dev/null | while read dump_dir; do
            if [ -n "$dump_dir" ] && [ -d "$dump_dir" ]; then
                log "Dump könyvtár található: $dump_dir, törlés..."
                rm -rf "$dump_dir" 2>/dev/null || {
                    log "Nem sikerült törölni $dump_dir, tulajdonos változtatás próbálkozás..."
                    chown -R "$SERVER_USER:$SERVER_GROUP" "$dump_dir" 2>/dev/null || true
                }
            fi
        done
    fi
    
    mkdir -p "$STEAM_HOME"
    chown -R "$SERVER_USER:$SERVER_GROUP" "$STEAM_HOME"
    chmod -R 755 "$STEAM_HOME"
    
    # SteamCMD parancs meghatározása
    STEAMCMD_CMD=""
    if [ -f /opt/steamcmd/steamcmd.sh ]; then
        STEAMCMD_CMD="/opt/steamcmd/steamcmd.sh"
        log "SteamCMD található: /opt/steamcmd/steamcmd.sh"
    elif [ -f /usr/games/steamcmd ]; then
        STEAMCMD_CMD="/usr/games/steamcmd"
        log "SteamCMD található: /usr/games/steamcmd"
    elif command -v steamcmd &> /dev/null; then
        STEAMCMD_CMD="steamcmd"
        log "SteamCMD található: steamcmd (PATH-ban)"
    else
        log "HIBA: SteamCMD nem található!" >&2
        log "Keresett helyek: /opt/steamcmd/steamcmd.sh, /usr/games/steamcmd, PATH" >&2
        exit 1
    fi
    
    # SteamCMD frissítése a telepítés előtt (ez segíthet a "Missing configuration" hiba elkerülésében)
    log "SteamCMD frissítése a telepítés előtt..."
    sudo -u "$SERVER_USER" HOME="$STEAM_HOME" $STEAMCMD_CMD +quit 2>&1 | head -20 || true
    sleep 2
    
    local retry_count=0
    local install_success=false
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        log "SteamCMD futtatása (próbálkozás $((retry_count + 1))/$MAX_RETRIES)..."
        log "Telepítési mappa: $SERVER_DIR"
        log "Steam App ID: $STEAM_APP_ID"
        
        # SteamCMD futtatása részletes logolással
        # Próbáljuk meg először a standard módszert
        log "SteamCMD parancs: $STEAMCMD_CMD +force_install_dir $SERVER_DIR +login anonymous +app_update $STEAM_APP_ID validate +quit"
        sudo -u "$SERVER_USER" HOME="$STEAM_HOME" $STEAMCMD_CMD \
            +force_install_dir "$SERVER_DIR" \
            +login anonymous \
            +app_update "$STEAM_APP_ID" validate \
            +quit 2>&1 | tee -a /tmp/steamcmd-$$.log
        
        # Ha "Missing configuration" hiba van, próbáljuk meg a beta public flaggel
        if grep -qiE "Missing configuration|ERROR.*Failed to install.*294420" /tmp/steamcmd-$$.log; then
            log "SteamCMD 'Missing configuration' hiba észlelve, próbálkozás beta public flaggel..."
            sudo -u "$SERVER_USER" HOME="$STEAM_HOME" $STEAMCMD_CMD \
                +force_install_dir "$SERVER_DIR" \
                +login anonymous \
                +app_update "$STEAM_APP_ID" -beta public validate \
                +quit 2>&1 | tee -a /tmp/steamcmd-$$.log
        fi
        
        local exit_code=$?
        log "SteamCMD exit code: $exit_code"
        
        # Ellenőrizzük a SteamCMD logot
        local steamcmd_has_error=false
        if [ -f /tmp/steamcmd-$$.log ]; then
            log "SteamCMD log tartalma:"
            tail -30 /tmp/steamcmd-$$.log | while read line; do
                log "  $line"
            done
            
            # Ellenőrizzük, hogy van-e ERROR vagy FATAL a logban
            if grep -qiE "ERROR.*Failed to install|Missing configuration|ERROR!|FATAL.*Steam cannot run|Fatal Assertion Failed" /tmp/steamcmd-$$.log; then
                log "HIBA: SteamCMD ERROR vagy FATAL üzenet található a logban!" >&2
                log "SteamCMD hiba részletei:" >&2
                grep -iE "ERROR|Missing|FATAL|Fatal" /tmp/steamcmd-$$.log | while read line; do
                    log "  $line" >&2
                done
                steamcmd_has_error=true
                
                # Ha a FATAL hiba a /tmp/dumps* könyvtárakkal kapcsolatos, próbáljuk meg megoldani
                if grep -qiE "FATAL.*Steam cannot run|Please delete.*dumps" /tmp/steamcmd-$$.log; then
                    log "SteamCMD FATAL hiba: /tmp/dumps* könyvtárak problémája" >&2
                    log "Próbáljuk meg törölni a problémás könyvtárakat..." >&2
                    find /tmp -maxdepth 1 -type d -name "dumps*" 2>/dev/null | while read dump_dir; do
                        if [ -n "$dump_dir" ] && [ -d "$dump_dir" ]; then
                            log "Dump könyvtár törlése: $dump_dir" >&2
                            rm -rf "$dump_dir" 2>/dev/null || {
                                chown -R "$SERVER_USER:$SERVER_GROUP" "$dump_dir" 2>/dev/null || true
                            }
                        fi
                    done
                fi
            fi
        fi
        
        # Ellenőrizzük több helyen is a fájlokat
        local server_exe_found=false
        
        # 1. Közvetlenül a SERVER_DIR-ben
        if [ -f "$SERVER_DIR/7DaysToDieServer.x86_64" ]; then
            log "7DaysToDieServer.x86_64 található: $SERVER_DIR/7DaysToDieServer.x86_64"
            server_exe_found=true
        fi
        
        # 2. SteamApps mappában (különböző elérési utak)
        local path1="$SERVER_DIR/steamapps/common/7 Days To Die Dedicated Server/7DaysToDieServer.x86_64"
        local path2="$SERVER_DIR/steamapps/common/7 Days To Die/7DaysToDieServer.x86_64"
        local path3="$SERVER_DIR/steamapps/common/7DaysToDieServer.x86_64"
        
        if [ -f "$path1" ]; then
            log "7DaysToDieServer.x86_64 található: $path1"
            cp "$path1" "$SERVER_DIR/" 2>/dev/null || true
            server_exe_found=true
        elif [ -f "$path2" ]; then
            log "7DaysToDieServer.x86_64 található: $path2"
            cp "$path2" "$SERVER_DIR/" 2>/dev/null || true
            server_exe_found=true
        elif [ -f "$path3" ]; then
            log "7DaysToDieServer.x86_64 található: $path3"
            cp "$path3" "$SERVER_DIR/" 2>/dev/null || true
            server_exe_found=true
        fi
        
        # 3. Ellenőrizzük a mappa tartalmát
        log "SERVER_DIR tartalma:"
        ls -la "$SERVER_DIR" 2>/dev/null | while read line; do
            log "  $line"
        done || log "  (nem sikerült listázni)"
        
        # Ha van ERROR a SteamCMD logban, akkor hibát dobunk
        if [ "$steamcmd_has_error" = "true" ]; then
            log "HIBA: SteamCMD telepítés sikertelen (ERROR üzenet a logban)" >&2
            log "SteamCMD teljes log:" >&2
            cat /tmp/steamcmd-$$.log >&2
            ((retry_count++))
            if [ $retry_count -lt $MAX_RETRIES ]; then
                log "Újrapróbálkozás $retry_count/$MAX_RETRIES..." >&2
                sleep 15
                continue
            else
                log "HIBA: SteamCMD telepítés sikertelen $MAX_RETRIES próbálkozás után" >&2
                log "HIBA: SteamCMD hibaüzenet: 'ERROR! Failed to install app' vagy 'Missing configuration'" >&2
                exit 1
            fi
        fi
        
        # Ellenőrizzük, hogy a bináris fájl létezik-e
        if [ "$server_exe_found" = "true" ]; then
            install_success=true
            break
        fi
        
        log "7DaysToDieServer.x86_64 nem található, újrapróbálkozás..."
        log "Ellenőrzött helyek:" >&2
        log "  - $SERVER_DIR/7DaysToDieServer.x86_64" >&2
        log "  - $SERVER_DIR/steamapps/common/7 Days To Die Dedicated Server/7DaysToDieServer.x86_64" >&2
        log "  - $SERVER_DIR/steamapps/common/7 Days To Die/7DaysToDieServer.x86_64" >&2
        log "  - $SERVER_DIR/steamapps/common/7DaysToDieServer.x86_64" >&2
        ((retry_count++))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            log "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
            sleep 15
        fi
    done
    
    rm -rf "$STEAM_HOME" 2>/dev/null || true
    rm -f /tmp/steamcmd-$$.log 2>/dev/null || true
    
    if [ "$install_success" != "true" ]; then
        log "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után" >&2
        log "Ellenőrzött helyek:" >&2
        log "  - $SERVER_DIR/7DaysToDieServer.x86_64" >&2
        log "  - $SERVER_DIR/steamapps/common/7 Days To Die Dedicated Server/7DaysToDieServer.x86_64" >&2
        exit 1
    fi
    
    log "Telepítés sikeres!"
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
# MEGJEGYZÉS: A config fájlt a game-server-installer.ts generálja dinamikusan
# Ez a függvény csak akkor fut le, ha a config fájl még nem létezik
create_server_config() {
    log "Konfigurációs fájl ellenőrzése..."
    
    local config_file="$SERVER_DIR/serverconfig.xml"
    
    # Ha a config fájl már létezik (dinamikusan generálva), ne írjuk felül
    if [ -f "$config_file" ]; then
        log "Konfigurációs fájl már létezik, kihagyva..."
        return 0
    fi
    
    # Alapértelmezett config csak akkor, ha nincs dinamikusan generált
    log "Alapértelmezett konfigurációs fájl létrehozása..."
    cat > "$config_file" <<'EOL'
<?xml version="1.0" encoding="UTF-8"?>
<ServerSettings>
    <property name="ServerName" value="ZedinGaming 7 Days to Die Server"/>
    <property name="ServerPort" value="26900"/>
    <property name="ServerMaxPlayerCount" value="8"/>
    <property name="ServerPassword" value=""/>
    <property name="ServerVisibility" value="2"/>
    <property name="ServerIsPublic" value="true"/>
    <property name="ServerDescription" value="A 7 Days to Die szerver"/>
    <property name="ServerWebsiteURL" value=""/>
    <property name="GameWorld" value="Navezgane"/>
    <property name="WorldGenSeed" value="asd123"/>
    <property name="WorldGenSize" value="4096"/>
    <property name="GameName" value="My Game"/>
    <property name="GameMode" value="GameModeSurvival"/>
    <property name="Difficulty" value="2"/>
    <property name="DayNightLength" value="60"/>
    <property name="DayLightLength" value="18"/>
    <property name="MaxSpawnedZombies" value="60"/>
    <property name="DropOnDeath" value="1"/>
    <property name="DropOnQuit" value="0"/>
    <property name="BedrollDeadZoneSize" value="15"/>
    <property name="BlockDamagePlayer" value="100"/>
    <property name="BlockDamageZombie" value="100"/>
    <property name="XPMultiplier" value="100"/>
    <property name="PlayerSafeZoneLevel" value="5"/>
    <property name="PlayerSafeZoneHours" value="24"/>
    <property name="BuildCreate" value="false"/>
    <property name="AdminFileName" value="serveradmin.xml"/>
    <property name="TelnetEnabled" value="true"/>
    <property name="TelnetPort" value="26902"/>
    <property name="TelnetPassword" value=""/>
    <property name="ControlPanelEnabled" value="false"/>
    <property name="ControlPanelPort" value="8080"/>
    <property name="ControlPanelPassword" value=""/>
    <property name="MaxUncoveredMapChunksPerPlayer" value="131072"/>
    <property name="PersistentPlayerProfiles" value="false"/>
    <property name="EACEnabled" value="true"/>
    <property name="HideCommandExecutionLog" value="0"/>
    <property name="AirDropFrequency" value="72"/>
    <property name="AirDropMarker" value="false"/>
    <property name="LootAbundance" value="100"/>
    <property name="LootRespawnDays" value="7"/>
    <property name="MaxSpawnedAnimals" value="50"/>
    <property name="LandClaimCount" value="1"/>
    <property name="LandClaimSize" value="41"/>
    <property name="LandClaimExpiryTime" value="7"/>
    <property name="LandClaimDeadZone" value="30"/>
    <property name="LandClaimOnlineDurabilityModifier" value="4"/>
    <property name="LandClaimOfflineDurabilityModifier" value="4"/>
    <property name="LandClaimOfflineDelay" value="0"/>
    <property name="PartySharedKillRange" value="100"/>
    <property name="EnemySenseMemory" value="45"/>
    <property name="EnemySpawnMode" value="true"/>
    <property name="BloodMoonFrequency" value="7"/>
    <property name="BloodMoonRange" value="0"/>
    <property name="BloodMoonWarning" value="8"/>
    <property name="BloodMoonEnemyCount" value="8"/>
    <property name="BloodMoonEnemyRange" value="0"/>
    <property name="UseAllowedZombieClasses" value="false"/>
    <property name="DisableRadio" value="false"/>
    <property name="DisablePoison" value="false"/>
    <property name="DisableInfection" value="false"/>
    <property name="DisableVault" value="false"/>
    <property name="TraderAreaProtection" value="0"/>
    <property name="TraderServiceAreaProtection" value="1"/>
    <property name="ShowFriendPlayerOnMap" value="true"/>
    <property name="FriendCantDamage" value="true"/>
    <property name="FriendCantLoot" value="false"/>
    <property name="BuildCraftTime" value="false"/>
    <property name="ShowAllPlayersOnMap" value="false"/>
    <property name="ShowSpawnWindow" value="false"/>
    <property name="AutoParty" value="false"/>
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