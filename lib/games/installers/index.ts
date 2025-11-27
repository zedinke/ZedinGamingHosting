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
  // TODO: További játékok hozzáadása...
  // Lásd: lib/games/README.md a teljes listáért
};

