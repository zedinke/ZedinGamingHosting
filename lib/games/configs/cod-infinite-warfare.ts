/**
 * Call of Duty: Infinite Warfare konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/cod-infinite-warfare';

export const config: GameServerConfig = {
  steamAppId: 292730,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/configs/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
  requiresWine: true, // Windows játék Wine-nal Linux-on
};

/**
 * Call of Duty: Infinite Warfare konfigurációs fájl generálása
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
sv_allowdownload 1
sv_alltalk 0
hostname "${config.name}"
maxplayers ${config.maxPlayers}
  `.trim();
}
