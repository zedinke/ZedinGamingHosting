/**
 * Game Template Definitions
 * Támogatott játékok template konfigurációja
 */

import { GameTemplate, GameTemplateType } from '../types';

/**
 * ARK Survival Ascended Template
 * Docker image: arkmanaged/ark-ascended (vagy saját build)
 */
export const ARK_ASCENDED_TEMPLATE: GameTemplate = {
  id: GameTemplateType.ARK_ASCENDED,
  name: 'ARK Survival Ascended',
  version: '1.0',
  description: 'ARK Survival Ascended dedikált szerver (UE5, modern mechanika)',
  dockerImage: 'ark-ascended:latest', // Saját image, később build-eljük
  
  ports: {
    game: 7777,
    query: 27015,
    rcon: 27020,
  },
  
  requirements: {
    cpuCores: 4,
    ramGb: 16,
    diskGb: 100,
  },
  
  gdrive: {
    fileId: '', // Majd feltöltéskor kitöltjük
    fileName: 'ark-ascended-template-v1.0.tar.gz',
    sizeGb: 60,
  },
  
  updatedAt: new Date(),
  
  metadata: {
    steamAppId: 2430930, // ARK Ascended App ID
    maxPlayers: 70,
    engine: 'UE5',
  },
};

/**
 * ARK Survival Evolved Template
 * Docker image: arkmanaged/ark-evolved (vagy saját build)
 */
export const ARK_EVOLVED_TEMPLATE: GameTemplate = {
  id: GameTemplateType.ARK_EVOLVED,
  name: 'ARK Survival Evolved',
  version: '1.0',
  description: 'ARK Survival Evolved dedikált szerver (Legacy, classic mechanika)',
  dockerImage: 'ark-evolved:latest', // Saját image
  
  ports: {
    game: 7778,
    query: 27016,
    rcon: 27021,
  },
  
  requirements: {
    cpuCores: 4,
    ramGb: 14,
    diskGb: 80,
  },
  
  gdrive: {
    fileId: '',
    fileName: 'ark-evolved-template-v1.0.tar.gz',
    sizeGb: 50,
  },
  
  updatedAt: new Date(),
  
  metadata: {
    steamAppId: 376030, // ARK Evolved App ID
    maxPlayers: 70,
    engine: 'UE4',
  },
};

/**
 * Rust Template
 * Docker image: rust-dedicated (vagy saját build)
 */
export const RUST_TEMPLATE: GameTemplate = {
  id: GameTemplateType.RUST,
  name: 'Rust',
  version: '1.0',
  description: 'Rust dedikált szerver (multiplayer survival)',
  dockerImage: 'rust:latest', // Saját image
  
  ports: {
    game: 28015,
    query: 28016,
    rcon: 28017,
  },
  
  requirements: {
    cpuCores: 4,
    ramGb: 8,
    diskGb: 40,
  },
  
  gdrive: {
    fileId: '',
    fileName: 'rust-template-v1.0.tar.gz',
    sizeGb: 25,
  },
  
  updatedAt: new Date(),
  
  metadata: {
    steamAppId: 258550, // Rust App ID
    maxPlayers: 500,
    engine: 'Unity',
  },
};

/**
 * 7 Days to Die Template
 * Docker image: 7days2die:latest
 */
export const SEVEN_DAYS_TO_DIE_TEMPLATE: GameTemplate = {
  id: GameTemplateType.SEVEN_DAYS_TO_DIE,
  name: '7 Days to Die',
  version: '1.0',
  description: '7 Days to Die dedikált szerver (zombie survival)',
  dockerImage: '7days2die:latest',
  
  ports: {
    game: 26900,
    telnet: 8081,
    webMap: 8080,
  },
  
  requirements: {
    cpuCores: 4,
    ramGb: 8,
    diskGb: 30,
  },
  
  gdrive: {
    fileId: '', // Majd feltöltéskor kitöltjük
    fileName: '7days2die-template-v1.0.tar.gz',
    sizeGb: 20,
  },
  
  updatedAt: new Date(),
  
  metadata: {
    steamAppId: 251570, // 7 Days to Die App ID
    maxPlayers: 32,
    engine: 'Unity',
  },
};

/**
 * Összes elérhető template
 */
export const ALL_TEMPLATES: Record<GameTemplateType, GameTemplate> = {
  [GameTemplateType.ARK_ASCENDED]: ARK_ASCENDED_TEMPLATE,
  [GameTemplateType.ARK_EVOLVED]: ARK_EVOLVED_TEMPLATE,
  [GameTemplateType.RUST]: RUST_TEMPLATE,
  [GameTemplateType.SEVEN_DAYS_TO_DIE]: SEVEN_DAYS_TO_DIE_TEMPLATE,
};

/**
 * Template getter
 */
export function getTemplate(id: GameTemplateType): GameTemplate {
  const template = ALL_TEMPLATES[id];
  if (!template) {
    throw new Error(`Template nem található: ${id}`);
  }
  return template;
}

/**
 * Összes template listázása
 */
export function getAllTemplates(): GameTemplate[] {
  return Object.values(ALL_TEMPLATES);
}
