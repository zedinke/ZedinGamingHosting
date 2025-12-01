/**
 * Portal 2 konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/portal-2';

export const config: GameServerConfig = {
  steamAppId: 620,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/portal2/cfg/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
};

/**
 * Portal 2 konfigurációs fájl generálása
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
sv_lan 0
rcon_password "${config.password || 'changeme'}"
  `.trim();
}

