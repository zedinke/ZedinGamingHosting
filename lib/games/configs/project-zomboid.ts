/**
 * Project Zomboid konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/project-zomboid';

export const config: GameServerConfig = {
  requiresSteamCMD: true,
  steamAppId: 108600,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/Zomboid/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 16261,
  queryPort: 16262,
  requiresJava: true,
  defaultSettings: {
    ServerName: 'Project Zomboid Server',
    ServerPassword: '',
    ServerWelcomeMessage: 'Üdvözöl a Project Zomboid szerver!',
    MaxPlayers: 32,
    PvP: false,
    PauseEmpty: true,
    PublicServer: true,
    Difficulty: 'Normal', // Novice, Normal, Hard, Hardcore
    Zombies: 'Medium', // Low, Medium, High, Extreme
    Map: 'Muldraugh, KY', // alaptérkép
    ServerPort: 16261,
    AdminUsername: '',
    AdminPassword: '',
    SafetySystem: true,
    ShowFirstAidAllowed: true,
    SpawnRegion: 'Default',
    SpawnPoint: '0,0,0', // x,y,z koordináták
    StartYear: 1993,
    StartMonth: 7, // július
    StartDay: 10,
    StartTime: '09:00'
  }
};