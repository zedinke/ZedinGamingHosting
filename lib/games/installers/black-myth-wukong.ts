/**
 * Black Myth: Wukong telepítő script
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

HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update 2358720 validate +quit

rm -rf "$STEAM_HOME" 2>/dev/null || true
chown -R root:root "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
`;

