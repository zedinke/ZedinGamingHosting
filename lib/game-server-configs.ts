/**
 * Game szerver telepítési konfigurációk
 * 
 * MEGJEGYZÉS: Ez a fájl most már csak az új struktúrát összegyűjti.
 * A játékok konfigurációi és telepítői külön fájlokban vannak:
 * - lib/games/configs/{game-name}.ts
 * - lib/games/installers/{game-name}.ts
 * 
 * Lásd: lib/games/README.md
 */

import { GameType } from '@prisma/client';
import { GameServerConfig, GameConfigMap } from './games/types';
import { GAME_CONFIGS } from './games/configs';
import { GAME_INSTALLERS } from './games/installers';
import { EXTENDED_GAME_SERVER_CONFIGS } from './game-server-configs-extended';

// Exportáljuk a típusokat
export type { GameServerConfig } from './games/types';

/**
 * Összegyűjti az összes konfigurációt és telepítőt
 */
function combineConfigsAndInstallers(): GameConfigMap {
  const combined: GameConfigMap = {};
  
  // Végigjárjuk az összes konfigurációt
  for (const [gameType, config] of Object.entries(GAME_CONFIGS)) {
    const installer = GAME_INSTALLERS[gameType as GameType];
    
    // Kombináljuk a konfigurációt a telepítővel
    combined[gameType as GameType] = {
      ...config,
      installScript: installer || config.installScript || '',
    };
  }
  
  return combined;
}

// Összevonjuk az új struktúrából származó konfigurációkat
export const GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = combineConfigsAndInstallers();

// Összevonjuk a két konfigurációt (új struktúra + kiterjesztett)
export const ALL_GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = {
  ...GAME_SERVER_CONFIGS,
  ...EXTENDED_GAME_SERVER_CONFIGS,
};
