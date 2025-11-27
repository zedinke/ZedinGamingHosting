# Migrációs Útmutató - Játék Konfigurációk Szétválasztása

## Áttekintés

A játékok konfigurációit és telepítőit szétválasztottuk külön mappákba:
- `lib/games/configs/` - Konfigurációs fájlok
- `lib/games/installers/` - Telepítő scriptek

## Jelenlegi állapot

### ✅ Létrehozva (8 játék):
- ARK_EVOLVED
- ARK_ASCENDED
- MINECRAFT
- SATISFACTORY
- RUST
- VALHEIM
- PALWORLD
- THE_FOREST

### ⏳ Még létrehozandó (~21 játék a fő fájlból + extended játékok):
- SEVEN_DAYS_TO_DIE
- CONAN_EXILES
- DAYZ
- PROJECT_ZOMBOID
- ENSHROUDED
- SONS_OF_THE_FOREST
- GROUNDED
- V_RISING
- DONT_STARVE_TOGETHER
- CS2
- CSGO
- LEFT_4_DEAD_2
- KILLING_FLOOR_2
- INSURGENCY_SANDSTORM
- SQUAD
- HELL_LET_LOOSE
- POST_SCRIPTUM
- ARMA_3
- TERRARIA
- STARBOUND
- FACTORIO
- SPACE_ENGINEERS
- GARRYS_MOD
- UNTURNED
- DOTA_2
- OTHER
- ... és a kiterjesztett játékok

## Hogyan hozz létre új játék fájlokat?

### 1. Konfiguráció fájl létrehozása

Fájl: `lib/games/configs/{game-name}.ts`

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

### 2. Telepítő fájl létrehozása

Fájl: `lib/games/installers/{game-name}.ts`

```typescript
/**
 * {Játék neve} telepítő script
 */

export const installScript = \`
#!/bin/bash
set +e
SERVER_DIR="/opt/servers/{serverId}"

# Telepítési lépések...
\`;
```

### 3. Index fájlok frissítése

#### `lib/games/configs/index.ts`
```typescript
import { config as {gameName}Config } from './{game-name}';
// ...
export const GAME_CONFIGS: GameConfigMap = {
  // ...
  {GAME_TYPE}: {gameName}Config,
};
```

#### `lib/games/installers/index.ts`
```typescript
import { installScript as {gameName}Installer } from './{game-name}';
// ...
export const GAME_INSTALLERS: Partial<Record<GameType, string>> = {
  // ...
  {GAME_TYPE}: {gameName}Installer,
};
```

## Fájlnév konvenció

A fájlnevek kebab-case formátumban legyenek:
- `ARK_EVOLVED` → `ark-evolved.ts`
- `THE_FOREST` → `the-forest.ts`
- `SEVEN_DAYS_TO_DIE` → `seven-days-to-die.ts`

## Forrás fájlok

A játékok konfigurációi a következő fájlokból származnak:
- `lib/game-server-configs.ts` - Fő játékok (29 játék)
- `lib/game-server-configs-extended.ts` - Kiterjesztett játékok (~17 játék)

## Automatikus generálás

Jelenleg nincs automatikus generáló script, de a `scripts/generate-game-files.js` tartalmaz egy alap struktúrát, amit tovább lehet fejleszteni.

## Tesztelés

Miután létrehoztad egy játék fájljait:
1. Frissítsd az index fájlokat
2. Ellenőrizd, hogy a `lib/game-server-configs.ts` helyesen kombinálja őket
3. Teszteld a telepítést egy teszt szerveren

