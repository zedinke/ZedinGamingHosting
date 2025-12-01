/**
 * ARK: Survival Ascended telepítő script
 * Hivatalos SteamCMD dokumentáció alapján: https://developer.valvesoftware.com/wiki/SteamCMD
 */

export const installScript = `
#!/bin/bash
set +e
# ARK-nál a shared path-ot használjuk (felhasználó + szervergép kombináció)
# A game-server-installer.ts lecseréli a /opt/servers/{serverId}-t a sharedPath-re
SERVER_DIR="/opt/servers/{serverId}"

# Minden könyvtárat root tulajdonba teszünk, mivel root-ként futunk mindent
# ARK-nál a shared mappa könyvtárát használjuk
mkdir -p "$(dirname "$SERVER_DIR")"
chmod 755 "$(dirname "$SERVER_DIR")"
chown root:root "$(dirname "$SERVER_DIR")"

# Szerver könyvtár létrehozása root tulajdonban
# ARK-nál ez a shared mappa lesz (pl. /opt/ark-shared/{userId}-{machineId})
mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
chown -R root:root "$SERVER_DIR"

cd "$SERVER_DIR"

# SteamCMD home könyvtár létrehozása és jogosultságok beállítása
# A SteamCMD a HOME könyvtárat használja a login információk tárolásához
STEAM_HOME="/tmp/steamcmd-home-$$"
mkdir -p "$STEAM_HOME"
chown -R root:root "$STEAM_HOME"
chmod -R 755 "$STEAM_HOME"

# Ellenőrizzük, hogy a globális SteamCMD létezik-e
if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
  echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
  echo "Kérjük, telepítsd a SteamCMD-et az agent telepítés során!" >&2
  exit 1
fi

# ARK: Survival Ascended szerver telepítése globális SteamCMD-vel
# App ID: 2430930 (ARK: Survival Ascended Dedicated Server)
# Hivatalos SteamCMD dokumentáció szerint:
# - force_install_dir MINDIG a login előtt kell használni
# - login anonymous: anonim bejelentkezés (nem kell Steam fiók)
# - app_update <appid> validate: alkalmazás letöltése és validálása
# - quit: kilépés a SteamCMD-ből
echo "Installing ARK: Survival Ascended dedicated server..."
echo "SteamCMD App ID: 2430930"
echo "Install directory: $SERVER_DIR"

MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  # Hivatalos SteamCMD parancs formátum:
  # steamcmd.sh +force_install_dir <path> +login anonymous +app_update <appid> validate +quit
  # A HOME változót beállítjuk, hogy a SteamCMD a temp könyvtárat használja
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 2430930 validate +quit
  EXIT_CODE=$?
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 5
  
  # Ellenőrizzük, hogy a telepítés sikeres volt-e
  # ARK: Survival Ascended struktúra:
  # - ShooterGame/ könyvtár a szerver fájlokkal
  # - vagy steamapps/common/ARK Survival Ascended/ könyvtár
  if [ -d "$SERVER_DIR/ShooterGame" ] || [ -d "$SERVER_DIR/steamapps/common/ARK Survival Ascended" ]; then
    # Ellenőrizzük, hogy a bináris fájl létezik-e
    if [ -f "$SERVER_DIR/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
      INSTALL_SUCCESS=true
      echo "Telepítés sikeres! Bináris fájl megtalálható."
      break
    else
      echo "Figyelem: A ShooterGame könyvtár létezik, de a bináris fájl még nem található." >&2
    fi
  fi
  
  echo "SteamCMD exit code: $EXIT_CODE" >&2
  echo "Telepítés még nem teljes, újrapróbálkozás..." >&2
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
    sleep 15
  fi
done

# Temp könyvtár törlése
rm -rf "$STEAM_HOME" 2>/dev/null || true

if [ "$INSTALL_SUCCESS" != "true" ]; then
  echo "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után" >&2
  echo "Ellenőrizd:" >&2
  echo "  - Internet kapcsolat" >&2
  echo "  - SteamCMD telepítve van-e: /opt/steamcmd/steamcmd.sh" >&2
  echo "  - Elég hely van-e a lemezen" >&2
  echo "  - A szerver könyvtár írható-e: $SERVER_DIR" >&2
  exit 1
fi

# Könyvtárak létrehozása a shared mappában
# ARK-nál a bináris fájlok a shared mappában vannak
# A konfigurációs fájlokat a game-server-installer.ts hozza létre az instance mappába
mkdir -p "$SERVER_DIR/ShooterGame/Saved/Config/LinuxServer"
mkdir -p "$SERVER_DIR/ShooterGame/Saved/SavedArks"
chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"

# Megjegyzés: A konfigurációs fájlokat (GameUserSettings.ini, Game.ini) 
# a game-server-installer.ts hozza létre az instance mappába
# (pl. /opt/ark-shared/{userId}-{machineId}/instances/{serverId}/ShooterGame/Saved/Config/LinuxServer/)
# Ez biztosítja, hogy minden szerver instance saját konfigurációval rendelkezzen

# Executable jogok beállítása a szerver binárisra
if [ -f "$SERVER_DIR/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
  chmod +x "$SERVER_DIR/ShooterGame/Binaries/Linux/ShooterGameServer"
fi

echo "=== Installálás kész ==="
echo "Shared szerver könyvtár: $SERVER_DIR"
echo "Bináris fájlok telepítve"
echo "Megjegyzés: A konfigurációs fájlokat a game-server-installer.ts hozza létre az instance mappába"
`;

