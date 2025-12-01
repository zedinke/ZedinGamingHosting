/**
 * Minecraft konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/minecraft';

export const config: GameServerConfig = {
  requiresSteamCMD: false,
  requiresJava: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server.properties',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 25565,
};

/**
 * Minecraft konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  maxPlayers: number;
  name: string;
  [key: string]: any;
}): string {
  return `
server-port=${config.port}
max-players=${config.maxPlayers}
online-mode=false
white-list=false
motd=${config.name}
difficulty=normal
gamemode=survival
  `.trim();
}

