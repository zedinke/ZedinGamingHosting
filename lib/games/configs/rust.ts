/**
 * Rust konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/rust';

export const config: GameServerConfig = {
  steamAppId: 258550,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 28015,
  queryPort: 28016,
};

