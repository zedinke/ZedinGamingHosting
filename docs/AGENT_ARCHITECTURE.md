# Agent-Based Architektúra Dokumentáció

## Áttekintés

Ez a dokumentáció leírja az agent-based architektúra implementációját a ZedinGamingHosting platformon.

## Architektúra Komponensek

### 1. Weboldal (Next.js)
- **Helye**: Jelenlegi szerver
- **Funkciók**:
  - Felhasználói felület
  - API Gateway (központi vezérlés)
  - Adatbázis (szerver információk, státuszok)
  - Felhasználói kezelés, számlázás

### 2. Game Server Manager (ugyanerre a gépre)
- **Helye**: Next.js API routes-ban implementálva
- **Funkciók**:
  - Központi koordinátor
  - Ügynökök kezelése
  - Erőforrás monitoring
  - Feladatütemezés (Task Queue)

### 3. Game Server Agent (minden game szerver gépen)
- **Helye**: Külön alkalmazás (jelenleg nincs implementálva)
- **Funkciók**:
  - Szerver telepítés/indítás/leállítás
  - Erőforrás monitoring
  - Fájlkezelés
  - Konzol hozzáférés
  - Backup kezelés

## Kommunikáció

### Weboldal ↔ Manager
- **Protokoll**: REST API (belső hálózat)
- **Endpoints**:
  - `/api/admin/machines` - Szerver gépek kezelése
  - `/api/admin/agents` - Agentek kezelése
  - `/api/admin/tasks` - Feladatok kezelése
  - `/api/admin/monitoring/stream` - Real-time monitoring (SSE)

### Manager ↔ Agents
- **Protokoll**: REST API / Server-Sent Events
- **Endpoints**:
  - `/api/agent/register` - Agent regisztráció
  - `/api/agent/heartbeat` - Heartbeat küldés
  - `/api/admin/servers/[id]/resources` - Erőforrás frissítés

### Agents → Manager
- **Heartbeat**: 30 másodpercenként
- **Státusz frissítések**: Valós időben
- **Erőforrás adatok**: 2 másodpercenként

## Adatbázis Séma

### ServerMachine
Szerver gépek (host nodes) információi:
- `id`, `name`, `ipAddress`
- `sshPort`, `sshUser`, `sshKeyPath`
- `status`, `lastHeartbeat`
- `resources` (CPU, RAM, Disk)

### Agent
Game server agentek:
- `id`, `agentId` (egyedi azonosító)
- `machineId` (melyik gépen fut)
- `version`, `status`
- `lastHeartbeat`, `capabilities`

### Task
Feladatütemezés:
- `id`, `type` (PROVISION, START, STOP, RESTART, etc.)
- `status` (PENDING, RUNNING, COMPLETED, FAILED)
- `agentId`, `serverId`
- `command`, `result`, `error`

### Server
Bővítve:
- `machineId` - Melyik gépen fut
- `agentId` - Melyik agent kezeli

## Automatikus Terheléselosztás

A `findBestMachine()` függvény:
1. Összes online gépet és agenteket lekérdezi
2. Erőforrás követelményeket ellenőrzi
3. Terhelést számít (CPU, RAM, Disk, szerverek száma)
4. A legkevesebb terhelésű gépet választja
5. A legkevesebb szervert kezelő agentet választja

## Szerver Provisioning Folyamat

1. **Rendelés** - Felhasználó rendel egy szervert
2. **Gép kiválasztás** - `findBestMachine()` megtalálja a legjobb gépet
3. **Task létrehozás** - PROVISION task létrejön
4. **Provisioning** - Agent telepíti a szervert
5. **Port generálás** - Automatikus port hozzárendelés
6. **Indítás** - Szerver automatikusan elindul

## Agent Heartbeat Rendszer

- **Frekvencia**: 30 másodperc
- **Adatok**: Státusz, erőforrások, képességek
- **Offline észlelés**: 5 perc után automatikusan OFFLINE-re állítja

## Real-time Monitoring

- **SSE Stream**: `/api/admin/monitoring/stream`
- **Frissítés**: 5 másodpercenként
- **Heartbeat**: 30 másodpercenként
- **Szerver erőforrások**: 2 másodpercenként

## API Endpoints

### Admin API-k
- `GET /api/admin/machines` - Szerver gépek listája
- `POST /api/admin/machines` - Új gép hozzáadása
- `GET /api/admin/machines/[id]` - Gép részletei
- `PUT /api/admin/machines/[id]` - Gép frissítése
- `DELETE /api/admin/machines/[id]` - Gép törlése
- `POST /api/admin/machines/[id]/install-agent` - Agent telepítés

- `GET /api/admin/agents` - Agentek listája
- `GET /api/admin/tasks` - Feladatok listája
- `POST /api/admin/tasks/[id]/execute` - Feladat végrehajtás

- `GET /api/admin/monitoring/stream` - Real-time monitoring stream
- `GET /api/admin/monitoring/health` - Rendszer egészség

### Agent API-k
- `POST /api/agent/register` - Agent regisztráció
- `POST /api/agent/heartbeat` - Heartbeat küldés

### Szerver API-k
- `GET /api/admin/servers/[id]/files` - Fájlok listája
- `POST /api/admin/servers/[id]/files` - Fájl műveletek
- `GET /api/admin/servers/[id]/console` - Konzol logok
- `POST /api/admin/servers/[id]/console` - Parancs küldés
- `GET /api/admin/servers/[id]/backup` - Backupok listája
- `POST /api/admin/servers/[id]/backup` - Backup létrehozás
- `GET /api/admin/servers/[id]/resources/stream` - Real-time erőforrás monitoring

## Telepítési Folyamat (Egy gombnyomásra)

1. Admin panel: "Add New Server"
2. Add meg az IP-t és SSH credentials-t
3. Manager SSH-n keresztül telepíti az agentet (TODO)
4. Agent auto-regisztrál a managerrel
5. Kész: a gép használható

## Következő Lépések

1. **Tényleges Agent Implementáció**
   - Node.js vagy Python alkalmazás
   - SSH integráció
   - Docker/Systemd kezelés

2. **SSH Integráció**
   - Fájlkezelés SSH-n keresztül
   - Konzol hozzáférés SSH-n keresztül
   - Agent telepítés SSH-n keresztül

3. **Docker Integráció**
   - Container létrehozása
   - Game szerver telepítés
   - Port kezelés

4. **Backup Rendszer**
   - Automatikus backupok
   - Backup tárolás (S3, FTP)
   - Backup visszaállítás

## Biztonság

- **Autentikáció**: API key vagy token az agentekhez
- **TLS/SSL**: Titkosított kommunikáció
- **Firewall**: Csak szükséges portok nyitva
- **SSH kulcsok**: Biztonságos SSH kapcsolat

