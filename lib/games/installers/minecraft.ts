/**
 * Minecraft telepítő script
 */

export const installScript = `
#!/bin/bash
set -e
cd /opt/servers/{serverId}
LATEST_VERSION=$(curl -s https://launchermeta.mojang.com/mc/game/version_manifest.json | grep -oP '"release":\\s*"\\K[^"]+' | head -1)
SERVER_URL=$(curl -s "https://launchermeta.mojang.com/mc/game/version_manifest.json" | grep -A 1 "$LATEST_VERSION" | grep -oP '"url":\\s*"\\K[^"]+')
JAR_URL=$(curl -s "$SERVER_URL" | grep -oP '"server":\\s*{\\s*"url":\\s*"\\K[^"]+')
wget -qO server.jar "$JAR_URL"
echo "eula=true" > eula.txt
mkdir -p plugins worlds logs
`;

