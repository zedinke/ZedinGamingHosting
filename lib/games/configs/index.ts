/**
 * Összes játék konfigurációjának index fájlja
 * Automatikusan összegyűjti az összes konfigurációt
 */

import { GameType } from '@prisma/client';
import { GameConfigMap } from '../types';

// Importáljuk az összes konfigurációt
import { config as arkEvolvedConfig, generateConfig as generateArkEvolvedConfig } from './ark-evolved';
import { config as arkAscendedConfig, generateConfig as generateArkAscendedConfig } from './ark-ascended';
import { config as minecraftConfig, generateConfig as generateMinecraftConfig } from './minecraft';
import { config as satisfactoryConfig, generateConfig as generateSatisfactoryConfig } from './satisfactory';
import { config as rustConfig, generateConfig as generateRustConfig } from './rust';
import { config as valheimConfig, generateConfig as generateValheimConfig } from './valheim';
import { config as palworldConfig, generateConfig as generatePalworldConfig } from './palworld';
import { config as theForestConfig, generateConfig as generateTheForestConfig } from './the-forest';
import { config as sevenDaysConfig, generateConfig as generateSevenDaysConfig } from './seven-days-to-die';
import { config as conanExilesConfig } from './conan-exiles';
import { config as dayzConfig } from './dayz';
import { config as projectZomboidConfig } from './project-zomboid';
import { config as enshroudedConfig } from './enshrouded';
import { config as sonsOfTheForestConfig } from './sons-of-the-forest';
import { config as groundedConfig } from './grounded';
import { config as vRisingConfig } from './v-rising';
import { config as dontStarveTogetherConfig } from './dont-starve-together';
import { config as cs2Config, generateConfig as generateCs2Config } from './cs2';
import { config as teamFortress2Config, generateConfig as generateTeamFortress2Config } from './team-fortress-2';
import { config as counterStrikeSourceConfig, generateConfig as generateCounterStrikeSourceConfig } from './counter-strike-source';
import { config as dayOfDefeatSourceConfig, generateConfig as generateDayOfDefeatSourceConfig } from './day-of-defeat-source';
import { config as deadByDaylightConfig, generateConfig as generateDeadByDaylightConfig } from './dead-by-daylight';
import { config as readyOrNotConfig, generateConfig as generateReadyOrNotConfig } from './ready-or-not';
import { config as portal2Config, generateConfig as generatePortal2Config } from './portal-2';
import { config as left4DeadConfig, generateConfig as generateLeft4DeadConfig } from './left-4-dead';
import { config as helldivers2Config, generateConfig as generateHelldivers2Config } from './helldivers-2';
import { config as stardewValleyConfig, generateConfig as generateStardewValleyConfig } from './stardew-valley';
import { config as warThunderConfig, generateConfig as generateWarThunderConfig } from './war-thunder';
import { config as blackMythWukongConfig, generateConfig as generateBlackMythWukongConfig } from './black-myth-wukong';
import { config as callOfDutyWarzoneConfig, generateConfig as generateCallOfDutyWarzoneConfig } from './call-of-duty-warzone';
import { config as codModernWarfare2024Config, generateConfig as generateCodModernWarfare2024Config } from './cod-modern-warfare-2024';
import { config as codWarzone2Config, generateConfig as generateCodWarzone2Config } from './cod-warzone-2';
import { config as codBlackOps6Config, generateConfig as generateCodBlackOps6Config } from './cod-black-ops-6';
import { config as codColdWarConfig, generateConfig as generateCodColdWarConfig } from './cod-cold-war';
import { config as codVanguardConfig, generateConfig as generateCodVanguardConfig } from './cod-vanguard';
import { config as codInfiniteWarfareConfig, generateConfig as generateCodInfiniteWarfareConfig } from './cod-infinite-warfare';
import { config as apexLegendsConfig, generateConfig as generateApexLegendsConfig } from './apex-legends';
import { config as pubgBattlegroundsConfig, generateConfig as generatePubgBattlegroundsConfig } from './pubg-battlegrounds';
import { config as eldenRingConfig, generateConfig as generateEldenRingConfig } from './elden-ring';
import { config as theLastOfUsConfig, generateConfig as generateTheLastOfUsConfig } from './the-last-of-us';
import { config as horizonZeroDawnConfig, generateConfig as generateHorizonZeroDawnConfig } from './horizon-zero-dawn';
import { config as godOfWarConfig, generateConfig as generateGodOfWarConfig } from './god-of-war';
import { config as spiderManConfig, generateConfig as generateSpiderManConfig } from './spider-man';
import { config as ghostOfTsushimaConfig, generateConfig as generateGhostOfTsushimaConfig } from './ghost-of-tsushima';
import { config as deathStrandingConfig, generateConfig as generateDeathStrandingConfig } from './death-stranding';

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
  TEAM_FORTRESS_2: teamFortress2Config,
  COUNTER_STRIKE_SOURCE: counterStrikeSourceConfig,
  DAY_OF_DEFEAT_SOURCE: dayOfDefeatSourceConfig,
  DEAD_BY_DAYLIGHT: deadByDaylightConfig,
  READY_OR_NOT: readyOrNotConfig,
  PORTAL_2: portal2Config,
  LEFT_4_DEAD: left4DeadConfig,
  HELLDIVERS_2: helldivers2Config,
  STARDEW_VALLEY: stardewValleyConfig,
  WAR_THUNDER: warThunderConfig,
  BLACK_MYTH_WUKONG: blackMythWukongConfig,
  CALL_OF_DUTY_WARZONE: callOfDutyWarzoneConfig,
  COD_MODERN_WARFARE_2024: codModernWarfare2024Config,
  COD_WARZONE_2: codWarzone2Config,
  COD_BLACK_OPS_6: codBlackOps6Config,
  COD_COLD_WAR: codColdWarConfig,
  COD_VANGUARD: codVanguardConfig,
  COD_INFINITE_WARFARE: codInfiniteWarfareConfig,
  APEX_LEGENDS: apexLegendsConfig,
  PUBG_BATTLEGROUNDS: pubgBattlegroundsConfig,
  ELDEN_RING: eldenRingConfig,
  THE_LAST_OF_US: theLastOfUsConfig,
  HORIZON_ZERO_DAWN: horizonZeroDawnConfig,
  GOD_OF_WAR: godOfWarConfig,
  SPIDER_MAN: spiderManConfig,
  GHOST_OF_TSUSHIMA: ghostOfTsushimaConfig,
  DEATH_STRANDING: deathStrandingConfig,
  // TODO: További játékok hozzáadása...
  // Lásd: lib/games/README.md a teljes listáért
};

/**
 * Konfigurációs fájl generátorok
 * Minden játéknak van egy generateConfig függvénye, ami a játékspecifikus konfigurációt generálja
 */
export const GAME_CONFIG_GENERATORS: Partial<Record<GameType, (config: any) => string>> = {
  ARK_EVOLVED: generateArkEvolvedConfig,
  ARK_ASCENDED: generateArkAscendedConfig,
  MINECRAFT: generateMinecraftConfig,
  SATISFACTORY: generateSatisfactoryConfig,
  RUST: generateRustConfig,
  VALHEIM: generateValheimConfig,
  PALWORLD: generatePalworldConfig,
  THE_FOREST: generateTheForestConfig,
  SEVEN_DAYS_TO_DIE: generateSevenDaysConfig,
  CS2: generateCs2Config,
  TEAM_FORTRESS_2: generateTeamFortress2Config,
  COUNTER_STRIKE_SOURCE: generateCounterStrikeSourceConfig,
  DAY_OF_DEFEAT_SOURCE: generateDayOfDefeatSourceConfig,
  DEAD_BY_DAYLIGHT: generateDeadByDaylightConfig,
  READY_OR_NOT: generateReadyOrNotConfig,
  PORTAL_2: generatePortal2Config,
  LEFT_4_DEAD: generateLeft4DeadConfig,
  HELLDIVERS_2: generateHelldivers2Config,
  STARDEW_VALLEY: generateStardewValleyConfig,
  WAR_THUNDER: generateWarThunderConfig,
  BLACK_MYTH_WUKONG: generateBlackMythWukongConfig,
  CALL_OF_DUTY_WARZONE: generateCallOfDutyWarzoneConfig,
  COD_MODERN_WARFARE_2024: generateCodModernWarfare2024Config,
  COD_WARZONE_2: generateCodWarzone2Config,
  COD_BLACK_OPS_6: generateCodBlackOps6Config,
  COD_COLD_WAR: generateCodColdWarConfig,
  COD_VANGUARD: generateCodVanguardConfig,
  COD_INFINITE_WARFARE: generateCodInfiniteWarfareConfig,
  APEX_LEGENDS: generateApexLegendsConfig,
  PUBG_BATTLEGROUNDS: generatePubgBattlegroundsConfig,
  ELDEN_RING: generateEldenRingConfig,
  THE_LAST_OF_US: generateTheLastOfUsConfig,
  HORIZON_ZERO_DAWN: generateHorizonZeroDawnConfig,
  GOD_OF_WAR: generateGodOfWarConfig,
  SPIDER_MAN: generateSpiderManConfig,
  GHOST_OF_TSUSHIMA: generateGhostOfTsushimaConfig,
  DEATH_STRANDING: generateDeathStrandingConfig,
  // TODO: További játékok hozzáadása...
};

