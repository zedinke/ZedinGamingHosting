/**
 * Rust konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/rust';

export const config: GameServerConfig = {
  steamAppId: 258550,
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/server/server.cfg',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 28015,
  queryPort: 28016,
};

/**
 * Rust konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  queryPort: number;
  maxPlayers: number;
  name: string;
  adminPassword?: string;
  password?: string;
  seed?: number;
  worldsize?: number;
  saveinterval?: number;
  [key: string]: any;
}): string {
  const rconPort = config.queryPort + 1;
  const rconPassword = config.adminPassword || config.password || 'changeme';
  return `
server.hostname "${config.name}"
server.identity "${config.name}"
server.maxplayers ${config.maxPlayers}
server.port ${config.port}
server.queryport ${config.queryPort}
rcon.port ${rconPort}
rcon.password "${rconPassword}"
server.seed ${config.seed || Math.floor(Math.random() * 1000000)}
server.worldsize ${config.worldsize || 4000}
server.saveinterval ${config.saveinterval || 600}
  `.trim();
}

