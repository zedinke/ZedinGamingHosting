/**
 * God of War konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/god-of-war';

export const config: GameServerConfig = {
  steamAppId: 1593500,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/GodOfWar/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * God of War konfigurációs fájl generálása
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

