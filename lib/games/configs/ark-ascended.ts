/**
 * ARK: Survival Ascended konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/ark-ascended';

export const config: GameServerConfig = {
  steamAppId: 2430930,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban (ark-ascended.ts)
  configPath: '/opt/servers/{serverId}/ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 7777,
  queryPort: 27015,
};

/**
 * ARK: Survival Ascended konfigurációs fájl generálása
 * KRITIKUS: A wine megadandó sablonban !
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  adminPassword?: string;
  map?: string;
  clusterId?: string;
  rconPort?: number;
  difficulty?: number;
  [key: string]: any;
}): string {
  // Alapértelmezett térkép: TheIsland_WP
  const map = config.map || 'TheIsland_WP';
  
  // Validálás: térkép végződnie kell "_WP"-vel
  if (!map.includes('_WP')) {
    throw new Error(`HIBA: Érvénytelen térkép: ${map}. Támogatott térképek: TheIsland_WP, ScorchedEarth_WP, Ragnarok_WP stb.`);
  }

  if (config.maxPlayers < 2 || config.maxPlayers > 255) {
    throw new Error(`HIBA: Max játékosok 2-255 között kell legyen, kapott: ${config.maxPlayers}`);
  }

  const adminPassword = config.adminPassword || 'changeme123';
  if (adminPassword.length < 8) {
    console.warn('FIGYELMEZTETÉS: Admin jelszó túl rövid (< 8 karakter)');
  }

  const serverPassword = config.password || '';
  const clusterId = config.clusterId || '';
  const rconPort = config.rconPort || 32330;
  const difficulty = config.difficulty || 4.5;

  return `[/Script/Engine.GameSession]
MaxPlayers=${config.maxPlayers}
SessionName=${config.name}

[/Script/ShooterGame.ShooterGameSession]
Port=${config.port}
QueryPort=${config.queryPort}
RCONPort=${rconPort}

[ServerSettings]
ServerAdminPassword=${adminPassword}
ServerPassword=${serverPassword}
ServerName=${config.name}
Difficulty=${difficulty}
Map=${map}
${clusterId ? `ClusterDirOverride=/mnt/cluster/${clusterId}` : ''}
${clusterId ? `ClusterId=${clusterId}` : ''}

[/Script/ShooterGame.ShooterGameMode]
bEnableLogout=True
EnablePvPGamma=False
AllowRaidDinoFeeding=False
AllowTaming=True
AllowCaveBuildingPvE=False
AllowFlyerCarry=True
AllowMultipleAttachments=True
PlayersOnlyKnockedOutMode=False
AllowCryo=True
AllowHibernation=True
ForceFlyerExplosives=False

[/Script/ShooterGame.ShooterGameUserSettings]
bFirstRun=False
bShowChatbox=True
  `.trim();
}


