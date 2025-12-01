/**
 * Horizon Zero Dawn konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/horizon-zero-dawn';

export const config: GameServerConfig = {
  steamAppId: 1151640,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/HorizonZeroDawn/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Horizon Zero Dawn konfigurációs fájl generálása
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

