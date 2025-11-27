/**
 * Satisfactory konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/satisfactory';

export const config: GameServerConfig = {
  steamAppId: 1690800,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/FactoryGame/Saved/Config/LinuxServer/GameUserSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 15777,
  queryPort: 7777,
  beaconPort: 15000,
  additionalPorts: [15000],
  environmentVariables: {},
  defaultSettings: {
    serverName: 'Satisfactory Server',
    maxPlayers: '4',
    serverDescription: 'Satisfactory Dedicated Server',
    autoSave: 'true',
    autoSaveInterval: '300'
  }
};