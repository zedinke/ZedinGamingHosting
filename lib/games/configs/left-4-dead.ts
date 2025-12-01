/**
 * Left 4 Dead konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/left-4-dead';

export const config: GameServerConfig = {
  steamAppId: 222840,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/left4dead/cfg/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
};

/**
 * Left 4 Dead konfigurációs fájl generálása
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

