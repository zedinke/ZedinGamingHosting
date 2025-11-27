/**
 * Conan Exiles konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/conan-exiles';

export const config: GameServerConfig = {
  steamAppId: 440900,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/ConanSandbox/Config/DefaultGame.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
  queryPort: 7778,
  defaultSettings: {
    ServerName: 'Conan Exiles Server',
    ServerPassword: '',
    AdminPassword: '',
    MaxPlayers: '40',
    PvP: 'true',
    GameMode: 'survival', // survival, hardcore, roleplay
    ServerRegion: 'global',
    ClanMaxSize: '10',
    BuildingHealthMultiplier: '1.0',
    PlayerKillsToBecomePK: '5',
    EnableAntiCheat: 'true',
    EnableFairplay: 'true',
    DisableRaidProtection: 'false',
    RaidProtectionHours: '24',
    ServerLanguage: 'en'
  }
};