/**
 * ARK: Survival Ascended telepítő script
 * Hivatalos SteamCMD dokumentáció alapján: https://developer.valvesoftware.com/wiki/SteamCMD
 */

export const installScript = `
#!/bin/bash
# Hiba kezelés: stop on first error (críz fájlok és az error trap)
set -e
trap 'echo "KRITIKUS HIBA: Script futása leállt" >&2; exit 1' ERR

# ARK-nál a shared path-ot használjuk (felhasználó + szervergép kombináció)
# A game-server-installer.ts lecseréli a /opt/servers/{serverId}-t a sharedPath-re
SERVER_DIR="/opt/servers/{serverId}"

# Rendszer ellenőrzés
echo "Rendszer ellenőrzése..."
if ! command -v wine64 &> /dev/null; then
  echo "KRITIKUS HIBA: wine64 nem telepítve" >&2
  exit 1
fi

if ! command -v Xvfb &> /dev/null; then
  echo "KRITIKUS HIBA: Xvfb (X virtual framebuffer) nem telepítve" >&2
  exit 1
fi

# Minden könyvtárat root tulajdonba teszünk, mivel root-ként futunk mindent
mkdir -p "$(dirname "$SERVER_DIR")"
chmod 755 "$(dirname "$SERVER_DIR")"
chown root:root "$(dirname "$SERVER_DIR")"

# Szerver könyvtár létrehozása root tulajdonban
mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
chown -R root:root "$SERVER_DIR"

cd "$SERVER_DIR"

# SteamCMD home könyvtár létrehozása
STEAM_HOME="/tmp/steamcmd-home-$$"
mkdir -p "$STEAM_HOME"
chmod -R 755 "$STEAM_HOME"

# Ellenőrizzük, hogy a globális SteamCMD létezik-e
if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
  echo "KRITIKUS HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
  exit 1
fi

# Lemezterület ellenőrzés
AVAILABLE_SPACE=$(df "$SERVER_DIR" | awk 'NR==2 {print $4}')
REQUIRED_SPACE=102400  # 100GB in KB
if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
  echo "KRITIKUS HIBA: Nincs elég szabad lemezterület! Szükséges: 100GB, elérhető: $((AVAILABLE_SPACE/1024))GB" >&2
  exit 1
fi

echo "Lemezterület OK: $((AVAILABLE_SPACE/1024))GB elérhető"

# ARK: Survival Ascended szerver telepítése
echo "ARK: Survival Ascended Dedicated Server telepítése indítása..."
echo "App ID: 2430930"
echo "Telepítési könyvtár: $SERVER_DIR"
echo "Becsült idő: 30-60 perc"

MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo ""
  echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  set +e  # Ideiglenesen kikapcsoljuk az error trapping a SteamCMD-hez
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 2430930 validate +quit
  EXIT_CODE=$?
  set -e  # Visszakapcsoljuk az error trapping-et
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 5
  
  # Ellenőrizzük, hogy a telepítés sikeres volt-e
  if [ -d "$SERVER_DIR/ShooterGame" ]; then
    if [ -f "$SERVER_DIR/ShooterGame/Binaries/Win64/ArkAscendedServer.exe" ]; then
      INSTALL_SUCCESS=true
      echo "✅ Telepítés sikeres! Windows bináris (ArkAscendedServer.exe) megtalálható."
      break
    else
      echo "⚠️  A ShooterGame könyvtár létezik, de a Win64 bináris fájl hiányzik."
      if [ -d "$SERVER_DIR/ShooterGame/Binaries" ]; then
        echo "Binaries könyvtár tartalma:"
        ls -la "$SERVER_DIR/ShooterGame/Binaries/" | head -20
      fi
    fi
  fi
  
  echo "⚠️  SteamCMD exit code: $EXIT_CODE"
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Várakozás 30 másodpercet az újrapróbálkozás előtt..."
    sleep 30
  fi
done

# Temp könyvtár törlése
rm -rf "$STEAM_HOME" 2>/dev/null || true

if [ "$INSTALL_SUCCESS" != "true" ]; then
  echo ""
  echo "❌ KRITIKUS HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után"
  echo "Ellenőrzési lista:"
  echo "  1. Internet kapcsolat és Steam CDN elérhetősége"
  echo "  2. SteamCMD telepítve van-e: /opt/steamcmd/steamcmd.sh"
  echo "  3. Elég szabad lemezterület (min. 100GB)"
  echo "  4. Szerver könyvtár írható-e: $SERVER_DIR"
  echo "  5. Wine64 telepítve van-e"
  exit 1
fi

# Könyvtárak és jogosultságok végső beállítása
echo "Könyvtárak és jogosultságok beállítása..."
mkdir -p "$SERVER_DIR/ShooterGame/Saved/Config/WindowsServer"
mkdir -p "$SERVER_DIR/ShooterGame/Saved/SavedArks"
mkdir -p "$SERVER_DIR/logs"

# Logok könyvtár létrehozása
mkdir -p "$SERVER_DIR/logs"
chmod 755 "$SERVER_DIR/logs"

# Executable jogok beállítása
if [ -f "$SERVER_DIR/ShooterGame/Binaries/Win64/ArkAscendedServer.exe" ]; then
  chmod +x "$SERVER_DIR/ShooterGame/Binaries/Win64/ArkAscendedServer.exe"
  echo "✅ ArkAscendedServer.exe (Windows bináris) Wine-hoz előkészítve"
fi

chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"

echo ""
echo "================================"
echo "✅ Telepítés sikeresen befejeződött"
echo "================================"
echo "Shared szerver könyvtár: $SERVER_DIR"
echo "Windows bináris: $SERVER_DIR/ShooterGame/Binaries/Win64/ArkAscendedServer.exe"
echo "Config könyvtár: $SERVER_DIR/ShooterGame/Saved/Config/WindowsServer/"
echo "Logok könyvtár: $SERVER_DIR/logs/"
echo ""
echo "MEGJEGYZÉS: A konfigurációs fájlokat (GameUserSettings.ini) a game-server-installer.ts"
echo "hozza létre az instance mappába az indítás előtt."
echo ""
echo "Szerver indítása Wine-on: wine64 ShooterGame/Binaries/Win64/ArkAscendedServer.exe [paraméterek]"
echo "X virtuális framebuffer (Xvfb) szükséges: Xvfb :99 -screen 0 1024x768x24"
`;

