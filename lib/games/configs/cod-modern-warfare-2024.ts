/**
 * Call of Duty: Modern Warfare 2024 konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/cod-modern-warfare-2024';

export const config: GameServerConfig = {
  steamAppId: 2149880,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
  requiresWine: true, // Windows játék Wine-nal Linux-on
};

/**
 * Call of Duty: Modern Warfare 2024 konfigurációs fájl generálása
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
sv_maxrate 30000
sv_minrate 20000
rate 25000
sv_maxunlag 1.0
hostname "${config.name}"
maxplayers ${config.maxPlayers}
  `.trim();
}
