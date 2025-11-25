# API Dokumentáció

Ez a dokumentáció leírja a ZedinGamingHosting platform API végpontjait.

## Autentikáció

### Admin API-k
Admin API-k használatához be kell jelentkezni NextAuth.js-sel, és ADMIN szerepkörrel kell rendelkezni.

### Agent API-k
Agent API-k használatához API kulcs szükséges a `Authorization` header-ben:
```
Authorization: Bearer zedin_<api-key>
```

## Admin API-k

### Szerver Gépek

#### GET /api/admin/machines
Szerver gépek listája.

**Query paraméterek:**
- `page` (opcionális): Oldalszám
- `status` (opcionális): Szűrés státusz szerint (ONLINE, OFFLINE, ERROR, MAINTENANCE)

**Válasz:**
```json
{
  "machines": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "total": 1
  }
}
```

#### POST /api/admin/machines
Új szerver gép hozzáadása.

**Body:**
```json
{
  "name": "Server 1",
  "ipAddress": "192.168.1.100",
  "sshPort": 22,
  "sshUser": "root",
  "sshKeyPath": "/path/to/key"
}
```

#### GET /api/admin/machines/[id]
Szerver gép részletei.

#### PUT /api/admin/machines/[id]
Szerver gép frissítése.

#### DELETE /api/admin/machines/[id]
Szerver gép törlése.

#### POST /api/admin/machines/[id]/install-agent
Agent telepítés indítása.

#### POST /api/admin/machines/[id]/test-ssh
SSH kapcsolat tesztelése.

### Agentek

#### GET /api/admin/agents
Agentek listája.

**Query paraméterek:**
- `page` (opcionális): Oldalszám
- `status` (opcionális): Szűrés státusz szerint
- `machineId` (opcionális): Szűrés gép szerint

#### GET /api/admin/agents/[id]
Agent részletei.

#### POST /api/admin/agents/[id]/regenerate-api-key
API kulcs újragenerálása.

### Feladatok

#### GET /api/admin/tasks
Feladatok listája.

**Query paraméterek:**
- `page` (opcionális): Oldalszám
- `status` (opcionális): Szűrés státusz szerint
- `type` (opcionális): Szűrés típus szerint

#### POST /api/admin/tasks/[id]/execute
Feladat végrehajtása.

### Szerverek

#### GET /api/admin/servers
Szerverek listája.

#### GET /api/admin/servers/[id]
Szerver részletei.

#### POST /api/admin/servers/[id]/start
Szerver indítása.

#### POST /api/admin/servers/[id]/stop
Szerver leállítása.

#### POST /api/admin/servers/[id]/restart
Szerver újraindítása.

#### GET /api/admin/servers/[id]/files
Fájlok listája.

#### POST /api/admin/servers/[id]/files
Fájl műveletek (szerkesztés, törlés, feltöltés).

#### GET /api/admin/servers/[id]/console
Konzol logok.

#### POST /api/admin/servers/[id]/console
Parancs küldése.

#### GET /api/admin/servers/[id]/backup
Backupok listája.

#### POST /api/admin/servers/[id]/backup
Backup létrehozása.

#### GET /api/admin/servers/[id]/config
Szerver konfiguráció lekérése.

#### PUT /api/admin/servers/[id]/config
Szerver konfiguráció frissítése.

#### GET /api/admin/servers/[id]/logs
Szerver logok lekérése.

**Query paraméterek:**
- `lines` (opcionális): Sorok száma (alapértelmezett: 100)
- `type` (opcionális): Log típus (all, error, warning, info)

#### GET /api/admin/servers/[id]/resources/stream
Real-time erőforrás monitoring (SSE).

#### GET /api/admin/servers/[id]/metrics
Teljesítmény metrikák.

**Query paraméterek:**
- `period` (opcionális): Időszak órákban (alapértelmezett: 24)
- `interval` (opcionális): Intervallum órákban (alapértelmezett: 1)

#### GET /api/admin/servers/[id]/resource-limits
Erőforrás limitok lekérése.

#### PUT /api/admin/servers/[id]/resource-limits
Erőforrás limitok frissítése.

### Monitoring

#### GET /api/admin/monitoring/stream
Real-time monitoring stream (SSE).

#### GET /api/admin/monitoring/health
Rendszer egészség statisztikák.

### Jelentések

#### GET /api/admin/reports/servers
Szerver statisztikák és jelentések.

**Query paraméterek:**
- `period` (opcionális): Időszak napokban (alapértelmezett: 30)
- `gameType` (opcionális): Játék típus szűrés

### Webhookok

#### GET /api/admin/webhooks
Webhook konfigurációk listája.

#### POST /api/admin/webhooks
Új webhook létrehozása.

**Body:**
```json
{
  "name": "Discord Notifications",
  "url": "https://discord.com/api/webhooks/...",
  "events": ["server_status_change", "task_completed"],
  "secret": "optional-secret"
}
```

### Szerver Sablonok

#### GET /api/admin/server-templates
Szerver sablonok listája.

### Port Kezelés

#### GET /api/admin/ports/check
Port elérhetőség ellenőrzése.

**Query paraméterek:**
- `port`: Port szám (kötelező)
- `gameType` (opcionális): Játék típus

### Rendszer

#### GET /api/admin/system/stats
Részletes rendszer statisztikák.

#### POST /api/admin/system/cron
Cron job végrehajtása.

#### POST /api/admin/system/tasks/process
Várakozó feladatok feldolgozása.

#### POST /api/admin/system/agents/check-offline
Offline agentek ellenőrzése.

## Agent API-k

### Regisztráció

#### POST /api/agent/register
Agent regisztráció.

**Body:**
```json
{
  "machineId": "machine-id",
  "version": "1.0.0",
  "capabilities": {
    "docker": true,
    "systemd": true
  }
}
```

**Válasz:**
```json
{
  "success": true,
  "agent": {
    "id": "...",
    "agentId": "...",
    "machine": {...}
  },
  "apiKey": "zedin_...",
  "message": "Agent sikeresen regisztrálva. Mentsd el az API kulcsot!"
}
```

### Heartbeat

#### POST /api/agent/heartbeat
Agent heartbeat küldése.

**Headers:**
```
Authorization: Bearer zedin_<api-key>
```

**Body:**
```json
{
  "agentId": "agent-id",
  "status": "ONLINE",
  "resources": {
    "cpu": {
      "usage": 25.5,
      "cores": 4
    },
    "ram": {
      "used": 2147483648,
      "total": 8589934592
    },
    "disk": {
      "used": 10737418240,
      "total": 107374182400
    }
  },
  "capabilities": {...}
}
```

## Webhook API-k

### Szerver Állapot Változás

#### POST /api/webhooks/server-status
Szerver állapot változás webhook.

**Headers:**
```
x-webhook-signature: <hmac-sha256-signature>
```

**Body:**
```json
{
  "serverId": "server-id",
  "oldStatus": "ONLINE",
  "newStatus": "OFFLINE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Hibaüzenetek

Minden API hiba esetén a következő formátumot használja:

```json
{
  "error": "Hibaüzenet"
}
```

HTTP státusz kódok:
- `200`: Sikeres
- `400`: Hibás kérés
- `401`: Nincs autentikáció
- `403`: Nincs jogosultság
- `404`: Nem található
- `500`: Szerver hiba

## Rate Limiting

Jelenleg nincs rate limiting implementálva. Javasolt:
- Admin API-k: 100 kérés/perc
- Agent API-k: 60 kérés/perc
- Webhook API-k: 10 kérés/perc

## Verziózás

Jelenleg nincs API verziózás. A jövőben:
- `/api/v1/...` formátum használata
- Deprecated endpoint-ok jelölése

## Példák

### cURL példák

#### Agent regisztráció
```bash
curl -X POST http://localhost:3000/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "machine-id",
    "version": "1.0.0",
    "capabilities": {"docker": true}
  }'
```

#### Heartbeat küldés
```bash
curl -X POST http://localhost:3000/api/agent/heartbeat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer zedin_<api-key>" \
  -d '{
    "agentId": "agent-id",
    "status": "ONLINE",
    "resources": {...}
  }'
```

#### Szerver indítás
```bash
curl -X POST http://localhost:3000/api/admin/servers/server-id/start \
  -H "Cookie: next-auth.session-token=..."
```

