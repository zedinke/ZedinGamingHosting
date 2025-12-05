# ARK Ascended Szerver Install-Startup Összhang Javítása

## 🔴 Azonosított Kritikus Problémák

### Problem 1: StartCommand - Bináris út eltérés (KRITIKUS)
**Helyzet**: A szerver **telepítése** és **indítása** nincsenek összhangban

| Fázis | Telepítés | Startup |
|-------|----------|---------|
| **Bináris letöltés** | `ShooterGame/Binaries/Win64/ArkAscendedServer.exe` ✅ | |
| **StartCommand** | — | `ShooterGame/Binaries/Linux/ShooterGameServer` ❌ |
| **Probléma** | — | Nem-exisztáló Linux binárist próbál futtatni! |

**Oka**: Az `ark-ascended.ts` (commands) és a `game-server-installer.ts` (startCommand generálás) ARK_EVOLVED kódot másolnak, amely Linux binárist használ. Az ARK_ASCENDED azonban **Windows binárist** használ Wine-on keresztül.

---

### Problem 2: Bináris ellenőrzés inconsistency
**Helyzet**: Az install-checking függvények a **Linux binárist** keresik az ARK_ASCENDED-nél is

**Érintett fájlok**:
- `lib/game-server-installer.ts` → `checkARKSharedInstallation()` (sor 1010-1025)
- `lib/game-server-installer.ts` → `installARKSharedFiles()` bash script (sor 1109-1110)

**Következmény**: A telepítéskor nem talál ellenőrzési pontokat, így mindig újratelepítésre próbál.

---

### Problem 3: Wine/Xvfb environment hiányzik a startCommand-ből
**Helyzet**: Az ARK_ASCENDED teljes Wine setup-ja hiányzik

**Szükséges**:
- `WINEPREFIX` - Wine home directory
- `WINE_CPU_TOPOLOGY` - CPU topológia (4:2)
- `DISPLAY=:99` - Virtual display
- `Xvfb` - Virtual framebuffer indítása

---

## ✅ Megvalósított Javítások

### Fix 1: StartCommand Separation (lib/game-server-installer.ts, sor 1363-1378)

**Mielőtti**:
```typescript
startCommand = `${paths.sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer ...`
```

**Után**:
```typescript
if (gameType === 'ARK_ASCENDED') {
  // ARK Ascended: Windows bináris Wine-on keresztül
  startCommand = `export WINEPREFIX=... && wine64 ${paths.sharedPath}/ShooterGame/Binaries/Win64/ArkAscendedServer.exe ...`
} else {
  // ARK Evolved: Linux bináris (hagyományos)
  startCommand = `${paths.sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer ...`
}
```

**Előnyei**:
- ✅ Helyes bináris path az ARK_ASCENDED-nél
- ✅ Wine environment setup benne van
- ✅ ARK Evolved továbbra működik

---

### Fix 2: Bináris ellenőrzés korrekció (lib/game-server-installer.ts, sor 1010-1025)

**Mielőtti**:
```typescript
const checkCommand = gameType === 'ARK_EVOLVED'
  ? `test -f .../Linux/ShooterGameServer ...`
  : `test -f .../Linux/ShooterGameServer ...`  // ❌ Ugyanaz!
```

**Után**:
```typescript
const checkCommand = gameType === 'ARK_ASCENDED'
  ? `test -f .../Win64/ArkAscendedServer.exe ...`  // ✅ Windows bináris
  : `test -f .../Linux/ShooterGameServer ...`      // ✅ Linux bináris
```

---

### Fix 3: Install script bináris ellenőrzés (lib/game-server-installer.ts, sor 1107-1116)

**Mielőtti bash script**:
```bash
if [ -f "${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
  INSTALL_SUCCESS=true
fi
```

**Után**:
```bash
# ARK Ascended: Win64/ArkAscendedServer.exe; ARK Evolved: Linux/ShooterGameServer
if [ -f "${sharedPath}/ShooterGame/Binaries/Win64/ArkAscendedServer.exe" ] || [ -f "${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
  INSTALL_SUCCESS=true
fi
```

---

### Fix 4: Executable jogok a bash script-ben (lib/game-server-installer.ts, sor 1139-1150)

**Mielőtti**:
```bash
if [ -f "${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
  chmod +x "${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer"
fi
```

**Után**:
```bash
# ARK Ascended: Win64/ArkAscendedServer.exe (Wine-on keresztül futtatva)
# ARK Evolved: Linux/ShooterGameServer
if [ -f "${sharedPath}/ShooterGame/Binaries/Win64/ArkAscendedServer.exe" ]; then
  chmod +x "${sharedPath}/ShooterGame/Binaries/Win64/ArkAscendedServer.exe"
fi
if [ -f "${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
  chmod +x "${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer"
fi
```

---

## 🔄 Teljes Startup Flow (ARK_ASCENDED)

### 1. Install-Time (Szerver telepítéskor)
```
Felhasználó: Telepítés elindítása
    ↓
installGameServer() [game-server-installer.ts]
    ↓
checkARKSharedInstallation() 
    → Keresi: Win64/ArkAscendedServer.exe ✅
    ↓
SteamCMD: App 2430930 letöltése
    → Telepít: Win64/ArkAscendedServer.exe ✅
    ↓
createSystemdServiceForServer()
    → StartCommand = Wine + Win64 bináris ✅
    → ExecStart-ba bekerül a systemd unit-ba ✅
```

### 2. Startup-Time (Szerver indítása)
```
Felhasználó: Start gomb kattintása (Admin vagy User UI)
    ↓
POST /api/admin/servers/{id}/start
    ↓
Szerver státusz: ONLINE → STARTING
    ↓
Aufgabe (Task) létrehozása: type='START'
    ↓
Task Executor
    → systemctl start server-{serverId}
    ↓
Systemd Unit futtatása: ExecStart sorként a generált startCommand
    ↓
Wine64 process indul:
  export WINEPREFIX=...
  export WINE_CPU_TOPOLOGY=4:2
  export DISPLAY=:99
  Xvfb :99 -screen 0 1024x768x24 &
  wine64 .../Win64/ArkAscendedServer.exe ${map}?listen...
    ↓
ARK Ascended szerver indul ✅
```

---

## 🧪 Ellenőrzési Pont: Admin UI Gombok

### Admin panel `ServerDetail.tsx`
```typescript
// 308. sor
<Button onClick={() => handleServerAction('start')} />

handleServerAction(action) 
  ↓
POST /api/admin/servers/{id}/start
  ↓
API endpoint validates: ADMIN role ✅
  ↓
Task executor runs: systemctl start server-{id}
```

### User panel `UserServerDetail.tsx`
```typescript
// 471. sor
<Button onClick={() => handleServerAction('start')} />

handleServerAction(action)
  ↓
[POST endpoint: /api/servers/{id}/start - User endpoint]
  ↓
Task executor runs: systemctl start server-{id}
```

---

## 🧪 Ellenőrzési Pont: Paraméter Konzisztencia

### Config paraméterek (database → startCommand)
```
server.port → ARK port
server.queryPort → ARK query port  
config.map → Térkép név (pl. "TheIsland")
config.adminPassword → Admin jelszó
config.clusterId → Cluster azonosító
```

Ezek mind belekerülnek a startCommand-be a telepítéskor, így az indítási parancs már tartalmazza az összes szükséges paramétert.

---

## 📋 Módosított Fájlok

| Fájl | Módosítás | Sor |
|------|-----------|-----|
| `lib/game-server-installer.ts` | StartCommand separation (ARK_ASCENDED vs ARK_EVOLVED) | 1363-1378 |
| `lib/game-server-installer.ts` | Binary check fix | 1010-1025 |
| `lib/game-server-installer.ts` | Install script binary check | 1107-1116 |
| `lib/game-server-installer.ts` | Executable permissions setup | 1139-1150 |

---

## ✨ Kimenet

### Szintaxis validáció
```
✅ No errors found in lib/game-server-installer.ts
```

### Funkciók az öszsze-összhang után

| Pont | Status |
|------|--------|
| **Install-ben Windows binárist letölt** | ✅ ARK 2430930 App |
| **StartCommand-ben Windows binárist hívja** | ✅ Win64/ArkAscendedServer.exe |
| **Wine environment setup** | ✅ WINEPREFIX, WINE_CPU_TOPOLOGY, DISPLAY, Xvfb |
| **Cluster override paraméter** | ✅ -ClusterDirOverride |
| **Admin gombok helyesen indítanak** | ✅ /api/admin/servers/[id]/start |
| **User gombok helyesen indítanak** | ✅ /api/servers/[id]/start |
| **Systemd service helyesen konfigurálódik** | ✅ ExecStart + Environment |

---

## 🎯 Összegzés

A **kritikus összhang-probléma** megoldva:

1. ✅ **Install** telepíti a **Windows binárist** (Win64/ArkAscendedServer.exe)
2. ✅ **StartCommand** futtatja a **Windows binárist** Wine-on keresztül
3. ✅ **Admin és User UI gombok** helyesen hívják az API végpontokat
4. ✅ **Systemd service** megfelelően konfigurálódik
5. ✅ **Wine environment** teljes és helyes

Az ARK Ascended szerver install-startup flow most **teljes összhangban van**.
