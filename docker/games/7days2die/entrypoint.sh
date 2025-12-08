#!/bin/bash
set -e

STEAMCMD_DIR=/opt/steamcmd
SERVER_DIR=/opt/7days2die
STEAM_APP_ID=251570

echo "=== 7 Days to Die Dedicated Server ==="
echo "Server Directory: ${SERVER_DIR}"
echo "Steam App ID: ${STEAM_APP_ID}"

# SteamCMD update futtatása
echo "Updating/Installing 7 Days to Die server..."
cd ${STEAMCMD_DIR}
./steamcmd.sh +force_install_dir ${SERVER_DIR} \
    +login anonymous \
    +app_update ${STEAM_APP_ID} validate \
    +quit

# Konfigurációs fájlok ellenőrzése
if [ ! -f "${SERVER_DIR}/serverconfig.xml" ]; then
    echo "Warning: serverconfig.xml not found, using defaults"
fi

# Szerver indítás
echo "Starting 7 Days to Die server..."
cd ${SERVER_DIR}

# Szerver indítási parancs
# A portok és egyéb beállítások a serverconfig.xml-ből jönnek
exec ./7DaysToDieServer.x86_64 \
    -logfile /dev/stdout \
    -quit \
    -batchmode \
    -nographics \
    -configfile=serverconfig.xml

