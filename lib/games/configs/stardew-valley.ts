/**
 * Stardew Valley konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/stardew-valley';

export const config: GameServerConfig = {
  steamAppId: 413150,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/StardewValley/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 24642,
};

/**
 * Stardew Valley konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  [key: string]: any;
}): string {
  // Stardew Valley-nál a konfiguráció általában a szerver indítási paramétereiben van
  return '';
}

