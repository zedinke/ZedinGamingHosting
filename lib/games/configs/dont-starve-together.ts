/**
 * Don't Starve Together konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/dont-starve-together';

export const config: GameServerConfig = {
  steamAppId: 343050,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/DoNotStarveTogether/Cluster1/cluster.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 10999,
  queryPort: 11000,
  defaultSettings: {
    ClusterName: 'Don\'t Starve Together Server',
    ClusterDescription: '',
    ClusterPassword: '',
    ClusterPvP: 'false',
    MaxPlayers: '6',
    GameMode: 'Survival', // Survival, Wilderness, Endless
    Difficulty: 'Normal', // Relaxed, Medium, Hard, Endless
    ShouldAutoStartServer: 'true',
    ServerAdminPassword: '',
    EnableServerChat: 'true',
    EnableVoiceChat: 'true',
    EnableWhispers: 'true',
    Seed: Math.floor(Math.random() * 1000000).toString(),
    StartSeason: 'Autumn',
    SeasonLength: '15', // napok
    EnableWinter: 'true',
    WinterLength: '15',
    EnableSeason: 'true',
    WorldSize: 'Default', // Small, Default, Large
    WorldTerrain: 'Default', // Default, Random, Cave
    ResourceMultiplier: '1.0',
    StartingInventory: 'Default', // None, Default, Advanced
    PlayerSurvivalMultiplier: '1.0',
    HungerMultiplier: '1.0',
    SanitiyMultiplier: '1.0',
    HealthMultiplier: '1.0',
    MonsterSpawnMultiplier: '1.0',
    ChestSpawnMultiplier: '1.0',
    NightCreatureSpawnMultiplier: '1.0',
    EnableMods: 'false',
    ModList: '',
    AllowDisconnectDrops: 'true',
    UseVotingSystem: 'true',
    EnableMigration: 'false',
    EnableRolling: 'true',
    StartingWorldPreset: 'DefaultStart'
  }
};