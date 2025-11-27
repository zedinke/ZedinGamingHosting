/**
 * Satisfactory konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  steamAppId: 1690800,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/FactoryGame/Saved/Config/LinuxServer/GameUserSettings.ini',
  startCommand: 'cd FactoryGame/Binaries/Linux && ./FactoryGameServer -log -unattended',
  stopCommand: 'quit',
  port: 15777,
  queryPort: 7777,
};

