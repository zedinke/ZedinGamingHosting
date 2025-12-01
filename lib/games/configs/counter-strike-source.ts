/**
 * Counter-Strike: Source konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/counter-strike-source';

export const config: GameServerConfig = {
  steamAppId: 232330,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/cstrike/cfg/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
};

/**
 * Counter-Strike: Source konfigurációs fájl generálása
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

