/**
 * Sons of the Forest konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/sons-of-the-forest';

export const config: GameServerConfig = {
  steamAppId: 1326470,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/ServerConfig.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
  queryPort: 27016,
  supported: false, // ❌ NOT SUPPORTED - Valve hasn't configured this for SteamCMD
  supportReason: 'Sons of the Forest dedicated server is not available via SteamCMD. Requires game ownership and special Valve licensing.',
  defaultSettings: {
    ServerName: 'Sons of the Forest Server',
    ServerPassword: '',
    MaxPlayers: '8',
    Difficulty: 'Normal', // Normal, Hard, Peaceful
    GameMode: 'Survival', // Survival, Creative
    StartingEquipment: 'Normal', // None, Normal, Advanced
    WorldSeed: Math.floor(Math.random() * 1000000).toString(),
    CustomServerMessage: 'Üdvözöl a Sons of the Forest szerver!',
    EnableAnimalSpawns: 'true',
    AnimalSpawnRate: '1.0',
    EnablePvP: 'false',
    PvPDamageMultiplier: '1.0',
    EnableBaseBuilding: 'true',
    BaseBuildingDamageMultiplier: '1.0',
    EnableHunger: 'true',
    HungerRate: '1.0',
    EnableThirst: 'true',
    ThirstRate: '1.0',
    EnableDiseaseSystem: 'true',
    EnableDayNightCycle: 'true',
    DayLength: '24', // órában
    NightLength: '12', // órában
    StartTime: '6', // 0-24 óra között
    DisableSaveSystem: 'false',
    SaveInterval: '300', // másodpercben
    EnableServerLogs: 'true',
    LogLevel: 'Normal', // Low, Normal, High
  }
};