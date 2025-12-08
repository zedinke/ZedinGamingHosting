# Docker Template Rendszer Dokumentáció

## Áttekintés

A Docker template rendszer lehetővé teszi a játékszerverek gyors telepítését pre-built Docker image-ek használatával. A rendszer Google Drive-ról tölti le a template-eket, automatikusan osztja ki a portokat, és Docker container-ekben futtatja a szervereket.

## Fő Komponensek

### 1. Port Manager (`lib/port-manager.ts`)

Centralizált port allokáció és kezelés:
- `allocatePorts()`: Port allokáció játékszerver számára
- `deallocatePorts()`: Port felszabadítás
- `findAvailablePort()`: Szabad port keresése
- `checkPortAvailability()`: Port elérhetőség ellenőrzés (adatbázis + SSH)

**Adatbázis séma:**
```prisma
model PortAllocation {
  id        String   @id @default(cuid())
  machineId String
  serverId  String?  @unique
  gameType  GameType
  port      Int      // Alap game port
  queryPort Int?
  rconPort  Int?
  telnetPort Int?
  webMapPort Int?
  // ...
}
```

### 2. Template Deployer (`lib/game-templates/services/template-deployer.ts`)

Teljes template deployment folyamat:
1. Template letöltés Google Drive-ról
2. Template kibontás `/opt/servers/{serverId}`
3. Port allokáció (PortManager)
4. Konfiguráció generálás (játék-specifikus)
5. Docker container indítás
6. Health check

### 3. Template Updater (`lib/game-templates/services/template-updater.ts`)

SteamCMD alapú szerver frissítés:
- `updateGameServer()`: Szerver frissítés SteamCMD-vel
- `checkForUpdates()`: Frissítések ellenőrzése
- Automatikus update új rendeléskor

### 4. Agent API Endpoints

**POST `/api/agent/templates/deploy`**
- Template deployment agent gépen
- Paraméterek: `serverId`, `templateId`, `serverName`, `maxPlayers`, `config`

**POST `/api/agent/templates/update`**
- Template update SteamCMD-vel
- Paraméterek: `serverId`, `gameType`

### 5. Játék-specifikus Konfiguráció Generátorok

**7 Days to Die** (`lib/game-templates/configs/7days2die-config.ts`):
- `serverconfig.xml` generálás
- `admin.xml` generálás
- World generation, difficulty, zombie settings

**ARK** (`lib/game-templates/configs/ark-config.ts`):
- `GameUserSettings.ini` generálás
- Cluster ID beállítás
- Map selection

### 6. ARK Cluster NFS Támogatás (`lib/ark-cluster-nfs.ts`)

NFS mount kezelés ARK játékokhoz:
- `setupNFSMount()`: NFS mount beállítása
- `getClusterPath()`: `/opt/shared-Arks/{clusterId}` elérési út
- `syncClusterData()`: Adatok szinkronizálása

## Deployment Folyamat

### 1. Rendeléskor (provisionServer)

```typescript
// lib/server-provisioning.ts
1. Legjobb gép és agent keresése
2. Template-alapú deployment ellenőrzése
3. Ha van template:
   - Agent API-n keresztül template deployment
   - SteamCMD update futtatása
4. Ha nincs template:
   - Hagyományos deployment (task executor)
```

### 2. Agent API Deployment

```typescript
// app/api/agent/templates/deploy/route.ts
1. Agent autentikáció
2. TemplateDeployer.deployTemplate() hívása
3. Template letöltés és kibontás
4. Port allokáció
5. Konfiguráció generálás
6. Docker container indítás
```

### 3. Template Deployment Részletek

```typescript
// lib/game-templates/services/template-deployer.ts
1. Template információ lekérése
2. Port allokáció (PortManager)
3. Szerver könyvtár létrehozása
4. Template letöltés Google Drive-ról
5. Template kibontás
6. Konfiguráció generálás (játék-specifikus)
7. Docker container indítás
8. Szerver státusz frissítése
```

## 7 Days to Die Template

### Dockerfile (`docker/games/7days2die/Dockerfile`)
- Base image: `ubuntu:22.04`
- SteamCMD telepítés
- 7 Days to Die szerver telepítés (Steam App ID: 251570)
- Entrypoint script: szerver indítás, update kezelés

### Template Build (`scripts/build-7days-template.sh`)
- Docker image build
- Container indítás és konfigurálás
- Template fájlok csomagolása (tar.gz)
- Checksum generálás

### Konfiguráció Generálás
- `serverconfig.xml`: Server name, max players, world generation, difficulty
- `admin.xml`: Admin felhasználók

## ARK Cluster Támogatás

### NFS Mount
- Cluster mappa: `/opt/shared-Arks/{clusterId}`
- Docker volume mount: `/opt/shared-Arks/{clusterId}:/cluster`
- Több szerver ugyanabban a clusterben

### Konfiguráció
- `GameUserSettings.ini`: Cluster ID, cluster directory path
- Map selection: TheIsland, TheCenter, Ragnarok, stb.

## SteamCMD Automatikus Frissítés

### Telepítés
- Agent telepítéskor automatikus SteamCMD telepítés
- `/opt/steamcmd` könyvtár
- Minden fizikai szervergépen telepítve

### Update Folyamat
1. Container leállítás
2. SteamCMD update futtatás
3. Konfiguráció megőrzése
4. Container újraindítás

### Új Rendeléskor
- Template letöltés és kibontás után
- SteamCMD update futtatása (legfrissebb verzió)
- Konfiguráció generálás
- Container indítás

## Port Allokáció

### Játék-specifikus Portok

**7 Days to Die:**
- Game Port: 26900 (UDP)
- Telnet Port: GamePort + 1 (TCP)
- WebMap Port: GamePort + 2 (TCP)

**ARK:**
- Game Port: 7777 (UDP)
- Query Port: GamePort + 1 (UDP)
- RCON Port: GamePort + 2 (TCP)

**Rust:**
- Game Port: 28015 (UDP)
- Query Port: GamePort + 1 (UDP)
- RCON Port: GamePort + 2 (TCP)
- Rust Plus Port: GamePort + 67 (TCP)

### Port Konfliktus Ellenőrzés
1. Adatbázis ellenőrzés (PortAllocation tábla)
2. SSH-n keresztül ellenőrzés (netstat)
3. Port allokáció csak akkor, ha mindkét ellenőrzés sikeres

## Google Drive Template Letöltés

### Konfiguráció
- `GOOGLE_DRIVE_API_KEY`: Google Drive API kulcs
- `GOOGLE_DRIVE_FOLDER_ID`: Template mappa ID

### Letöltés Folyamat
1. Template információ lekérése (fileId, fileName, checksum)
2. Fájl letöltése Google Drive API-ról
3. Progress tracking
4. Checksum validáció (SHA256)

## Tesztelés

### 7 Days to Die Deployment
1. Docker image build GameServer-1-en
2. Template készítés és Google Drive feltöltés
3. Template letöltés és deployment teszt
4. Szerver indítás és kapcsolódás teszt
5. Konfiguráció módosítás teszt

### Port Manager Tesztelés
- Port allokáció teszt (több szerver egyszerre)
- Port konfliktus detektálás
- Port felszabadítás teszt

### ARK Cluster Tesztelés
- NFS mount teszt
- Cluster mappa megosztás teszt
- Több szerver ugyanabban a clusterben

## Következő Lépések

1. **7 Days to Die Template Készítés**
   - Docker image build GameServer-1-en
   - Template csomagolás
   - Google Drive feltöltés
   - fileId beállítása template definícióban

2. **ARK Template-ek**
   - ARK Evolved template
   - ARK Ascended template
   - NFS cluster támogatás

3. **Rust Template**
   - Rust template készítés
   - Oxide mod támogatás

## Hibaelhárítás

### Template letöltés sikertelen
- Ellenőrizd a `GOOGLE_DRIVE_API_KEY` beállítását
- Ellenőrizd a template `fileId`-t
- Ellenőrizd a hálózati kapcsolatot

### Port allokáció sikertelen
- Ellenőrizd a PortAllocation táblát
- Ellenőrizd a port elérhetőségét SSH-n keresztül
- Növeld a port tartományt, ha szükséges

### Docker container nem indul
- Ellenőrizd a Docker image létezését
- Ellenőrizd a port binding-okat
- Ellenőrizd a volume mount-okat
- Nézd meg a container logokat: `docker logs game-{serverId}`

