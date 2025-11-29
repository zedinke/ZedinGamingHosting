/**
 * Satisfactory konfiguráció (Natív Linux szerver)
 * 
 * A Satisfactory-nak van natív Linux szerver verziója, ami FactoryServer.sh scriptet használ.
 * A konfigurációs fájlok a ~/.config/Epic/FactoryGame/Saved/Config/LinuxServer/ mappában vannak.
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/satisfactory';

export const config: GameServerConfig = {
  steamAppId: 1690800,
  requiresSteamCMD: true,
  requiresWine: false, // Natív Linux szerver, Wine nem kell
  installScript: '', // Telepítő script külön fájlban
  configPath: '/home/satis/.config/Epic/FactoryGame/Saved/Config/LinuxServer/GameUserSettings.ini', // Linux szerver
  startCommand: commands.startCommand,
  startCommandWindows: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 15777,
  queryPort: 7777,
  beaconPort: 15000,
  additionalPorts: [15000, 7777],
  environmentVariables: {},
  defaultSettings: {
    serverName: 'Satisfactory Server',
    maxPlayers: '4',
    serverDescription: 'Satisfactory Dedicated Server',
    autoSave: 'true',
    autoSaveInterval: '300'
  }
};