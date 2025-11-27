/**
 * Összes játék indító és leállító parancsainak index fájlja
 */

import { GameType } from '@prisma/client';

// Importáljuk az összes commands fájlt
import { commands as arkEvolvedCommands } from './ark-evolved';
import { commands as arkAscendedCommands } from './ark-ascended';
import { commands as minecraftCommands } from './minecraft';
import { commands as satisfactoryCommands } from './satisfactory';
import { commands as rustCommands } from './rust';
import { commands as valheimCommands } from './valheim';
import { commands as palworldCommands } from './palworld';
import { commands as theForestCommands } from './the-forest';

export interface GameCommands {
  startCommand: string;
  startCommandWindows?: string;
  stopCommand: string;
}

export const GAME_COMMANDS: Partial<Record<GameType, GameCommands>> = {
  ARK_EVOLVED: arkEvolvedCommands,
  ARK_ASCENDED: arkAscendedCommands,
  MINECRAFT: minecraftCommands,
  SATISFACTORY: satisfactoryCommands,
  RUST: rustCommands,
  VALHEIM: valheimCommands,
  PALWORLD: palworldCommands,
  THE_FOREST: theForestCommands,
};

