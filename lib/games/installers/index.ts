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
import { installScript as teamFortress2Installer } from './team-fortress-2';
import { installScript as counterStrikeSourceInstaller } from './counter-strike-source';
import { installScript as dayOfDefeatSourceInstaller } from './day-of-defeat-source';
import { installScript as deadByDaylightInstaller } from './dead-by-daylight';
import { installScript as readyOrNotInstaller } from './ready-or-not';
import { installScript as portal2Installer } from './portal-2';
import { installScript as left4DeadInstaller } from './left-4-dead';
import { installScript as helldivers2Installer } from './helldivers-2';
import { installScript as stardewValleyInstaller } from './stardew-valley';
import { installScript as warThunderInstaller } from './war-thunder';
import { installScript as blackMythWukongInstaller } from './black-myth-wukong';
import { installScript as callOfDutyWarzoneInstaller } from './call-of-duty-warzone';
import { installScript as apexLegendsInstaller } from './apex-legends';
import { installScript as pubgBattlegroundsInstaller } from './pubg-battlegrounds';
import { installScript as eldenRingInstaller } from './elden-ring';
import { installScript as theLastOfUsInstaller } from './the-last-of-us';
import { installScript as horizonZeroDawnInstaller } from './horizon-zero-dawn';
import { installScript as godOfWarInstaller } from './god-of-war';
import { installScript as spiderManInstaller } from './spider-man';
import { installScript as ghostOfTsushimaInstaller } from './ghost-of-tsushima';
import { installScript as deathStrandingInstaller } from './death-stranding';

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
  TEAM_FORTRESS_2: teamFortress2Installer,
  COUNTER_STRIKE_SOURCE: counterStrikeSourceInstaller,
  DAY_OF_DEFEAT_SOURCE: dayOfDefeatSourceInstaller,
  DEAD_BY_DAYLIGHT: deadByDaylightInstaller,
  READY_OR_NOT: readyOrNotInstaller,
  PORTAL_2: portal2Installer,
  LEFT_4_DEAD: left4DeadInstaller,
  HELLDIVERS_2: helldivers2Installer,
  STARDEW_VALLEY: stardewValleyInstaller,
  WAR_THUNDER: warThunderInstaller,
  BLACK_MYTH_WUKONG: blackMythWukongInstaller,
  CALL_OF_DUTY_WARZONE: callOfDutyWarzoneInstaller,
  APEX_LEGENDS: apexLegendsInstaller,
  PUBG_BATTLEGROUNDS: pubgBattlegroundsInstaller,
  ELDEN_RING: eldenRingInstaller,
  THE_LAST_OF_US: theLastOfUsInstaller,
  HORIZON_ZERO_DAWN: horizonZeroDawnInstaller,
  GOD_OF_WAR: godOfWarInstaller,
  SPIDER_MAN: spiderManInstaller,
  GHOST_OF_TSUSHIMA: ghostOfTsushimaInstaller,
  DEATH_STRANDING: deathStrandingInstaller,
  // TODO: További játékok hozzáadása...
  // Lásd: lib/games/README.md a teljes listáért
};

