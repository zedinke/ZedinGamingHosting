# Zero-Touch ARK Deployment via Agent

## Áttekintés

A rendszer most **100% automatikus ARK szerver telepítést** valósít meg a game server agent-en keresztül. **Nincs SSH, nincs jelszó, nincs manuális beavatkozás** szükséges.

## Működési folyamat

```
1. Felhasználó megrendel ARK szerveret
2. Fizetés feldolgozása
3. triggerAutoInstallOnPayment() aktiválódik
4. provisionServer() dedikált gépet választ ki
5. Task létrehozódik az adatbázisban: PROVISION
6. Agent daemon lekérdezi feladatokat (heartbeat)
7. Agent végrehajtja: executeProvision() → provisionARKServer()
8. Docker container indul: zedin-gaming/ark-ascended
9. ARK szerver indítása automatikus
10. Health check: ArkAscendedServer process monitorozása
11. Agent visszajelez: COMPLETED status
12. Manager frissíti szerver státuszát: ONLINE
13. Játékos csatlakozhat
```

## Komponensek

### 1. Game Server Agent (`agent/index.js`)
- **Futási helye**: Dedikált game server minden gépen
- **Kommunikáció**: HTTP API-n keresztül
- **Autentikáció**: API key (környezeti változó)
- **Heartbeat**: 30 másodpercenként lekérdez feladatokat

#### Új függvények:
```javascript
executeProvision(task)        // ARK Docker telepítése
executeDockerStart(task)      // Container indítása
executeDockerStop(task)       // Container leállítása
executeDockerDelete(task)     // Container és adatok törlése
provisionARKServer()          // ARK szerver telepítésének logikája
generateARKDockerCompose()    // docker-compose.yml generálása
```

### 2. Manager API (`lib/agent-provisioning.ts`)
- **Funkció**: Task-ok létrehozása az adatbázisban
- **Pollingz**: Max 30 másodperc várakozás az agent válaszára

```typescript
provisionServerViaAgent(agentId, serverId, config)
stopServerViaAgent(agentId, serverId)
startServerViaAgent(agentId, serverId)
deleteServerViaAgent(agentId, serverId)
```

### 3. Task Management
- **Task típusok**: PROVISION, DOCKER_START, DOCKER_STOP, DOCKER_DELETE
- **Státuszok**: PENDING → RUNNING → COMPLETED/FAILED
- **Adatbázis**: Prisma Task model

### 4. Telepítési Flow (`lib/game-server-installer.ts`)

ARK szerverekhez (ARK_ASCENDED, ARK_EVOLVED):
1. Machine selection: `findBestMachine()`
2. Provisioning: `provisionServer()` → agentId
3. Installation: `provisionServerViaAgent()` → Task létrehozás
4. Status polling: Max 30 másodperc

## Docker Compose konfigurációja

Az agent automatikusan generálja:

```yaml
services:
  ark-server:
    image: zedin-gaming/ark-ascended:latest
    container_name: ark-{serverId}
    ports:
      - '27015:27015/tcp'
      - '27015:27015/udp'
      - '27016:27016/tcp'
      - '27016:27016/udp'
    environment:
      SERVER_NAME: 'ARK Ascended Server'
      SERVER_PORT: '27015'
      QUERY_PORT: '27016'
      MAX_PLAYERS: '70'
      DIFFICULTY: '1.0'
      MAP_NAME: 'TheIsland_WP'
    volumes:
      - ark-server-data:/data
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'ps aux | grep -i ArkAscendedServer | grep -v grep']
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s
```

## Health Check mechanizmus

Az agent 2 percig monitorozza az ARK szerver indítását:

```javascript
// Végig-végig: ps aux | grep ArkAscendedServer
// Max 24 próba (2 perc)
// Ha megjelenik a process → SUCCESS
// Ha nem → WARNING (de Task még COMPLETED)
```

## API Endpoints

### Agent által meghívva
- `GET /api/agent/tasks` - Függőben lévő feladatok lekérdezése
- `POST /api/agent/tasks/{id}/complete` - Task befejezésének jelzése

### Manager által meghívva (belső)
- Prisma task creation: `prisma.task.create()`

## Biztonsági jellemzők

1. **API Key Auth**: Minden agent egyedi API kulccsal rendelkezik
2. **Task Database**: Centralizált, auditálható feladat-nyomkövetés
3. **Státusz polling**: Manager nem vár SSH-ra, Task-ra hallgatja
4. **Egyedi container nevek**: `ark-{serverId}` → Összecsapódás megelőzése
5. **Graceful shutdown**: `docker stop -t 30` → 30 másodperc clean shutdown

## Hibakezelés

### Agent-oldal
```javascript
// Hiba → Task status: FAILED
// Logok az agent stderr-be
// Manager 30 sec után timeout-ot jelez
```

### Manager-oldal
```typescript
// 1. Task nem talált → Error
// 2. Agent nem válaszol 30 sec alatt → Timeout warning
// 3. Agent hiba → FAILED task
```

## Zero-Touch előnyei

✅ **Nincs SSH infrastruktúra szükséges**
✅ **Jelszó-mentes automatizáció**
✅ **Skálázható (100+ gép)**
✅ **Auditálható (összes task rögzített)**
✅ **Offline barát (még ha offline van az admin, a rendszer működik)**
✅ **Real-time státusz (DB polling)**

## Tesztelés

### 1. Agent heartbeat ellenőrzése
```bash
# Log végig az agent stdout-ját
docker logs [agent-container-id]
# Várd meg a "Feladatok lekérdezése..." üzeneteket
```

### 2. Manual task létrehozás
```typescript
// Manager-ban:
const task = await prisma.task.create({
  data: {
    agentId: 'agent-id',
    serverId: 'server-id',
    type: 'PROVISION',
    status: 'PENDING',
    command: {
      gameType: 'ARK_ASCENDED',
      serverName: 'Test Server',
      port: 27015,
      // ...
    },
  },
});
```

### 3. Task státusz monitorozása
```bash
# Prisma Studio-ban:
npx prisma studio

# Tasks tábla → Status: PENDING → RUNNING → COMPLETED
```

## Jövőbeni fejlesztések

- [ ] Backup task típus automatizálása
- [ ] Update task típus (ARK szerver verziók)
- [ ] Scaling task típus (játékos szám alapján)
- [ ] Cluster management task-ok
- [ ] Health check reports az API-n

## Dokumentáció szükséges frissítések

- [x] Agent ARK Docker support
- [x] Task-based orchestration
- [x] Zero-touch workflow
- [ ] Deployment guide (production)
- [ ] Troubleshooting guide
- [ ] Performance tuning guide
