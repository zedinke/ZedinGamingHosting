/**
 * V Rising konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/v-rising';

export const config: GameServerConfig = {
  steamAppId: 1604030,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/VRising/Server/serverconfig.json',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
  queryPort: 27016,
  defaultSettings: {
    Name: 'V Rising Server',
    GamePort: '27015',
    Description: '',
    MaxConnectedUsers: '40',
    Password: '',
    Secure: 'true',
    ListOnMasterServer: 'true',
    ClanMaxMembers: '10',
    ClanAllowPvP: 'false',
    ClanAllowAllyInvites: 'true',
    ClanDuelEnabled: 'false',
    ClanEmblemUploadEnabled: 'true',
    GameMode: 'PvE', // PvE, PvP
    Difficulty: 'Normal', // Easy, Normal, Hard, Brutal
    DeathPenalty: 'Normal', // None, Normal, Hard
    TimeScale: '1.0', // napidő sebessége
    BloodDrainMultiplier: '1.0',
    SunDamageMultiplier: '1.0',
    CastleDamageMultiplier: '1.0',
    PlayerDamageMultiplier: '1.0',
    UnitDamageMultiplier: '1.0',
    UnitHealthMultiplier: '1.0',
    ResourceYieldMultiplier: '1.0',
    CraftRateMultiplier: '1.0',
    DeathContainerPermission: 'Anyone', // Anyone, Clan, None
    RelicSpawnType: 'Default', // Default, Random, Fixed
    StartingItems: 'Normal', // None, Basic, Normal, Advanced
    WorldSeed: Math.floor(Math.random() * 1000000).toString(),
    WorldType: 'Standard', // Standard, Large, Huge
    PvPMode: 'Disabled', // Disabled, Full, Simplified
    ServerRegion: 'Global',
    EnableDayNightCycle: 'true',
    EnableDiseaseSystem: 'true',
    EnableEnemyAggression: 'true',
    EnableMods: 'false',
    ModList: '',
  }
};