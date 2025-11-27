/**
 * The Forest konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/the-forest';

export const config: GameServerConfig = {
  steamAppId: 556450,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server.cfg',
  startCommand: commands.startCommand,
  startCommandWindows: commands.startCommandWindows,
  stopCommand: commands.stopCommand,
  port: 27015,
  queryPort: 27016,
  requiresWine: false, // Alapértelmezetten false, mert először Linux verziót próbálunk
};

