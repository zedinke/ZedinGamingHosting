# Moduláris Game Installer Refactoring - Migration Guide

## 📋 Áttekintés

A régi monolithic game-server-installer.ts (2277 sor) helyett létrehoztunk egy moduláris, game-specifikus installer rendszert.

## 🏗️ Új Struktúra

```
lib/installers/
├── index.ts                          # Public API export
├── GameInstallerFactory.ts           # Installer factory (per-game)
├── games/
│   ├── ArkAscendedInstaller.ts       # ~150 sor, tiszta, olvasható
│   ├── ArkEvolvedInstaller.ts        # TODO
│   ├── MinecraftInstaller.ts         # TODO
│   ├── RustInstaller.ts              # TODO
│   └── ...moreGames
├── utils/
│   ├── BaseGameInstaller.ts          # Abstract base class
│   ├── DebugLogger.ts                # Strukturált logging
│   └── PortManager.ts                # Centralizált port allokáció
└── configs/
    └── (per-game config YAMLs később)
```

## 🔑 Kulcs Komponensek

### 1. **BaseGameInstaller** - Abstract Base Class
Minden game installer ezt implementálja. Interface kötelezi az implementációt:

```typescript
abstract class BaseGameInstaller {
  abstract validateConfig(config: InstallConfig): Promise<...>
  abstract allocatePorts(basePort: number): Promise<PortAllocation>
  abstract buildDockerCompose(config, ports): string
  abstract preInstall(config): Promise<void>
  abstract postInstall(config, containerId): Promise<void>
  abstract startServer(config): Promise<...>
  abstract stopServer(config): Promise<...>
  abstract healthCheck(config, ports): Promise<boolean>
  
  // Template method pattern
  async install(config): Promise<InstallResult> { ... }
}
```

**Előny**: Konzisztens flow minden játékhoz, könnyen kiterjeszthető.

### 2. **PortManager** - Centralizált Port Management
Már nem kell game-type-onként 50+ sor port logika:

```typescript
// OLD (1350 soron belül szét van szórva)
if (gameType === 'ARK_ASCENDED') {
  // 6 port + retry loop + collision checking
} else if (gameType === 'RUST') {
  // 3 port + eltérő logika
}

// NEW - egyetlen hely
const ports = portManager.allocate('ARK_ASCENDED', 27015);
// → { port: 27015, queryPort: 27016, beaconPort: 27018, ... }
```

**Előny**: 
- Game-type config egy helyen (PortManager.ts)
- Könnyen új játék: 1 sor hozzáadás
- Testable, reusable

### 3. **DebugLogger** - Strukturált Logging
Minden installer átlátható logging:

```typescript
logger.info('📦 ARK telepítés indítása', { ...data })
logger.debug('1️⃣ Konfigurációs validáció')
logger.trace('Generated Docker Compose:', { dockerCompose })
logger.error('❌ Telepítés hiba', error, { context })
```

**Előny**:
- Könnyű debug (trace, debug, info, warn, error)
- Strukturált data object-tel
- Historya megvan, exportálható
- Installation log teljes feljegyzése

### 4. **GameInstallerFactory** - Factory Pattern
Egyszerű factory az installer szelektálásához:

```typescript
const installer = gameInstallerFactory.create('ARK_ASCENDED', machineId);
const result = await installer.install(config);
```

**Előny**:
- Új játék hozzáadás: Factory-ba 2 sor
- Szerializálható (isSupported, getSupportedGameTypes)
- Fallback logika (ha nincs installer → error vagy fallback)

---

## 📝 Migrációs Lépések

### Lépés 1: Az új modult már létrehoztuk
✅ `lib/installers/` teljes struktúra

### Lépés 2: Webhook/API integration (NEXT)
- `app/api/webhooks/stripe/route.ts` → triggerAutoInstallOnPayment-NEW
- `app/api/admin/servers/[id]/install/route.ts` → új factory-t használjon

### Lépés 3: Régi fájlok lezárása
- `game-server-installer.ts` → archive (legacy)
- `server-provisioning.ts` → archive (legacy)
- `agent-provisioning.ts` → archive (legacy)

### Lépés 4: Tesztelés
1. Új ARK narudzbá → check logs
2. Port allokáció → check
3. Docker container → check
4. Health check → check

---

## 🎮 Új Game Installer Hozzáadása

Ha új játék támogatást akarunk adni:

### 1. Installer Osztály Létrehozása
```typescript
// lib/installers/games/MyGameInstaller.ts
import { BaseGameInstaller, InstallConfig, PortAllocation } from '../utils/BaseGameInstaller';

export class MyGameInstaller extends BaseGameInstaller {
  async validateConfig(config): Promise<...> {
    // Game-specific validation
  }
  
  async allocatePorts(basePort): Promise<PortAllocation> {
    // Game-specific ports
  }
  
  buildDockerCompose(config, ports): string {
    // Docker Compose template
  }
  
  // ... többi method
}
```

### 2. Factory-ba regisztrálás
```typescript
// lib/installers/GameInstallerFactory.ts
case 'MY_GAME':
  return new MyGameInstaller(machineId);
```

### 3. Port konfig PortManager-ben
```typescript
// lib/installers/utils/PortManager.ts
this.gamePortConfigs.set('MY_GAME', {
  basePortCount: 2,
  portNames: ['port', 'queryPort'],
  description: 'My Game (2 port)',
});
```

**Total: ~150-200 sor per játék**, nem 500+!

---

## 📊 Complexity Csökkentés

| Metrika | Régi | Új | Csökkentés |
|---------|------|-----|-----------|
| Legfőbb fájl | game-server-installer.ts (2277) | Per-game ~150 | **-86%** |
| Port logika szétszórva | 5+ fájl, 500+ sor | PortManager.ts (150) | **-70%** |
| Game-type switch | 15+ case, 1000+ sor | Factory (50) | **-95%** |
| Debugging | Ad-hoc console.log | Strukturált logger | **+∞** |

---

## 🔄 Agent Integration

Az agent daemon (`agent/index.js`) ugyanúgy működik:

1. Poll `/api/agent/tasks` → Task (type: PROVISION)
2. Command feldolgozás:
   ```json
   {
     "action": "provision",
     "gameType": "ARK_ASCENDED",
     "serverId": "...",
     "serverName": "...",
     "port": 27015,
     ...
   }
   ```
3. **NEW**: Factory-val installer + install() call
4. Result mentése Task table-ba

---

## 🐛 Debug Logok

Minden installation teljes logját megkapjuk:

```
[2025-12-06T17:15:00.000Z] [INFO] [provision:abc123] 🚀 Starting provision for ARK_ASCENDED
[2025-12-06T17:15:00.100Z] [DEBUG] [provision:abc123] 1️⃣ Fetching server
[2025-12-06T17:15:00.200Z] [DEBUG] [Installer:ARK_ASCENDED] Validating ARK Ascended config
[2025-12-06T17:15:00.300Z] [DEBUG] [Installer:ARK_ASCENDED] 2️⃣ Pre-install cleanup
[2025-12-06T17:15:00.500Z] [DEBUG] [Installer:ARK_ASCENDED] 3️⃣ Port allokáció
[2025-12-06T17:15:00.600Z] [INFO] [Installer:ARK_ASCENDED] ✅ Portok allokálva
...
```

### Logok tárolása
- Real-time console output
- Server install_logs táblában
- Exportálható szöveg formátumban

---

## ✅ Tesztelési Checklist

- [ ] Új ARK narudzbá → provisioning starts
- [ ] machineId/agentId helyesen kerül át
- [ ] Installer factory helyesen hoz létre ARK installert
- [ ] Portok allokálódnak (27015, 27016, 27018, ...)
- [ ] Docker container indul (docker-compose up)
- [ ] Health check működik
- [ ] Install logok részletezik minden lépést
- [ ] Server status → ONLINE (sikeres)
- [ ] Felhasználó notification érkezik

---

## 🚀 Next Steps

1. **TODAY**: Tesztelni az új ARK narudzbá-val
2. **WEEK 1**: Minecraft installer + Rust installer
3. **WEEK 2**: Remaining game types (Satisfactory, Valheim, stb.)
4. **WEEK 3**: Legacy kódok kitörlése
5. **WEEK 4**: Performance + reliability monitoring

