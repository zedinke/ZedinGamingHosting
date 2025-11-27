/**
 * Valheim konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  steamAppId: 896660,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/start_server.sh',
  startCommand: './valheim_server.x86_64 -name "{name}" -port {port} -world "{world}" -password "{password}" -public 1',
  stopCommand: 'quit',
  port: 2456,
};

