/**
 * Call of Duty: Warzone konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/call-of-duty-warzone';

export const config: GameServerConfig = {
  steamAppId: 1985810,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/CallOfDutyWarzone/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 3074,
};

/**
 * Call of Duty: Warzone konfigurációs fájl generálása
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

