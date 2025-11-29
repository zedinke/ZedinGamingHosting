/**
 * Satisfactory telepítő script (Natív Linux szerver)
 * 
 * Ez a script natív Linux szervert telepít, nem Wine-t használ.
 * A Satisfactory-nak van natív Linux szerver verziója, ami FactoryServer.sh scriptet használ.
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
  apt-get install -y steamcmd
fi

# 2. Mappák és jogosultságok előkészítése
echo "Mappák és jogosultságok előkészítése..."

# Szerver felhasználó és csoport létrehozása (ha még nincs)
SERVER_USER="satis"
SERVER_GROUP="sfgames"

if ! id "$SERVER_USER" &>/dev/null; then
  echo "Szerver felhasználó létrehozása: $SERVER_USER"
  useradd -r -s /bin/bash -m "$SERVER_USER"
fi

if ! getent group "$SERVER_GROUP" &>/dev/null; then
  echo "Szerver csoport létrehozása: $SERVER_GROUP"
  groupadd "$SERVER_GROUP"
fi

# Felhasználó hozzáadása a csoporthoz
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
  
  echo "Installing Satisfactory dedicated server..."
  # Szerver felhasználóként futtatjuk
  sudo -u $SERVER_USER HOME="$STEAM_HOME" $STEAMCMD_CMD +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1690800 validate +quit
  EXIT_CODE=$?
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 5
  
  # Ellenőrizzük, hogy a telepítés sikeres volt-e
  # Natív Linux szerver, ezért FactoryServer.sh scriptet keresünk
  if [ -f "$SERVER_DIR/FactoryServer.sh" ]; then
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
  echo "Ellenőrzés: FactoryServer.sh fájl létezése..." >&2
  ls -la "$SERVER_DIR/" 2>/dev/null || true
  exit 1
fi

# 4. Konfigurációs mappák létrehozása
echo "Konfigurációs mappák létrehozása..."

# Linux szerver konfigurációs mappa
CONFIG_DIR="/home/$SERVER_USER/.config/Epic/FactoryGame/Saved/Config/LinuxServer"
sudo -u $SERVER_USER mkdir -p "$CONFIG_DIR"

# Jogosultságok beállítása a konfigurációs mappán
chown -R $SERVER_USER:$SERVER_GROUP "/home/$SERVER_USER/.config"
chmod -R g+w "/home/$SERVER_USER/.config"
find "/home/$SERVER_USER/.config" -type d -exec chmod g+s {} + || true

# 5. Game.ini fájl létrehozása (alapértelmezett port beállítással)
echo "Game.ini fájl létrehozása..."

GAME_INI="$CONFIG_DIR/Game.ini"
if [ ! -f "$GAME_INI" ]; then
  sudo -u $SERVER_USER cat > "$GAME_INI" << 'EOFINI'
[/Script/Engine.GameNetworkManager]
Port=15777
EOFINI
  echo "Game.ini fájl létrehozva: $GAME_INI"
else
  echo "Game.ini fájl már létezik: $GAME_INI"
fi

# 6. FactoryServer.sh futtathatóságának biztosítása
if [ -f "$SERVER_DIR/FactoryServer.sh" ]; then
  chmod +x "$SERVER_DIR/FactoryServer.sh"
  chown $SERVER_USER:$SERVER_GROUP "$SERVER_DIR/FactoryServer.sh"
  echo "FactoryServer.sh futtathatóvá téve"
fi

# 7. Jogosultságok végső beállítása
echo "Jogosultságok végső beállítása..."

chown -R $SERVER_USER:$SERVER_GROUP "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
find "$SERVER_DIR" -type d -exec chmod g+s {} + || true
chmod -R g+w "$SERVER_DIR" || true

echo "Satisfactory szerver telepítése sikeresen befejezve."
echo "Szerver mappa: $SERVER_DIR"
echo "Konfigurációs mappa: $CONFIG_DIR"
echo "Indító script: $SERVER_DIR/FactoryServer.sh"
`;