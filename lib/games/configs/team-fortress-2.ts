/**
 * Team Fortress 2 konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/team-fortress-2';

export const config: GameServerConfig = {
  steamAppId: 232250,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/tf/cfg/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
  queryPort: 27016, // Source engine query port
};

/**
 * Team Fortress 2 konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  [key: string]: any;
}): string {
  return `
hostname "${config.name}"
maxplayers ${config.maxPlayers}
sv_lan 0
rcon_password "${config.password || 'changeme'}"
  `.trim();
}

