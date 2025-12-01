/**
 * Helldivers 2 konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/helldivers-2';

export const config: GameServerConfig = {
  steamAppId: 553850,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/Helldivers2/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Helldivers 2 konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  [key: string]: any;
}): string {
  // Helldivers 2-nél a konfiguráció általában a szerver indítási paramétereiben van
  return '';
}

