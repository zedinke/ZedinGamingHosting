/**
 * Dead by Daylight konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/dead-by-daylight';

export const config: GameServerConfig = {
  steamAppId: 381210,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/DeadByDaylight/Content/ServerConfig/ServerSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Dead by Daylight konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  [key: string]: any;
}): string {
  // Dead by Daylight-nál a konfiguráció általában a szerver indítási paramétereiben van
  return '';
}

