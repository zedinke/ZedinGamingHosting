/**
 * Összes játék telepítő scriptjének index fájlja
 * Automatikusan összegyűjti az összes telepítőt
 */

import { GameType } from '@prisma/client';

// Importáljuk az összes telepítőt
import { installScript as arkEvolvedInstaller } from './ark-evolved';
import { installScript as arkAscendedInstaller } from './ark-ascended';
import { installScript as minecraftInstaller } from './minecraft';
import { installScript as satisfactoryInstaller } from './satisfactory';
import { installScript as rustInstaller } from './rust';
import { installScript as valheimInstaller } from './valheim';
import { installScript as palworldInstaller } from './palworld';
import { installScript as theForestInstaller } from './the-forest';
import { installScript as sevenDaysInstaller } from './seven-days-to-die';
import { installScript as conanExilesInstaller } from './conan-exiles';
import { installScript as dayzInstaller } from './dayz';
import { installScript as projectZomboidInstaller } from './project-zomboid';
import { installScript as enshroudedInstaller } from './enshrouded';
import { installScript as sonsOfTheForestInstaller } from './sons-of-the-forest';
import { installScript as groundedInstaller } from './grounded';
import { installScript as vRisingInstaller } from './v-rising';
import { installScript as dontStarveTogetherInstaller } from './dont-starve-together';
import { installScript as cs2Installer } from './cs2';

// TODO: További játékok importálása...
// Játékok listája: lib/games/README.md

export const GAME_INSTALLERS: Partial<Record<GameType, string>> = {
  ARK_EVOLVED: arkEvolvedInstaller,
  ARK_ASCENDED: arkAscendedInstaller,
  MINECRAFT: minecraftInstaller,
  SATISFACTORY: satisfactoryInstaller,
  RUST: rustInstaller,
  VALHEIM: valheimInstaller,
  PALWORLD: palworldInstaller,
  THE_FOREST: theForestInstaller,
  SEVEN_DAYS_TO_DIE: sevenDaysInstaller,
  CONAN_EXILES: conanExilesInstaller,
  DAYZ: dayzInstaller,
  PROJECT_ZOMBOID: projectZomboidInstaller,
  ENSHROUDED: enshroudedInstaller,
  SONS_OF_THE_FOREST: sonsOfTheForestInstaller,
  GROUNDED: groundedInstaller,
  V_RISING: vRisingInstaller,
  DONT_STARVE_TOGETHER: dontStarveTogetherInstaller,
  CS2: cs2Installer,
  // TODO: További játékok hozzáadása...
  // Lásd: lib/games/README.md a teljes listáért
};

