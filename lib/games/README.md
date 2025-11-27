# Játék Konfigurációk és Telepítők

Ez a mappa tartalmazza az összes játék konfigurációját és telepítő scriptjét, játékonként külön fájlokban.

## Struktúra

```
lib/games/
├── types.ts              # GameServerConfig interface
├── configs/              # Konfigurációs fájlok (játékonként)
│   ├── index.ts          # Összes konfiguráció exportálása
│   ├── ark-evolved.ts
│   ├── minecraft.ts
│   └── ...
└── installers/           # Telepítő scriptek (játékonként)
    ├── index.ts          # Összes telepítő exportálása
    ├── ark-evolved.ts
    ├── minecraft.ts
    └── ...
```

## Fájl létrehozása

### Konfiguráció fájl (configs/{game-name}.ts)

```typescript
/**
 * {Játék neve} konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  steamAppId: 123456, // Opcionális
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/config.cfg',
  startCommand: './server -port {port}',
  stopCommand: 'quit',
  port: 27015,
  queryPort: 27016, // Opcionális
  requiresJava: false, // Opcionális
  requiresWine: false, // Opcionális
  startCommandWindows: '', // Opcionális (Wine-hez)
};
```

### Telepítő fájl (installers/{game-name}.ts)

```typescript
/**
 * {Játék neve} telepítő script
 */

export const installScript = `
#!/bin/bash
set +e
SERVER_DIR="/opt/servers/{serverId}"

# Telepítési lépések...
`;
```

## Játékok listája

A következő játékok fájljait kell létrehozni:

### Fő játékok (game-server-configs.ts)
- [x] ARK_EVOLVED
- [x] ARK_ASCENDED
- [x] MINECRAFT
- [ ] RUST
- [ ] VALHEIM
- [ ] SEVEN_DAYS_TO_DIE
- [ ] CONAN_EXILES
- [ ] DAYZ
- [ ] PROJECT_ZOMBOID
- [ ] PALWORLD
- [ ] ENSHROUDED
- [ ] SONS_OF_THE_FOREST
- [ ] THE_FOREST
- [ ] GROUNDED
- [ ] V_RISING
- [ ] DONT_STARVE_TOGETHER
- [ ] CS2
- [ ] CSGO
- [ ] LEFT_4_DEAD_2
- [ ] KILLING_FLOOR_2
- [ ] INSURGENCY_SANDSTORM
- [ ] SQUAD
- [ ] HELL_LET_LOOSE
- [ ] POST_SCRIPTUM
- [ ] ARMA_3
- [ ] TERRARIA
- [ ] STARBOUND
- [ ] FACTORIO
- [x] SATISFACTORY
- [ ] SPACE_ENGINEERS
- [ ] GARRYS_MOD
- [ ] UNTURNED
- [ ] DOTA_2
- [ ] OTHER

### Kiterjesztett játékok (game-server-configs-extended.ts)
- [ ] TEAM_FORTRESS_2
- [ ] COUNTER_STRIKE_SOURCE
- [ ] DAY_OF_DEFEAT_SOURCE
- [ ] DEAD_BY_DAYLIGHT
- [ ] READY_OR_NOT
- [ ] WAR_THUNDER
- [ ] STARDEW_VALLEY
- [ ] BLACK_MYTH_WUKONG
- [ ] CALL_OF_DUTY_WARZONE
- [ ] APEX_LEGENDS
- [ ] PUBG_BATTLEGROUNDS
- [ ] ELDEN_RING
- [ ] THE_LAST_OF_US
- [ ] HORIZON_ZERO_DAWN
- [ ] GOD_OF_WAR
- [ ] SPIDER_MAN
- [ ] GHOST_OF_TSUSHIMA
- [ ] DEATH_STRANDING
- ... (további játékok)

## Index fájlok frissítése

Miután létrehoztad egy játék fájljait, frissítsd az index fájlokat:

### configs/index.ts
```typescript
import { config as {gameName}Config } from './{game-name}';
// ...
export const GAME_CONFIGS: GameConfigMap = {
  // ...
  {GAME_TYPE}: {gameName}Config,
};
```

### installers/index.ts
```typescript
import { installScript as {gameName}Installer } from './{game-name}';
// ...
export const GAME_INSTALLERS: Partial<Record<GameType, string>> = {
  // ...
  {GAME_TYPE}: {gameName}Installer,
};
```

## Használat

A konfigurációk és telepítők használata:

```typescript
import { GAME_CONFIGS } from '@/lib/games/configs';
import { GAME_INSTALLERS } from '@/lib/games/installers';

const gameConfig = GAME_CONFIGS[gameType];
const installer = GAME_INSTALLERS[gameType];

// A konfigurációban az installScript üres, helyette használd a telepítőt
const fullConfig = {
  ...gameConfig,
  installScript: installer || '',
};
```

