/**
 * Terraria konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/terraria';

export const config: GameServerConfig = {
  steamAppId: 105600,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/serverconfig.txt',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
  defaultSettings: {
    motd: 'Terraria Server',
    worldname: 'world1',
    difficulty: '1', // 0=Easy, 1=Normal, 2=Expert, 3=Master
    maxplayers: '16',
    world: '/opt/servers/{serverId}/Worlds/',
    secure: '1',
    language: 'en',
    upnp: 'off',
    npcstream: '60',
    priority: 'high',
  }
};
