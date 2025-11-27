/**
 * DayZ konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/dayz';

export const config: GameServerConfig = {
  steamAppId: 221100,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/config/serverDZ.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 2302,
  queryPort: 2303,
  defaultSettings: {
    ServerName: 'DayZ Server',
    ServerPassword: '',
    MaxPlayers: 60,
    BattlEye: 1, // Anti-cheat: 1=enabled, 0=disabled
    Persistent: 1, // Mentett világ
    TimeStampFormat: 'dd.MM.yyyy HH:mm:ss',
    LogAverageFPS: 1,
    LogMemory: 1,
    LogAdminActions: 1,
    DisablePwnVerifySteam: 0,
    ServerTimeAcceleration: 1, // napidő sebessége
    ServerNightTimeAcceleration: 1,
    Whitelist: 0, // whitelist engedélyezése
    RequiredAdmin: '', // admin Steam64ID
    AdminLogSize: 250,
    EnableCfgImportExport: 0,
    PersistentPlayerPositions: 1
  }
};