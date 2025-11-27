/**
 * Grounded konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/grounded';

export const config: GameServerConfig = {
  steamAppId: 1422210,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/Grounded/Saved/Config/LinuxServer/GameUserSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
  queryPort: 7778,
  defaultSettings: {
    ServerName: 'Grounded Server',
    ServerPassword: '',
    MaxPlayers: '8',
    Difficulty: 'Normal', // Peaceful, Easy, Normal, Hard
    GameMode: 'Survival', // Survival, Creative, Exploration
    WorldSeed: Math.floor(Math.random() * 1000000).toString(),
    StartingEquipment: 'Normal', // None, Normal, Advanced
    CustomServerMessage: 'Üdvözöl a Grounded szerver!',
    EnablePvP: 'false',
    PvPDamageMultiplier: '1.0',
    EnableAnimalSpawns: 'true',
    AnimalSpawnRate: '1.0',
    EnableInsectSpawns: 'true',
    InsectSpawnRate: '1.0',
    EnableResourceSpawns: 'true',
    ResourceSpawnRate: '1.0',
    EnableHunger: 'true',
    HungerRate: '1.0',
    EnableThirst: 'true',
    ThirstRate: '1.0',
    EnableStaminaSystem: 'true',
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