/**
 * Játék konfigurációk utility függvények
 */

import { GameType } from '@prisma/client';
import { GAME_CONFIGS } from './configs';

/**
 * Játék típusok címkéinek mapping
 */
const GAME_TYPE_LABELS: Partial<Record<GameType, string>> = {
  ARK_EVOLVED: 'ARK: Survival Evolved',
  ARK_ASCENDED: 'ARK: Survival Ascended',
  MINECRAFT: 'Minecraft',
  RUST: 'Rust',
  VALHEIM: 'Valheim',
  SEVEN_DAYS_TO_DIE: '7 Days to Die',
  CONAN_EXILES: 'Conan Exiles',
  DAYZ: 'DayZ',
  PROJECT_ZOMBOID: 'Project Zomboid',
  PALWORLD: 'Palworld',
  ENSHROUDED: 'Enshrouded',
  SONS_OF_THE_FOREST: 'Sons of the Forest',
  THE_FOREST: 'The Forest',
  GROUNDED: 'Grounded',
  V_RISING: 'V Rising',
  DONT_STARVE_TOGETHER: "Don't Starve Together",
  CS2: 'Counter-Strike 2',
  CSGO: 'Counter-Strike: Global Offensive',
  LEFT_4_DEAD_2: 'Left 4 Dead 2',
  KILLING_FLOOR_2: 'Killing Floor 2',
  INSURGENCY_SANDSTORM: 'Insurgency: Sandstorm',
  SQUAD: 'Squad',
  HELL_LET_LOOSE: 'Hell Let Loose',
  POST_SCRIPTUM: 'Post Scriptum',
  ARMA_3: 'Arma 3',
  TERRARIA: 'Terraria',
  STARBOUND: 'Starbound',
  FACTORIO: 'Factorio',
  SATISFACTORY: 'Satisfactory',
  SPACE_ENGINEERS: 'Space Engineers',
  GARRYS_MOD: "Garry's Mod",
  UNTURNED: 'Unturned',
  DOTA_2: 'Dota 2',
  OTHER: 'Other',
};

/**
 * Játék típus címke lekérése
 */
export function getGameTypeLabel(gameType: GameType): string {
  return GAME_TYPE_LABELS[gameType] || gameType.replace(/_/g, ' ');
}

/**
 * Összes elérhető játék típus lekérése (amelyekhez van konfiguráció)
 */
export function getAvailableGameTypes(): Array<{ value: GameType; label: string }> {
  return Object.keys(GAME_CONFIGS)
    .map((gameType) => ({
      value: gameType as GameType,
      label: getGameTypeLabel(gameType as GameType),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Ellenőrzi, hogy egy játék típushoz van-e konfiguráció
 */
export function hasGameConfig(gameType: GameType): boolean {
  return gameType in GAME_CONFIGS;
}

