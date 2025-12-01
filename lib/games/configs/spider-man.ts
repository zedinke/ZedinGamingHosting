/**
 * Spider-Man konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/spider-man';

export const config: GameServerConfig = {
  steamAppId: 1817070,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/SpiderMan/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Spider-Man konfigurációs fájl generálása
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

