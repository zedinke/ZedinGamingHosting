import { prisma } from '@/lib/prisma';

/**
 * Metrikák tárolása (jelenleg PostgreSQL-ben, később InfluxDB/TimescaleDB)
 */
export interface ServerMetric {
  serverId: string;
  timestamp: Date;
  cpu: number; // CPU használat %
  ram: number; // RAM használat MB
  disk: number; // Disk használat MB
  networkIn: number; // Bejövő hálózati forgalom MB
  networkOut: number; // Kimenő hálózati forgalom MB
  players?: number; // Játékosok száma
  uptime?: number; // Uptime másodpercben
}

/**
 * Metrika mentése
 */
export async function saveMetric(metric: ServerMetric): Promise<void> {
  try {
    // Jelenleg JSON-ben tároljuk a Server model configuration mezőjében
    // Később InfluxDB/TimescaleDB-re migrálunk
    const server = await prisma.server.findUnique({
      where: { id: metric.serverId },
      select: { configuration: true },
    });

    if (!server) {
      throw new Error('Szerver nem található');
    }

    const config = (server.configuration as any) || {};
    const metrics = config.metrics || [];

    // Új metrika hozzáadása
    metrics.push({
      timestamp: metric.timestamp.toISOString(),
      cpu: metric.cpu,
      ram: metric.ram,
      disk: metric.disk,
      networkIn: metric.networkIn,
      networkOut: metric.networkOut,
      players: metric.players,
      uptime: metric.uptime,
    });

    // Csak az utolsó 1000 metrikát tartjuk meg (körülbelül 1 hét adat 5 perces intervallummal)
    const trimmedMetrics = metrics.slice(-1000);

    // Konfiguráció frissítése
    await prisma.server.update({
      where: { id: metric.serverId },
      data: {
        configuration: {
          ...config,
          metrics: trimmedMetrics,
        },
      },
    });
  } catch (error) {
    console.error('Save metric error:', error);
    // Ne dobjunk hibát, mert a metrikák nem kritikusak
  }
}

/**
 * Metrikák lekérdezése időtartomány alapján
 */
export async function getMetrics(
  serverId: string,
  startTime: Date,
  endTime: Date
): Promise<ServerMetric[]> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    if (!server) {
      return [];
    }

    const config = (server.configuration as any) || {};
    const metrics = config.metrics || [];

    // Időtartomány szerinti szűrés
    const filteredMetrics = metrics.filter((m: any) => {
      const timestamp = new Date(m.timestamp);
      return timestamp >= startTime && timestamp <= endTime;
    });

    return filteredMetrics.map((m: any) => ({
      serverId,
      timestamp: new Date(m.timestamp),
      cpu: m.cpu,
      ram: m.ram,
      disk: m.disk,
      networkIn: m.networkIn,
      networkOut: m.networkOut,
      players: m.players,
      uptime: m.uptime,
    }));
  } catch (error) {
    console.error('Get metrics error:', error);
    return [];
  }
}

/**
 * Legutóbbi metrikák lekérdezése
 */
export async function getLatestMetrics(
  serverId: string,
  limit: number = 100
): Promise<ServerMetric[]> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    if (!server) {
      return [];
    }

    const config = (server.configuration as any) || {};
    const metrics = config.metrics || [];

    // Utolsó N metrika
    const latestMetrics = metrics.slice(-limit);

    return latestMetrics.map((m: any) => ({
      serverId,
      timestamp: new Date(m.timestamp),
      cpu: m.cpu,
      ram: m.ram,
      disk: m.disk,
      networkIn: m.networkIn,
      networkOut: m.networkOut,
      players: m.players,
      uptime: m.uptime,
    }));
  } catch (error) {
    console.error('Get latest metrics error:', error);
    return [];
  }
}

/**
 * Metrikák aggregálása (átlag, min, max)
 */
export async function getAggregatedMetrics(
  serverId: string,
  startTime: Date,
  endTime: Date,
  interval: 'hour' | 'day' = 'hour'
): Promise<Array<{
  timestamp: Date;
  cpu: { avg: number; min: number; max: number };
  ram: { avg: number; min: number; max: number };
  disk: { avg: number; min: number; max: number };
  networkIn: { total: number };
  networkOut: { total: number };
  players: { avg: number; max: number };
}>> {
  try {
    const metrics = await getMetrics(serverId, startTime, endTime);

    if (metrics.length === 0) {
      return [];
    }

    // Időintervallum szerint csoportosítás
    const grouped: Record<string, ServerMetric[]> = {};

    metrics.forEach((metric) => {
      const date = new Date(metric.timestamp);
      let key: string;

      if (interval === 'hour') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:00:00`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00`;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric);
    });

    // Aggregálás
    const aggregated = Object.entries(grouped).map(([timestamp, groupMetrics]) => {
      const cpuValues = groupMetrics.map((m) => m.cpu);
      const ramValues = groupMetrics.map((m) => m.ram);
      const diskValues = groupMetrics.map((m) => m.disk);
      const networkInTotal = groupMetrics.reduce((sum, m) => sum + m.networkIn, 0);
      const networkOutTotal = groupMetrics.reduce((sum, m) => sum + m.networkOut, 0);
      const playerValues = groupMetrics.map((m) => m.players || 0).filter((p) => p > 0);

      return {
        timestamp: new Date(timestamp),
        cpu: {
          avg: cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length,
          min: Math.min(...cpuValues),
          max: Math.max(...cpuValues),
        },
        ram: {
          avg: ramValues.reduce((a, b) => a + b, 0) / ramValues.length,
          min: Math.min(...ramValues),
          max: Math.max(...ramValues),
        },
        disk: {
          avg: diskValues.reduce((a, b) => a + b, 0) / diskValues.length,
          min: Math.min(...diskValues),
          max: Math.max(...diskValues),
        },
        networkIn: {
          total: networkInTotal,
        },
        networkOut: {
          total: networkOutTotal,
        },
        players: {
          avg: playerValues.length > 0 ? playerValues.reduce((a, b) => a + b, 0) / playerValues.length : 0,
          max: playerValues.length > 0 ? Math.max(...playerValues) : 0,
        },
      };
    });

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  } catch (error) {
    console.error('Get aggregated metrics error:', error);
    return [];
  }
}

