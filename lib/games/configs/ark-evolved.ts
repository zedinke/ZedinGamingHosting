/**
 * ARK: Survival Evolved konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  steamAppId: 376030,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini',
  startCommand: './ShooterGame/Binaries/Linux/ShooterGameServer TheIsland?listen?Port={port}?QueryPort={queryPort}?ServerAdminPassword={adminPassword}',
  stopCommand: 'quit',
  port: 7777,
  queryPort: 27015,
};

