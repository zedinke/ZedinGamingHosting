/**
 * ARK: Survival Evolved telepítő script
 */

export const installScript = `
#!/bin/bash
set +e
SERVER_DIR="/opt/servers/{serverId}"

# Minden könyvtárat root tulajdonba teszünk, mivel root-ként futunk mindent
mkdir -p /opt/servers
chmod 755 /opt/servers
chown root:root /opt/servers

# Szerver könyvtár létrehozása root tulajdonban
mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
chown -R root:root "$SERVER_DIR"

cd "$SERVER_DIR"

# SteamCMD home könyvtár létrehozása és jogosultságok beállítása
STEAM_HOME="/tmp/steamcmd-home-$$"
mkdir -p "$STEAM_HOME"
chown -R root:root "$STEAM_HOME"
chmod -R 755 "$STEAM_HOME"

# Ellenőrizzük, hogy a globális SteamCMD létezik-e
if [ ! -f /opt/steamcmd/steamcmd.sh ]; then
  echo "HIBA: SteamCMD nem található: /opt/steamcmd/steamcmd.sh" >&2
  exit 1
fi

# ARK Evolved szerver telepítése globális SteamCMD-vel
echo "Installing ARK: Survival Evolved dedicated server..."
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 376030 validate +quit
EXIT_CODE=$?

# Ideiglenes Steam home könyvtár törlése
rm -rf "$STEAM_HOME" 2>/dev/null || true

# Könyvtárak létrehozása
mkdir -p ShooterGame/Saved/Config/LinuxServer
mkdir -p ShooterGame/Saved/SavedArks
chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
`;

