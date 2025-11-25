# Time-Series Adatbázis Migráció Útmutató

Ez a dokumentum leírja, hogyan lehet a metrikák tárolását PostgreSQL-ről InfluxDB-re vagy TimescaleDB-re migrálni.

## Jelenlegi Implementáció

A metrikák jelenleg a `Server.configuration` JSON mezőjében vannak tárolva, maximum 1000 metrika per szerver.

## Migrációs Opciók

### Opció 1: TimescaleDB (PostgreSQL Extension)

**Előnyök:**
- PostgreSQL extension, könnyen integrálható
- SQL-alapú lekérdezések
- Jó teljesítmény

**Telepítés:**
```bash
# PostgreSQL-ben
CREATE EXTENSION IF NOT EXISTS timescaledb;

# Metrikák tábla létrehozása
CREATE TABLE server_metrics (
  time TIMESTAMPTZ NOT NULL,
  server_id TEXT NOT NULL,
  cpu DOUBLE PRECISION,
  ram DOUBLE PRECISION,
  disk DOUBLE PRECISION,
  network_in DOUBLE PRECISION,
  network_out DOUBLE PRECISION,
  players INTEGER,
  uptime INTEGER
);

# Hypertable létrehozása
SELECT create_hypertable('server_metrics', 'time');

# Indexek
CREATE INDEX idx_server_metrics_server_id ON server_metrics (server_id, time DESC);
```

**Használat:**
```typescript
// lib/metrics-storage-timescale.ts
import { prisma } from '@/lib/prisma';

export async function saveMetric(metric: ServerMetric) {
  await prisma.$executeRaw`
    INSERT INTO server_metrics (time, server_id, cpu, ram, disk, network_in, network_out, players, uptime)
    VALUES (${metric.timestamp}, ${metric.serverId}, ${metric.cpu}, ${metric.ram}, ${metric.disk}, ${metric.networkIn}, ${metric.networkOut}, ${metric.players}, ${metric.uptime})
  `;
}
```

### Opció 2: InfluxDB

**Előnyök:**
- Dedikált time-series adatbázis
- Nagyon jó teljesítmény
- Rich query language

**Telepítés:**
```bash
# Docker
docker run -d -p 8086:8086 \
  -v influxdb-storage:/var/lib/influxdb2 \
  -e DOCKER_INFLUXDB_INIT_MODE=setup \
  -e DOCKER_INFLUXDB_INIT_USERNAME=admin \
  -e DOCKER_INFLUXDB_INIT_PASSWORD=password \
  -e DOCKER_INFLUXDB_INIT_ORG=zedingaming \
  -e DOCKER_INFLUXDB_INIT_BUCKET=metrics \
  influxdb:latest
```

**Használat:**
```typescript
// lib/metrics-storage-influx.ts
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || '',
});

export async function saveMetric(metric: ServerMetric) {
  const writeApi = influxDB.getWriteApi(
    process.env.INFLUXDB_ORG || 'zedingaming',
    process.env.INFLUXDB_BUCKET || 'metrics'
  );

  const point = new Point('server_metrics')
    .tag('server_id', metric.serverId)
    .floatField('cpu', metric.cpu)
    .floatField('ram', metric.ram)
    .floatField('disk', metric.disk)
    .floatField('network_in', metric.networkIn)
    .floatField('network_out', metric.networkOut)
    .intField('players', metric.players || 0)
    .intField('uptime', metric.uptime || 0)
    .timestamp(metric.timestamp);

  writeApi.writePoint(point);
  await writeApi.close();
}
```

## Migrációs Script

```typescript
// scripts/migrate-metrics-to-timeseries.ts
import { prisma } from '@/lib/prisma';
import { getLatestMetrics } from '@/lib/metrics-storage';

async function migrateMetrics() {
  const servers = await prisma.server.findMany({
    select: { id: true },
  });

  for (const server of servers) {
    const metrics = await getLatestMetrics(server.id, 10000);
    
    // Migrálás InfluxDB-be vagy TimescaleDB-be
    for (const metric of metrics) {
      // saveMetric(metric) - új implementációval
    }
  }
}

migrateMetrics();
```

## Környezeti Változók

```env
# TimescaleDB (PostgreSQL extension)
DATABASE_URL=postgresql://user:password@localhost:5432/zedingaming

# InfluxDB
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token
INFLUXDB_ORG=zedingaming
INFLUXDB_BUCKET=metrics
```

## Ajánlás

**Kezdéshez:** TimescaleDB ajánlott, mert:
- Könnyen integrálható a meglévő PostgreSQL adatbázisba
- SQL-alapú, könnyen érthető
- Jó teljesítmény

**Nagyobb skálán:** InfluxDB ajánlott, mert:
- Dedikált time-series adatbázis
- Jobb teljesítmény nagy adatmennyiség esetén
- Rich query language

