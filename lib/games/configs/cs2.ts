/**
 * Counter-Strike 2 konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/cs2';

export const config: GameServerConfig = {
  steamAppId: 730,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/csgo/cfg/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 27015,
  queryPort: 27016,
  defaultSettings: {
    Hostname: 'CS2 Dedicated Server',
    MaxPlayers: '32',
    Tickrate: '64', // 64 vagy 128
    GameMode: 'competitive', // competitive, casual, wingman, etc.
    GameType: 'classic', // classic, arms race, demolition, etc.
    MapGroup: 'mg_active', // mg_active, mg_reserve, mg_wingman, etc.
    StartMap: 'de_dust2', // alapértelmezett térkép
    ServerPassword: '',
    RconPassword: '',
    SvLan: '0', // 0=internet, 1=lan
    Region: '255', // 255: World
    EnableVAC: 'true', // Valve Anti-Cheat
    EnableCommunityServer: 'true',
    ServerRegion: 'EU', // EU, NA, Asia, stb
    Difficulty: 'normal', // easy, normal, hard
    TimeLimit: '15', // percben
    BombTime: '45', // másodpercben
    FreezeTime: '15', // másodpercben
    EnableKnifeRound: 'false',
    TeamBalanceMethod: 'mm', // mm (matchmaking), standard
    AllowNickNames: 'true',
    AllowSkins: 'true',
    AllowGraffitiSpray: 'true',
    AllowVoiceChat: 'true',
    AllowTextChat: 'true',
    WarmupEnabled: 'true',
    WarmupTime: '5',
    ScoreLimit: '16', // verseny módban
    RoundTime: '1.75', // percben
    RestartRoundOnTeamSwitch: 'true',
    BanDuration: 'permanent', // temporary, permanent
    EnableKickAfterMultipleBans: 'true',
    KickAfterBanCount: '3',
    EnableConsoleLogging: 'true',
    EnableFileLogging: 'true',
    LogLevel: 'full', // minimal, normal, full
  }
};

/**
 * Counter-Strike 2 konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  password?: string;
  [key: string]: any;
}): string {
  return `
hostname "${config.name}"
maxplayers ${config.maxPlayers}
sv_lan 0
rcon_password "${config.password || 'changeme'}"
  `.trim();
}