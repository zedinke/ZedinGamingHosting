/**
 * Valheim konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  steamAppId: 896660,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/start_server.sh', // Valheim-nél nincs külön config fájl, de a start script lehet itt
  startCommand: './valheim_server.x86_64 -nographics -batchmode -name "{name}" -port {port} -world "{world}" -password "{password}" -public {public}',
  stopCommand: 'quit',
  port: 2456,
  queryPort: 2457,
  additionalPorts: [2457, 2458],
  environmentVariables: {},
  defaultSettings: {
    world: 'Dedicated',
    public: '1'
  }
};