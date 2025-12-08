# Template Deployment Folyamat Dokumentáció

## Áttekintés

A template deployment folyamat lehetővé teszi a játékszerverek gyors telepítését pre-built Docker template-ek használatával. A rendszer automatikusan kezeli a port allokációt, konfiguráció generálást, és Docker container indítását.

## Deployment Folyamat

### 1. Rendeléskor (provisionServer)

```
lib/server-provisioning.ts
├── findBestMachine() - Legjobb gép és agent keresése
├── Template-alapú deployment ellenőrzése
│   ├── Van template? → Agent API deployment
│   │   ├── POST /api/agent/templates/deploy
│   │   ├── Template letöltés és kibontás
│   │   ├── Port allokáció
│   │   ├── Konfiguráció generálás
│   │   ├── Docker container indítás
│   │   └── POST /api/agent/templates/update (SteamCMD update)
│   └── Nincs template? → Hagyományos deployment (task executor)
└── SFTP felhasználó létrehozása
```

### 2. Agent API Deployment

**Endpoint:** `POST /api/agent/templates/deploy`

**Folyamat:**
1. Agent autentikáció (API key)
2. TemplateDeployer.deployTemplate() hívása
3. Template letöltés Google Drive-ról
4. Template kibontás `/opt/servers/{serverId}`
5. Port allokáció (PortManager)
6. Konfiguráció generálás (játék-specifikus)
7. Docker container indítás
8. Szerver státusz frissítése

### 3. Template Update

**Endpoint:** `POST /api/agent/templates/update`

**Folyamat:**
1. Agent autentikáció
2. Container leállítás
3. SteamCMD update futtatása
4. Container újraindítás

## Komponensek

### Port Manager

**Fájl:** `lib/port-manager.ts`

**Főbb metódusok:**
- `allocatePorts()`: Port allokáció játékszerver számára
- `deallocatePorts()`: Port felszabadítás
- `findAvailablePort()`: Szabad port keresése
- `checkPortAvailability()`: Port elérhetőség ellenőrzés

**Port követelmények játékonként:**
- 7 Days to Die: game, telnet, webMap
- ARK: game, query, rcon
- Rust: game, query, rcon, rustPlus

### Template Deployer

**Fájl:** `lib/game-templates/services/template-deployer.ts`

**Főbb metódusok:**
- `deployTemplate()`: Teljes deployment folyamat
- `generateGameConfig()`: Játék-specifikus konfiguráció generálás
- `startGameContainer()`: Docker container indítás

**Deployment lépések:**
1. Template információ lekérése
2. Port allokáció
3. Szerver könyvtár létrehozása
4. Template letöltés
5. Template kibontás
6. Konfiguráció generálás
7. Docker container indítás
8. Szerver státusz frissítése

### Template Updater

**Fájl:** `lib/game-templates/services/template-updater.ts`

**Főbb metódusok:**
- `updateGameServer()`: Szerver frissítés SteamCMD-vel
- `runSteamCMDUpdate()`: SteamCMD update futtatása
- `getSteamAppId()`: Steam App ID meghatározása

**Update folyamat:**
1. Container leállítás
2. SteamCMD update futtatása
3. Container újraindítás

### Konfiguráció Generátorok

**7 Days to Die:** `lib/game-templates/configs/7days2die-config.ts`
- `generateServerConfig()`: serverconfig.xml generálás
- `generateAdminConfig()`: admin.xml generálás

**ARK:** `lib/game-templates/configs/ark-config.ts`
- `generateGameUserSettings()`: GameUserSettings.ini generálás
- `generateGameIni()`: Game.ini generálás (modokhoz)

## Docker Container Kezelés

### Container Név
- Formátum: `game-{serverId}`
- Példa: `game-clx123abc456`

### Volume Mount-ok

**7 Days to Die:**
```bash
-v /opt/servers/{serverId}/server:/opt/7days2die
```

**ARK:**
```bash
-v /opt/servers/{serverId}/server:/opt/ark-server
```

**Rust:**
```bash
-v /opt/servers/{serverId}/server:/opt/rust-server
```

### Port Binding

Portok automatikusan bind-olva a container-hez:
- UDP portok: `-p {port}:{port}/udp`
- TCP portok: `-p {port}:{port}/tcp`

### Container Indítás

```bash
docker run -d \
  --name game-{serverId} \
  --restart unless-stopped \
  -v /opt/servers/{serverId}/server:/opt/game-server \
  -p {port}:{port}/udp \
  {dockerImage}
```

## ARK Cluster Támogatás

### NFS Mount

**Cluster mappa:** `/opt/shared-Arks/{clusterId}`

**Docker volume mount:**
```bash
-v /opt/shared-Arks/{clusterId}:/cluster
```

### Cluster Konfiguráció

**GameUserSettings.ini:**
```ini
[ServerSettings]
ClusterDirOverride=/opt/shared-Arks/{clusterId}
ClusterID={clusterId}
```

### Több Szerver Ugyanabban a Clusterben

1. Minden szerver ugyanazt a `clusterId`-t használja
2. Minden szerver ugyanazt a cluster mappát mount-olja
3. ARK automatikusan szinkronizálja az adatokat

## SteamCMD Automatikus Frissítés

### Telepítés

**Hely:** `/opt/steamcmd` (minden fizikai szervergépen)

**Telepítés:** Agent telepítéskor automatikusan telepítve

### Update Parancs

```bash
cd /opt/steamcmd && ./steamcmd.sh \
  +force_install_dir /opt/servers/{serverId}/server \
  +login anonymous \
  +app_update {steamAppId} validate \
  +quit
```

### Steam App ID-k

- 7 Days to Die: 251570
- ARK Evolved: 376030
- ARK Ascended: 2430930
- Rust: 258550
- Valheim: 896660
- Satisfactory: 1690800

## Google Drive Template Letöltés

### Konfiguráció

**Környezeti változók:**
- `GOOGLE_DRIVE_API_KEY`: Google Drive API kulcs
- `GOOGLE_DRIVE_FOLDER_ID`: Template mappa ID

### Letöltés Folyamat

1. Template információ lekérése (fileId, fileName, checksum)
2. Fájl letöltése Google Drive API-ról
3. Progress tracking (onProgress callback)
4. Checksum validáció (SHA256)

### Checksum Validáció

```typescript
const isValid = await validateChecksum(destinationPath, expectedChecksum);
if (!isValid) {
  throw new Error('Template checksum validation failed');
}
```

## Hibaelhárítás

### Template letöltés sikertelen

**Lehetséges okok:**
- `GOOGLE_DRIVE_API_KEY` nincs beállítva
- Template `fileId` hibás
- Hálózati kapcsolat probléma

**Megoldás:**
1. Ellenőrizd a környezeti változókat
2. Ellenőrizd a template definíciót
3. Teszteld a Google Drive API kapcsolatot

### Port allokáció sikertelen

**Lehetséges okok:**
- Nincs szabad port a tartományban
- Port foglalt az adatbázisban
- Port foglalt a gépen

**Megoldás:**
1. Ellenőrizd a PortAllocation táblát
2. Ellenőrizd a port elérhetőségét SSH-n keresztül
3. Növeld a port tartományt, ha szükséges

### Docker container nem indul

**Lehetséges okok:**
- Docker image nem létezik
- Port binding hiba
- Volume mount hiba

**Megoldás:**
1. Ellenőrizd a Docker image létezését: `docker images`
2. Ellenőrizd a port binding-okat: `docker ps`
3. Nézd meg a container logokat: `docker logs game-{serverId}`

### SteamCMD update sikertelen

**Lehetséges okok:**
- SteamCMD nincs telepítve
- Hálózati kapcsolat probléma
- Steam App ID hibás

**Megoldás:**
1. Ellenőrizd a SteamCMD telepítését: `ls /opt/steamcmd`
2. Teszteld a SteamCMD-t: `/opt/steamcmd/steamcmd.sh +quit`
3. Ellenőrizd a Steam App ID-t

## Következő Lépések

1. **7 Days to Die Template Készítés**
   - Docker image build GameServer-1-en
   - Template csomagolás
   - Google Drive feltöltés
   - fileId beállítása

2. **ARK Template-ek**
   - ARK Evolved template
   - ARK Ascended template
   - NFS cluster támogatás

3. **Rust Template**
   - Rust template készítés
   - Oxide mod támogatás

