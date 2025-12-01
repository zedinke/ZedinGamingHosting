/**
 * Ready or Not konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/ready-or-not';

export const config: GameServerConfig = {
  steamAppId: 1144200,
  requiresSteamCMD: true,
  requiresWine: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/ReadyOrNot/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  startCommandWindows: commands.startCommandWindows,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Ready or Not konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  [key: string]: any;
}): string {
  // Ready or Not-nál a konfiguráció általában a szerver indítási paramétereiben van
  return '';
}

