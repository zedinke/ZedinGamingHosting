/**
 * Killing Floor 2 konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/killing-floor-2';

export const config: GameServerConfig = {
  steamAppId: 232130,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/KFGame/Config/PCServer-KFEngine.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7707,
  queryPort: 27015,
  defaultSettings: {
    ServerName: 'Killing Floor 2 Server',
    ServerPassword: '',
    AdminPassword: '',
    MaxPlayers: '6',
    Difficulty: '2', // 0=Suicidal, 1=Hell on Earth, 2=Hard, 3=Normal, 4=Easy
    GameLength: '1', // 0=Short, 1=Normal, 2=Long
    GameMode: 'Survival', // Survival, Objective, etc
    bEnableKickVoting: 'true',
    bEnableMapVoting: 'true',
    bEnableReadySystem: 'true',
  }
};
