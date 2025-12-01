/**
 * Death Stranding konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/death-stranding';

export const config: GameServerConfig = {
  steamAppId: 1190460,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/DeathStranding/Config/ServerConfig.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
};

/**
 * Death Stranding konfigurációs fájl generálása
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

