/**
 * Minecraft konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/minecraft';

export const config: GameServerConfig = {
  requiresSteamCMD: false,
  requiresJava: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server.properties',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 25565,
};

