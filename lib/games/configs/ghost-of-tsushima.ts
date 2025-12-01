/**
 * Ghost of Tsushima konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/ghost-of-tsushima';

export const config: GameServerConfig = {
  steamAppId: 2215430,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/GhostOfTsushima/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Ghost of Tsushima konfigurációs fájl generálása
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

