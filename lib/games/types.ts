/**
 * Game szerver konfigurációs típusok
 */

import { GameType } from '@prisma/client';

export interface GameServerConfig {
  steamAppId?: number; // Steam App ID (ha SteamCMD-t használ)
  installScript: string;
  configPath: string;
  startCommand: string;
  startCommandWindows?: string; // Opcionális Windows verzió parancs (ha Wine szükséges)
  stopCommand: string;
  port: number;
  queryPort?: number; // Query port (ha külön van)
  beaconPort?: number; // Beacon port (pl. Satisfactory)
  additionalPorts?: number[]; // További portok, amiket meg kell nyitni
  environmentVariables?: Record<string, string>; // Környezeti változók
  defaultSettings?: Record<string, string>; // Alapértelmezett beállítások
  requiresSteamCMD: boolean;
  requiresJava?: boolean;
  requiresWine?: boolean;
}

export type GameConfigMap = Partial<Record<GameType, GameServerConfig>>;

