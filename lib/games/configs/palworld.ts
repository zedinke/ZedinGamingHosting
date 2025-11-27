/**
 * Palworld konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/palworld';

export const config: GameServerConfig = {
  steamAppId: 1623730,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/Pal/Saved/Config/LinuxServer/GameUserSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 8211,
  queryPort: 8212,
  defaultSettings: {
    ServerName: 'Palworld Server',
    ServerPassword: '',
    AdminPassword: '',
    MaxPlayers: '32',
    ServerDescription: 'Palworld Dedicated Server',
    Difficulty: 'None', // None, Normal, Hard
    DayTimeSpeedRate: '1.0',
    NightTimeSpeedRate: '1.0',
    ExpRate: '1.0',
    PalCaptureRate: '1.0',
    PalSpawnNumRate: '1.0',
    PalDamageRateAttack: '1.0',
    PalDamageRateDefense: '1.0',
    PlayerDamageRateAttack: '1.0',
    PlayerDamageRateDefense: '1.0',
    PlayerStomachDecreaceRate: '1.0',
    PlayerStaminaDecreaceRate: '1.0',
    PlayerAutoHPRegeneRate: '1.0',
    PlayerAutoHPRegeneRateInSleep: '1.0',
    PalStomachDecreaceRate: '1.0',
    PalStaminaDecreaceRate: '1.0',
    PalAutoHPRegeneRate: '1.0',
    PalAutoHPRegeneRateInSleep: '1.0',
    BuildObjectDamageRate: '1.0',
    BuildObjectDeteriorationDamageRate: '1.0',
    CollectionDropRate: '1.0',
    CollectionObjectHardnessDamageRate: '1.0',
    DeathPenalty: 'All', // None, Item, All
    EnablePlayerToPlayerDamage: 'false',
    EnableFriendlyFire: 'false',
    EnableNonLoginPenalty: 'true',
    EnableInvaderEnemy: 'true',
    ActiveUNKO: 'false',
    EnableAimAssistTarget: 'false',
    DropTradeItemMaxNum: '10',
    DropItemMaxNum: '100',
    DropItemMaxNum_UNKO: '100',
    BaseCampMaxNum: '128',
    BaseCampWorkerMaxNum: '20',
    DropItemAliveMaxHours: '1.0',
    AutoResetGuildNoOnlinePlayers: 'false',
    AutoResetGuildTimeNoOnlinePlayers: '72',
    WorkerMaxExcitementDefault: '100', // 0-100
  }
};
