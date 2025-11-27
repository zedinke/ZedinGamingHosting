/**
 * Enshrouded konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/enshrouded';

export const config: GameServerConfig = {
  steamAppId: 2915120,
  requiresSteamCMD: false, // Epic Games kiadás
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/Enshrouded/Saved/Config/LinuxServer/GameUserSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 15636,
  queryPort: 15637,
  defaultSettings: {
    ServerName: 'Enshrouded Server',
    ServerPassword: '',
    MaxPlayers: '16',
    WorldSeed: Math.floor(Math.random() * 1000000).toString(),
    GameDifficulty: 'Normal', // Easy, Normal, Hard
    PvP: 'false',
    StartingArea: 'Standard', // Standard, Advanced
    StartingEquipment: 'Basic', // None, Basic, Advanced
    ResourceRespawnRate: '1.0',
    EnemyDensity: '1.0',
    ServerDescription: 'Enshrouded Dedicated Server',
    WorldSize: 'Medium', // Small, Medium, Large
    ServerLanguage: 'en',
    EnableAntiCheat: 'true',
    EnableCheats: 'false',
    EnableMapMarkers: 'true',
    EnableTradeSystem: 'true',
    EnableQuestSystem: 'true',
    StartingSkillPoints: '10', // Kezdő képességpontok
    SkillPointsPerLevel: '1', // Szintenként kapott képességpontok
    InitialPlayerLevel: '1',
  }
};