/**
 * Rust telepítő script
 */

export const installScript = `
#!/bin/bash
# Ne használjunk set -e-t, mert a SteamCMD exit code 8 lehet warning, de a fájlok letöltődhetnek
set +e
SERVER_DIR="/opt/servers/{serverId}"

# Ellenőrizzük, hogy root-ként futunk-e
CURRENT_USER=$(whoami)
CURRENT_UID=$(id -u)
echo "Jelenlegi felhasználó: $CURRENT_USER (UID: $CURRENT_UID)"

if [ "$CURRENT_UID" != "0" ]; then
  echo "FIGYELMEZTETÉS: Nem root-ként futunk! (UID: $CURRENT_UID)" >&2
fi

# Minden könyvtárat root tulajdonba teszünk, mivel root-ként futunk mindent
mkdir -p /opt/servers
chmod 755 /opt/servers
chown root:root /opt/servers

# Ellenőrizzük a /opt/servers könyvtár jogosultságait
echo "Jogosultságok ellenőrzése:"
ls -ld /opt/servers || true

# Szerver könyvtár létrehozása root tulajdonban
# A Rust szerver fájlok közvetlenül a SERVER_DIR-be kerülnek
mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
chown -R root:root "$SERVER_DIR"

# A Rust szerver a server/ alkönyvtárban keresi a konfigurációs fájlt
# Ezt a könyvtárat létrehozzuk a konfigurációs fájl számára
mkdir -p "$SERVER_DIR/server"
chmod 755 "$SERVER_DIR/server"
chown root:root "$SERVER_DIR/server"

# Ellenőrizzük a szerver könyvtár jogosultságait
echo "Szerver könyvtár jogosultságok:"
ls -ld "$SERVER_DIR" || true
ls -ld "$SERVER_DIR/server" || true

# Teszteljük, hogy írhatunk-e a könyvtárba
echo "Írási teszt a könyvtárba..."
touch "$SERVER_DIR/.write_test" 2>&1 && rm -f "$SERVER_DIR/.write_test" && echo "Írási teszt sikeres" || echo "Írási teszt SIKERTELEN" >&2

cd "$SERVER_DIR"

# Rust szerver telepítése SteamCMD-vel
# A SteamCMD közvetlenül a SERVER_DIR-be telepíti a fájlokat
echo "Rust szerver telepítése kezdődik..."
echo "Szerver könyvtár: $SERVER_DIR"

# SteamCMD futtatása - több próbálkozás, ha szükséges
MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  # Biztosítjuk, hogy minden root tulajdonban legyen
  chown -R root:root "$SERVER_DIR"
  chmod -R 755 "$SERVER_DIR"
  
  # SteamCMD home könyvtár létrehozása és jogosultságok beállítása
  STEAM_HOME="/tmp/steamcmd-home-$$"
  mkdir -p "$STEAM_HOME"
  chown -R root:root "$STEAM_HOME"
  chmod -R 755 "$STEAM_HOME"
  
  # Ellenőrizzük, hogy a SteamCMD létezik-e és végrehajtható-e
  if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
    echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
    exit 1
  fi
  
  # Ellenőrizzük a SteamCMD jogosultságait
  if [ ! -x /opt/steamcmd/steamcmd.sh ]; then
    chmod +x /opt/steamcmd/steamcmd.sh
  fi
  
  # Ellenőrizzük a /opt/steamcmd könyvtár jogosultságait
  chown -R root:root /opt/steamcmd 2>/dev/null || true
  chmod -R 755 /opt/steamcmd 2>/dev/null || true
  
  # SteamCMD futtatása ideiglenes HOME könyvtárral
  # Ez biztosítja, hogy a SteamCMD nem használja a /root/.local/share/Steam/ könyvtárat
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 258550 validate +quit
  EXIT_CODE=$?
  
  # Ideiglenes Steam home könyvtár törlése
  rm -rf "$STEAM_HOME" 2>/dev/null || true
  
  # Letöltött fájlok jogosultságainak beállítása (root tulajdonban maradnak)
  chown -R root:root "$SERVER_DIR" 2>/dev/null || true
  chmod -R 755 "$SERVER_DIR" 2>/dev/null || true
  
  # Biztosítjuk, hogy a server/ könyvtár létezik a konfigurációs fájl számára
  mkdir -p "$SERVER_DIR/server"
  chmod 755 "$SERVER_DIR/server"
  chown root:root "$SERVER_DIR/server"
  
  # Ellenőrizzük, hogy a bináris létezik-e (ez a legfontosabb, nem az exit code)
  # A SteamCMD közvetlenül a SERVER_DIR-be telepíti a RustDedicated binárist
  if [ -f "$SERVER_DIR/RustDedicated" ]; then
    echo "RustDedicated bináris megtalálva, telepítés sikeres!"
    INSTALL_SUCCESS=true
    break
  else
    echo "SteamCMD exit code: $EXIT_CODE" >&2
    echo "RustDedicated bináris még nem található, újrapróbálkozás..." >&2
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
      sleep 15
    fi
  fi
done

# Végleges ellenőrzés - ha a bináris nem létezik, akkor hiba
if [ ! -f "$SERVER_DIR/RustDedicated" ]; then
  echo "HIBA: RustDedicated bináris nem található a $SERVER_DIR könyvtárban" >&2
  echo "Könyvtár tartalma:" >&2
  ls -la "$SERVER_DIR" >&2 || true
  echo "SteamCMD utolsó exit code: $EXIT_CODE" >&2
  exit 1
fi

# Végrehajtási jogosultság beállítása
chmod +x "$SERVER_DIR/RustDedicated" || true

# Ellenőrizzük a fájl méretét is (nem lehet 0)
FILE_SIZE=$(stat -f%z "$SERVER_DIR/RustDedicated" 2>/dev/null || stat -c%s "$SERVER_DIR/RustDedicated" 2>/dev/null || echo "0")
if [ "$FILE_SIZE" = "0" ]; then
  echo "FIGYELMEZTETÉS: RustDedicated bináris mérete 0, lehet, hogy sérült" >&2
fi

echo "Rust szerver sikeresen telepítve: $SERVER_DIR/RustDedicated (méret: $FILE_SIZE bytes)"
`;

