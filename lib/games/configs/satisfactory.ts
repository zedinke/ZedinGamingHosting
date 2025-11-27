/**
 * Satisfactory konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/satisfactory';

export const config: GameServerConfig = {
  steamAppId: 1690800,
  requiresSteamCMD: true,
  requiresWine: true, // Satisfactory-nak nincs hivatalos Linux szerver verziója, Wine kell
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/FactoryGame/Saved/Config/WindowsServer/GameUserSettings.ini', // Windows szerver, ezért WindowsServer
  startCommand: commands.startCommand,
  startCommandWindows: commands.startCommand, // Wine-n keresztül fut
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