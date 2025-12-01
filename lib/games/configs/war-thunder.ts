/**
 * War Thunder konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/war-thunder';

export const config: GameServerConfig = {
  steamAppId: 236390,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/WarThunder/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 8080,
};

/**
 * War Thunder konfigurációs fájl generálása
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

