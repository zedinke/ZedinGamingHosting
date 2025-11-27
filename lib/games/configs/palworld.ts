/**
 * Palworld konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/palworld';

export const config: GameServerConfig = {
  steamAppId: 2394010,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/DefaultPalWorldSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 8211,
};

