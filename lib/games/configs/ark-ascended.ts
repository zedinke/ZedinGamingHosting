/**
 * ARK: Survival Ascended konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/ark-ascended';

export const config: GameServerConfig = {
  steamAppId: 2430930,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
  queryPort: 27015,
};

