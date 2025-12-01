/**
 * ARK: Survival Evolved konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/ark-evolved';

export const config: GameServerConfig = {
  steamAppId: 376030,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
  queryPort: 27015,
};

/**
 * ARK: Survival Evolved konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  adminPassword?: string;
  map?: string;
  clusterId?: string;
  [key: string]: any;
}): string {
  const map = config.map || 'TheIsland';
  return `
[ServerSettings]
ServerAdminPassword=${config.adminPassword || 'changeme'}
MaxPlayers=${config.maxPlayers}
ServerPassword=${config.password || ''}
ServerName=${config.name}
${config.clusterId ? `ClusterDirOverride=/mnt/ark-cluster/${config.clusterId}` : ''}
${config.clusterId ? `ClusterId=${config.clusterId}` : ''}

[/Script/ShooterGame.ShooterGameMode]
  `.trim();
}

