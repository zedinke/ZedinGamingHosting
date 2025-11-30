/**
 * Seven Days to Die konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/seven-days-to-die';

export const config: GameServerConfig = {
  steamAppId: 294420, // 7 Days to Die Dedicated Server AppID
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/serverconfig.xml',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 26900,
  queryPort: 26901,
  defaultSettings: {
    ServerPort: '26900',
    ServerName: 'Seven Days to Die Server',
    ServerPassword: '',
    MaxPlayers: '8',
    GameDifficulty: '2', // 0-4 között
    GameWorld: 'Navezgane', // térképtípus
    WorldSize: 'medium', // térképméret
    ZombiesRun: '0', // 0: lassúak, 1: futnak éjjel, 2: mindig futnak
    LootRespawnDays: '7', // napok között mennyi idő után jelennek meg újra a tárgyak
    EnemyDifficulty: '0', // ellenségek erősségi szintje
    PlayerKillingMode: '0', // játékosok közötti PvP szabályok
  }
};