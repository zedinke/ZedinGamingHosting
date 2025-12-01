/**
 * Elden Ring konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/elden-ring';

export const config: GameServerConfig = {
  steamAppId: 1245620,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/EldenRing/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Elden Ring konfigurációs fájl generálása
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

