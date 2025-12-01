/**
 * Black Myth: Wukong konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/black-myth-wukong';

export const config: GameServerConfig = {
  steamAppId: 2358720,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/BlackMythWukong/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Black Myth: Wukong konfigurációs fájl generálása
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

