/**
 * Minecraft konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  requiresSteamCMD: false,
  requiresJava: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server.properties',
  startCommand: 'java -Xmx{ram}M -Xms{ram}M -jar server.jar nogui',
  stopCommand: 'stop',
  port: 25565,
};

