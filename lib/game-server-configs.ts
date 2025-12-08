/**
 * Game szerver telepítési konfigurációk
 * 
 * Legacy file - A game-configs rendszer ki lett kapcsolva.
 * Használd az új template-alapú deployment-et: lib/provisioning/rust-provisioner.ts
 */

import { GameType } from '@prisma/client';

// Placeholder típus export a kompatibilitáshoz
export type GameServerConfig = {
  name: string;
  displayName: string;
  dockerImage?: string;
  ports: { game: number; query?: number; rcon?: number };
  startCommand?: string;
  installScript?: string;
  requiresSteamCMD?: boolean;
  configPath?: string;
  [key: string]: any; // Allow additional properties for flexibility
};

/**
 * Legacy function - Üres map-et ad vissza
 */
function combineConfigsAndInstallers(): Partial<Record<GameType, GameServerConfig>> {
  const combined: Partial<Record<GameType, GameServerConfig>> = {};
  return combined;
}

// Üres konfigurációk (legacy kompatibilitáshoz)
export const GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = combineConfigsAndInstallers();
export const ALL_GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = GAME_SERVER_CONFIGS;
