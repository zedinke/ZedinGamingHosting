/**
 * Seven Days to Die telepítő script
 * Több szerver futtatására optimalizálva - külön felhasználó és sfgames csoport
 */

export const installScript = `
#!/bin/bash
set +e
SERVER_DIR="/opt/servers/{serverId}"

# 1. Rendszer előkészítése
echo "Rendszer előkészítése..."

# 32-bites architektúra engedélyezése (ha még nem volt)
if ! dpkg --print-architecture | grep -q i386; then
  echo "32-bites architektúra engedélyezése..."
  dpkg --add-architecture i386
  apt-get update
fi

# SteamCMD telepítése (ha még nincs)
if ! command -v steamcmd &> /dev/null; then
  echo "SteamCMD telepítése..."
  apt-get update
  apt-get install -y steamcmd lib32gcc-s1
fi

# 2. Mappák és jogosultságok előkészítése
echo "Mappák és jogosultságok előkészítése..."

# Szerver felhasználó és csoport létrehozása (ha még nincs)
# A felhasználó neve a serverId alapján generálódik (pl. seven2, seven3...)
SERVER_USER="seven{serverId}"
SERVER_GROUP="sfgames"

# Csoport létrehozása (ha még nincs)
if ! getent group "$SERVER_GROUP" &>/dev/null; then
  echo "Szerver csoport létrehozása: $SERVER_GROUP"
  groupadd "$SERVER_GROUP"
fi

# Felhasználó létrehozása (ha még nincs)
if ! id "$SERVER_USER" &>/dev/null; then
  echo "Szerver felhasználó létrehozása: $SERVER_USER"
  # Létrehozzuk a felhasználót jelszó nélkül, systemd service-ben fut
  useradd -r -s /bin/bash -m -g "$SERVER_GROUP" "$SERVER_USER"
else
  echo "Felhasználó már létezik: $SERVER_USER"
fi

# Felhasználó hozzáadása a csoporthoz (ha még nincs benne)
usermod -a -G "$SERVER_GROUP" "$SERVER_USER" || true

# Szerver mappa létrehozása
mkdir -p "$SERVER_DIR"
chown -R $SERVER_USER:$SERVER_GROUP "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"

# SetGID bit beállítása (így minden újonnan létrehozott fájl örökli a csoportot)
find "$SERVER_DIR" -type d -exec chmod g+s {} + || true

# Csoport írási jog beállítása
chmod -R g+w "$SERVER_DIR" || true

cd "$SERVER_DIR"

# 3. Szerverfájlok letöltése
echo "Szerverfájlok letöltése..."

STEAM_HOME="/tmp/steamcmd-home-$$"
mkdir -p "$STEAM_HOME"
chown -R $SERVER_USER:$SERVER_GROUP "$STEAM_HOME"
chmod -R 755 "$STEAM_HOME"

if [ ! -f /usr/games/steamcmd ] && [ ! -f /opt/steamcmd/steamcmd.sh ]; then
  echo "HIBA: SteamCMD nem található!" >&2
  exit 1
fi

# SteamCMD parancs meghatározása
STEAMCMD_CMD=""
if [ -f /usr/games/steamcmd ]; then
  STEAMCMD_CMD="/usr/games/steamcmd"
elif [ -f /opt/steamcmd/steamcmd.sh ]; then
  STEAMCMD_CMD="/opt/steamcmd/steamcmd.sh"
fi

MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  echo "Installing Seven Days to Die dedicated server..."
  # Szerver felhasználóként futtatjuk
  sudo -u $SERVER_USER HOME="$STEAM_HOME" $STEAMCMD_CMD +force_install_dir "$SERVER_DIR" +login anonymous +app_update 251570 validate +quit
  EXIT_CODE=$?
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 5
  
  # Ellenőrizzük, hogy a telepítés sikeres volt-e
  if [ -f "$SERVER_DIR/7DaysToDieServer.x86_64" ] || [ -d "$SERVER_DIR/steamapps/common/7 Days To Die Dedicated Server" ]; then
    INSTALL_SUCCESS=true
    break
  fi
  
  echo "SteamCMD exit code: $EXIT_CODE" >&2
  echo "Telepítés még nem teljes, újrapróbálkozás..." >&2
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
    sleep 15
  fi
done

rm -rf "$STEAM_HOME" 2>/dev/null || true

if [ "$INSTALL_SUCCESS" != "true" ]; then
  echo "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után" >&2
  exit 1
fi

# 4. Könyvtárak létrehozása
echo "Könyvtárak létrehozása..."
mkdir -p "$SERVER_DIR/Saves"
mkdir -p "$SERVER_DIR/7DaysToDie_Data"
chown -R $SERVER_USER:$SERVER_GROUP "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
find "$SERVER_DIR" -type d -exec chmod g+s {} + || true
chmod -R g+w "$SERVER_DIR" || true

# 5. Executable jogok beállítása
if [ -f "$SERVER_DIR/7DaysToDieServer.x86_64" ]; then
  chmod +x "$SERVER_DIR/7DaysToDieServer.x86_64"
  chown $SERVER_USER:$SERVER_GROUP "$SERVER_DIR/7DaysToDieServer.x86_64"
  echo "7DaysToDieServer.x86_64 futtathatóvá téve"
fi

# 6. Jogosultságok végső beállítása
echo "Jogosultságok végső beállítása..."

chown -R $SERVER_USER:$SERVER_GROUP "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
find "$SERVER_DIR" -type d -exec chmod g+s {} + || true
chmod -R g+w "$SERVER_DIR" || true

echo "Seven Days to Die szerver telepítése sikeresen befejezve."
echo "Szerver mappa: $SERVER_DIR"
echo "Szerver felhasználó: $SERVER_USER"
echo "Szerver csoport: $SERVER_GROUP"
`;