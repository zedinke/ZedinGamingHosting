/**
 * Day of Defeat: Source konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/day-of-defeat-source';

export const config: GameServerConfig = {
  steamAppId: 232290,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/dod/cfg/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
};

/**
 * Day of Defeat: Source konfigurációs fájl generálása
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

