/**
 * The Last of Us konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/the-last-of-us';

export const config: GameServerConfig = {
  steamAppId: 1888930,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/TheLastOfUs/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * The Last of Us konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  [key: string]: any;
}): string {
  return '';
}

