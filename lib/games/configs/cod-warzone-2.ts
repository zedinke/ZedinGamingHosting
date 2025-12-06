/**
 * Call of Duty: Warzone 2.0 konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/cod-warzone-2';

export const config: GameServerConfig = {
  steamAppId: 1958861,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/warzone.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
  requiresWine: true, // Windows játék Wine-nal Linux-on
};

/**
 * Call of Duty: Warzone 2.0 konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  [key: string]: any;
}): string {
  return `
sv_pure 1
sv_cheats 0
sv_maxclients 150
sv_allowdownload 1
hostname "${config.name}"
maxplayers ${config.maxPlayers}
  `.trim();
}
