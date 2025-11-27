/**
 * Palworld konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  steamAppId: 2394010,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/DefaultPalWorldSettings.ini',
  startCommand: './PalServer.sh -port={port} -players={maxPlayers}',
  stopCommand: 'quit',
  port: 8211,
};

