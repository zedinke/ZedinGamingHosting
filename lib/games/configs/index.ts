/**
 * Összes játék konfigurációjának index fájlja
 * Automatikusan összegyűjti az összes konfigurációt
 */

import { GameType } from '@prisma/client';
import { GameConfigMap } from '../types';

// Importáljuk az összes konfigurációt
import { config as arkEvolvedConfig } from './ark-evolved';
import { config as arkAscendedConfig } from './ark-ascended';
import { config as minecraftConfig } from './minecraft';
import { config as satisfactoryConfig } from './satisfactory';
import { config as rustConfig } from './rust';
import { config as valheimConfig } from './valheim';
import { config as palworldConfig } from './palworld';
import { config as theForestConfig } from './the-forest';

// TODO: További játékok importálása...
// Játékok listája: lib/games/README.md

export const GAME_CONFIGS: GameConfigMap = {
  ARK_EVOLVED: arkEvolvedConfig,
  ARK_ASCENDED: arkAscendedConfig,
  MINECRAFT: minecraftConfig,
  SATISFACTORY: satisfactoryConfig,
  RUST: rustConfig,
  VALHEIM: valheimConfig,
  PALWORLD: palworldConfig,
  THE_FOREST: theForestConfig,
  // TODO: További játékok hozzáadása...
  // Lásd: lib/games/README.md a teljes listáért
};

