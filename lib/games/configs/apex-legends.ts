/**
 * Apex Legends konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/apex-legends';

export const config: GameServerConfig = {
  steamAppId: 1172470,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/ApexLegends/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 37015,
};

/**
 * Apex Legends konfigurációs fájl generálása
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

