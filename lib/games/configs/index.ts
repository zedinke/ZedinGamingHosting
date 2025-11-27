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
import { config as sevenDaysConfig } from './seven-days-to-die';
import { config as conanExilesConfig } from './conan-exiles';
import { config as dayzConfig } from './dayz';
import { config as projectZomboidConfig } from './project-zomboid';
import { config as enshroudedConfig } from './enshrouded';
import { config as sonsOfTheForestConfig } from './sons-of-the-forest';
import { config as groundedConfig } from './grounded';
import { config as vRisingConfig } from './v-rising';
import { config as dontStarveTogetherConfig } from './dont-starve-together';
import { config as cs2Config } from './cs2';

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
  SEVEN_DAYS_TO_DIE: sevenDaysConfig,
  CONAN_EXILES: conanExilesConfig,
  DAYZ: dayzConfig,
  PROJECT_ZOMBOID: projectZomboidConfig,
  ENSHROUDED: enshroudedConfig,
  SONS_OF_THE_FOREST: sonsOfTheForestConfig,
  GROUNDED: groundedConfig,
  V_RISING: vRisingConfig,
  DONT_STARVE_TOGETHER: dontStarveTogetherConfig,
  CS2: cs2Config,
  // TODO: További játékok hozzáadása...
  // Lásd: lib/games/README.md a teljes listáért
};

