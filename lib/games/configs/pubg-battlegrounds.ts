/**
 * PUBG: Battlegrounds konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/pubg-battlegrounds';

export const config: GameServerConfig = {
  steamAppId: 578080,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/PUBG/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
};

/**
 * PUBG: Battlegrounds konfigurációs fájl generálása
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

