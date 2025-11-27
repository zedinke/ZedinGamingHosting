/**
 * Valheim konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/valheim';

export const config: GameServerConfig = {
  steamAppId: 896660,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/start_server.sh', // Valheim-nél nincs külön config fájl, de a start script lehet itt
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 2456,
  queryPort: 2457,
  additionalPorts: [2457, 2458],
  environmentVariables: {
    // Steam runtime library path beállítása
    LD_LIBRARY_PATH: '/opt/steamcmd/linux64:/opt/servers/{serverId}/linux64:/opt/servers/{serverId}:$LD_LIBRARY_PATH',
    // Steam API inicializálás
    STEAM_RUNTIME: '1'
  },
  defaultSettings: {
    world: 'Dedicated',
    public: '1'
  }
};