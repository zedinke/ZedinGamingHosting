/**
 * Satisfactory telepítő script
 */

export const installScript = `
#!/bin/bash
set +e
SERVER_DIR="/opt/servers/{serverId}"

mkdir -p /opt/servers
chmod 755 /opt/servers
chown root:root /opt/servers

mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
chown -R root:root "$SERVER_DIR"

cd "$SERVER_DIR"

STEAM_HOME="/tmp/steamcmd-home-$$"
mkdir -p "$STEAM_HOME"
chown -R root:root "$STEAM_HOME"
chmod -R 755 "$STEAM_HOME"

if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
  echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
  exit 1
fi

MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  echo "Installing Satisfactory dedicated server..."
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 1690800 validate +quit
  EXIT_CODE=$?
  
  # Várunk egy kicsit, hogy a fájlok biztosan leírásra kerüljenek
  sleep 5
  
  # Ellenőrizzük, hogy a telepítés sikeres volt-e
  if [ -f "$SERVER_DIR/FactoryGame/Binaries/Linux/FactoryGameServer" ] || [ -d "$SERVER_DIR/FactoryGame" ]; then
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

# Konfigurációs könyvtárak létrehozása
mkdir -p "$SERVER_DIR/FactoryGame/Saved/Config/LinuxServer"
chmod -R 755 "$SERVER_DIR/FactoryGame/Saved/Config/LinuxServer"
chown -R root:root "$SERVER_DIR/FactoryGame/Saved/Config/LinuxServer"

# Bináris fájl executable jogok beállítása
# Satisfactory-nél több lehetséges bináris fájl lehet
BINARY_FOUND=false

# Próbáljuk a különböző lehetséges bináris fájlokat
for binary in "FactoryServer.sh" "FactoryGameServer" "FactoryServer" "FactoryServer-Linux-Shipping"; do
  if [ -f "$SERVER_DIR/FactoryGame/Binaries/Linux/$binary" ]; then
    chmod +x "$SERVER_DIR/FactoryGame/Binaries/Linux/$binary"
    echo "$binary executable jogok beállítva"
    BINARY_FOUND=true
    break
  fi
done

# Ha a Binaries/Linux könyvtárban nincs, próbáljuk a FactoryGame gyökerét
if [ "$BINARY_FOUND" = "false" ]; then
  for binary in "FactoryServer.sh" "FactoryGameServer" "FactoryServer"; do
    if [ -f "$SERVER_DIR/FactoryGame/$binary" ]; then
      chmod +x "$SERVER_DIR/FactoryGame/$binary"
      echo "$binary executable jogok beállítva (FactoryGame gyökér)"
      BINARY_FOUND=true
      break
    fi
  done
fi

# Ha még mindig nem található, keresés és hibaüzenet
if [ "$BINARY_FOUND" = "false" ]; then
  echo "FIGYELMEZTETÉS: Satisfactory bináris nem található a várt helyen" >&2
  echo "Keresés a FactoryGame könyvtárban..." >&2
  find "$SERVER_DIR/FactoryGame" -type f \( -name "*Factory*Server*" -o -name "*Server*.sh" \) 2>/dev/null | head -10 || echo "Nem található bináris fájl" >&2
fi

# Szerver felhasználó beállítása (ha létezik)
SERVER_USER="satisfactory"
if id "$SERVER_USER" &>/dev/null; then
    chown -R $SERVER_USER:$SERVER_USER "$SERVER_DIR"
    echo "Fájlok tulajdonosa átállítva: $SERVER_USER"
else
    chown -R root:root "$SERVER_DIR"
fi

chmod -R 755 "$SERVER_DIR"

echo "Satisfactory szerver telepítése sikeresen befejezve."
`;