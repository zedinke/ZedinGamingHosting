/**
 * Rust konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  steamAppId: 258550,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server/server.cfg',
  startCommand: './RustDedicated -batchmode -server.port {port} -server.queryport {queryPort} -server.maxplayers {maxPlayers} -server.hostname "{name}" -server.identity "{name}"',
  stopCommand: 'quit',
  port: 28015,
  queryPort: 28016,
};

