/**
 * The Forest konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/the-forest';

export const config: GameServerConfig = {
  steamAppId: 556450,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server.cfg',
  startCommand: commands.startCommand,
  startCommandWindows: commands.startCommandWindows,
  stopCommand: commands.stopCommand,
  port: 27015,
  queryPort: 27016,
  requiresWine: false, // Alapértelmezetten false, mert először Linux verziót próbálunk
};

/**
 * The Forest konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  queryPort: number;
  maxPlayers: number;
  name: string;
  password?: string;
  adminPassword?: string;
  [key: string]: any;
}): string {
  return `# The Forest Dedicated Server Configuration
# Generated automatically

# Server Name
serverName="${config.name}"

# Server Password (leave empty for no password)
serverPassword="${config.password || ''}"

# Max Players
maxPlayers=${config.maxPlayers}

# Server Port
serverPort=${config.port}

# Query Port (usually port + 1)
queryPort=${config.queryPort}

# Admin Password
adminPassword="${config.adminPassword || 'changeme'}"

# Save Folder Path (relative to server directory)
saveFolderPath=./savefilesserver/

# Additional settings can be added here
# For more information, see the official The Forest server documentation
  `.trim();
}

