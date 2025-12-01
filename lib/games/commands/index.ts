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
import { commands as sevenDaysCommands } from './seven-days-to-die';
import { commands as conanExilesCommands } from './conan-exiles';
import { commands as dayzCommands } from './dayz';
import { commands as projectZomboidCommands } from './project-zomboid';
import { commands as enshroudedCommands } from './enshrouded';
import { commands as sonsOfTheForestCommands } from './sons-of-the-forest';
import { commands as groundedCommands } from './grounded';
import { commands as vRisingCommands } from './v-rising';
import { commands as dontStarveTogetherCommands } from './dont-starve-together';
import { commands as cs2Commands } from './cs2';
import { commands as killingFloor2Commands } from './killing-floor-2';
import { commands as terrariaCommands } from './terraria';
import { commands as teamFortress2Commands } from './team-fortress-2';
import { commands as counterStrikeSourceCommands } from './counter-strike-source';
import { commands as dayOfDefeatSourceCommands } from './day-of-defeat-source';
import { commands as deadByDaylightCommands } from './dead-by-daylight';
import { commands as readyOrNotCommands } from './ready-or-not';
import { commands as portal2Commands } from './portal-2';
import { commands as left4DeadCommands } from './left-4-dead';
import { commands as helldivers2Commands } from './helldivers-2';
import { commands as stardewValleyCommands } from './stardew-valley';
import { commands as warThunderCommands } from './war-thunder';
import { commands as blackMythWukongCommands } from './black-myth-wukong';
import { commands as callOfDutyWarzoneCommands } from './call-of-duty-warzone';
import { commands as apexLegendsCommands } from './apex-legends';
import { commands as pubgBattlegroundsCommands } from './pubg-battlegrounds';
import { commands as eldenRingCommands } from './elden-ring';
import { commands as theLastOfUsCommands } from './the-last-of-us';
import { commands as horizonZeroDawnCommands } from './horizon-zero-dawn';
import { commands as godOfWarCommands } from './god-of-war';
import { commands as spiderManCommands } from './spider-man';
import { commands as ghostOfTsushimaCommands } from './ghost-of-tsushima';
import { commands as deathStrandingCommands } from './death-stranding';

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
  SEVEN_DAYS_TO_DIE: sevenDaysCommands,
  CONAN_EXILES: conanExilesCommands,
  DAYZ: dayzCommands,
  PROJECT_ZOMBOID: projectZomboidCommands,
  ENSHROUDED: enshroudedCommands,
  SONS_OF_THE_FOREST: sonsOfTheForestCommands,
  GROUNDED: groundedCommands,
  V_RISING: vRisingCommands,
  DONT_STARVE_TOGETHER: dontStarveTogetherCommands,
  CS2: cs2Commands,
  KILLING_FLOOR_2: killingFloor2Commands,
  TERRARIA: terrariaCommands,
  TEAM_FORTRESS_2: teamFortress2Commands,
  COUNTER_STRIKE_SOURCE: counterStrikeSourceCommands,
  DAY_OF_DEFEAT_SOURCE: dayOfDefeatSourceCommands,
  DEAD_BY_DAYLIGHT: deadByDaylightCommands,
  READY_OR_NOT: readyOrNotCommands,
  PORTAL_2: portal2Commands,
  LEFT_4_DEAD: left4DeadCommands,
  HELLDIVERS_2: helldivers2Commands,
  STARDEW_VALLEY: stardewValleyCommands,
  WAR_THUNDER: warThunderCommands,
  BLACK_MYTH_WUKONG: blackMythWukongCommands,
  CALL_OF_DUTY_WARZONE: callOfDutyWarzoneCommands,
  APEX_LEGENDS: apexLegendsCommands,
  PUBG_BATTLEGROUNDS: pubgBattlegroundsCommands,
  ELDEN_RING: eldenRingCommands,
  THE_LAST_OF_US: theLastOfUsCommands,
  HORIZON_ZERO_DAWN: horizonZeroDawnCommands,
  GOD_OF_WAR: godOfWarCommands,
  SPIDER_MAN: spiderManCommands,
  GHOST_OF_TSUSHIMA: ghostOfTsushimaCommands,
  DEATH_STRANDING: deathStrandingCommands,
  // TODO: További játékok hozzáadása...
};

