# Hogyan működik az új moduláris játék struktúra?

## Áttekintés

Az új moduláris struktúra lehetővé teszi, hogy minden játék konfigurációja és telepítője külön fájlokban legyen, így könnyebb karbantartani és bővíteni a rendszert.

## Fájlstruktúra

```
lib/games/
├── types.ts              # Típusdefiníciók (GameServerConfig, GameInstallerScript)
├── configs/              # Játék konfigurációk
│   ├── index.ts         # Összes konfiguráció exportálása
│   ├── satisfactory.ts  # Satisfactory konfiguráció
│   ├── minecraft.ts     # Minecraft konfiguráció
│   └── ...
├── installers/           # Telepítő scriptek
│   ├── index.ts         # Összes telepítő exportálása
│   ├── satisfactory.ts  # Satisfactory telepítő
│   ├── minecraft.ts     # Minecraft telepítő
│   └── ...
└── utils.ts             # Utility függvények (getAvailableGameTypes, getGameTypeLabel)
```

## Hogyan működik a kombinálás?

### 1. Konfigurációk és telepítők összegyűjtése

A `lib/game-server-configs.ts` fájl összegyűjti az összes konfigurációt és telepítőt:

```typescript
// lib/game-server-configs.ts
import { GAME_CONFIGS } from './games/configs';
import { GAME_INSTALLERS } from './games/installers';

function combineConfigsAndInstallers(): GameConfigMap {
  const combined: GameConfigMap = {};
  
  for (const [gameType, config] of Object.entries(GAME_CONFIGS)) {
    const installer = GAME_INSTALLERS[gameType as GameType];
    
    combined[gameType as GameType] = {
      ...config,
      installScript: installer || config.installScript || '',
    };
  }
  
  return combined;
}

export const ALL_GAME_SERVER_CONFIGS = combineConfigsAndInstallers();
```

### 2. Telepítés folyamata

A `lib/game-server-installer.ts` használja az `ALL_GAME_SERVER_CONFIGS`-t:

1. **Konfiguráció lekérése**: `const gameConfig = ALL_GAME_SERVER_CONFIGS[gameType];`
2. **Telepítő script használata**: `let installScript = gameConfig.installScript;`
3. **Script futtatása**: SSH-n keresztül a szervergépen
4. **Systemd service létrehozása**: `createSystemdServiceForServer()` használja a `startCommand`-ot

### 3. Indítás folyamata

A szerver indítása a systemd service-en keresztül történik:

1. **Systemd service fájl létrehozása**: `createSystemdServiceForServer()` függvény
2. **Start command használata**: `gameConfig.startCommand` vagy `gameConfig.startCommandWindows`
3. **Service aktiválása**: `systemctl enable` és `systemctl start`

## Admin és User oldal

### Admin oldal

- **Telepítés**: `/api/admin/servers/[id]/install` → `installGameServer()`
- **Indítás**: `/api/admin/servers/[id]/start` → Task létrehozása → Agent végrehajtja
- **Leállítás**: `/api/admin/servers/[id]/stop` → Task létrehozása → Agent végrehajtja

### User oldal

- **Telepítés**: Automatikus, amikor a szerver létrejön
- **Indítás**: `/api/servers/[id]/start` → Task létrehozása → Agent végrehajtja
- **Leállítás**: `/api/servers/[id]/stop` → Task létrehozása → Agent végrehajtja

## Új játék hozzáadása

### 1. Konfiguráció létrehozása

Hozz létre egy fájlt: `lib/games/configs/new-game.ts`

```typescript
import { GameServerConfig } from '../types';

export const config: GameServerConfig = {
  steamAppId: 123456,
  requiresSteamCMD: true,
  installScript: '', // Telepítő külön fájlban
  configPath: '/opt/servers/{serverId}/config.ini',
  startCommand: 'cd game && ./server',
  stopCommand: 'quit',
  port: 25565,
  queryPort: 25566,
};
```

### 2. Telepítő létrehozása

Hozz létre egy fájlt: `lib/games/installers/new-game.ts`

```typescript
export const installScript = `
#!/bin/bash
set +e
SERVER_DIR="/opt/servers/{serverId}"

# Telepítési logika...
`;
```

### 3. Index fájlok frissítése

**lib/games/configs/index.ts:**
```typescript
import { config as newGameConfig } from './new-game';

export const GAME_CONFIGS: GameConfigMap = {
  // ... meglévő játékok
  NEW_GAME: newGameConfig,
};
```

**lib/games/installers/index.ts:**
```typescript
import { installScript as newGameInstaller } from './new-game';

export const GAME_INSTALLERS: Partial<Record<GameType, string>> = {
  // ... meglévő játékok
  NEW_GAME: newGameInstaller,
};
```

### 4. Prisma schema frissítése

Add hozzá a `GameType` enum-hoz: `prisma/schema.prisma`

```prisma
enum GameType {
  // ... meglévő játékok
  NEW_GAME
}
```

Futtasd: `npm run db:push`

### 5. Automatikus megjelenés

- ✅ **CMS játékcsomag hozzáadása**: Automatikusan megjelenik a dropdown-ban
- ✅ **Telepítés**: Automatikusan működik, amikor szerver létrejön
- ✅ **Indítás/Leállítás**: Automatikusan működik az admin és user oldalon is

## Ellenőrzés

### Telepítés működik-e?

1. Új szerver létrehozása → Automatikusan települ
2. Ellenőrizd a logokat: `logs/install/server-{id}.log`
3. Ellenőrizd a progress fájlt: `logs/install/server-{id}.progress.json`

### Indítás működik-e?

1. Szerver indítása (admin/user oldal) → Task létrehozása
2. Agent végrehajtja a taskot → Systemd service indítása
3. Ellenőrizd: `systemctl status game-server-{id}`

### CMS-ben megjelenik-e?

1. Admin → CMS → Játékcsomagok → Új csomag
2. A játék automatikusan megjelenik a dropdown-ban
3. Csomag létrehozása után a szerver telepítése és indítása működik

## Hibaelhárítás

### Játék nem jelenik meg a CMS-ben

- Ellenőrizd, hogy a konfiguráció és telepítő be van-e importálva az index fájlokba
- Ellenőrizd, hogy a `GAME_CONFIGS` és `GAME_INSTALLERS` tartalmazza-e a játékot
- Frissítsd az oldalt (hard refresh: Ctrl+Shift+R)

### Telepítés nem működik

- Ellenőrizd, hogy a `installScript` helyesen van-e beállítva
- Ellenőrizd a log fájlokat: `logs/install/server-{id}.log`
- Ellenőrizd, hogy a Steam App ID helyes-e (ha SteamCMD-t használ)

### Indítás nem működik

- Ellenőrizd, hogy a `startCommand` helyesen van-e beállítva
- Ellenőrizd a systemd service fájlt: `/etc/systemd/system/game-server-{id}.service`
- Ellenőrizd a systemd logokat: `journalctl -u game-server-{id}`

