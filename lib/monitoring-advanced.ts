import { prisma } from '@/lib/prisma';

/**
 * Részletes monitoring adatok
 */
export interface AdvancedMetrics {
  serverId: string;
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    cached: number;
    buffers: number;
    swapUsed: number;
    swapTotal: number;
  };
  disk: {
    used: number;
    total: number;
    readBytes: number;
    writeBytes: number;
    readOps: number;
    writeOps: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    errorsIn: number;
    errorsOut: number;
  };
  players: {
    online: number;
    max: number;
    tps?: number; // Ticks per second (Minecraft)
  };
}

/**
 * Részletes metrikák mentése
 */
export async function saveAdvancedMetrics(metrics: AdvancedMetrics): Promise<void> {
  try {
    // Jelenleg JSON-ben tároljuk, később time-series DB-be migrálunk
    const server = await prisma.server.findUnique({
      where: { id: metrics.serverId },
      select: { configuration: true },
    });

    if (!server) {
      return;
    }

    const config = (server.configuration as any) || {};
    const advancedMetrics = config.advancedMetrics || [];

    advancedMetrics.push({
      timestamp: metrics.timestamp.toISOString(),
      cpu: metrics.cpu,
      memory: metrics.memory,
      disk: metrics.disk,
      network: metrics.network,
      players: metrics.players,
    });

    // Csak az utolsó 500 metrikát tartjuk meg
    const trimmedMetrics = advancedMetrics.slice(-500);

    await prisma.server.update({
      where: { id: metrics.serverId },
      data: {
        configuration: {
          ...config,
          advancedMetrics: trimmedMetrics,
        },
      },
    });
  } catch (error) {
    console.error('Save advanced metrics error:', error);
  }
}

/**
 * Részletes metrikák lekérdezése
 */
export async function getAdvancedMetrics(
  serverId: string,
  startTime: Date,
  endTime: Date
): Promise<AdvancedMetrics[]> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    if (!server) {
      return [];
    }

    const config = (server.configuration as any) || {};
    const metrics = config.advancedMetrics || [];

    return metrics
      .filter((m: any) => {
        const timestamp = new Date(m.timestamp);
        return timestamp >= startTime && timestamp <= endTime;
      })
      .map((m: any) => ({
        serverId,
        timestamp: new Date(m.timestamp),
        cpu: m.cpu,
        memory: m.memory,
        disk: m.disk,
        network: m.network,
        players: m.players,
      }));
  } catch (error) {
    console.error('Get advanced metrics error:', error);
    return [];
  }
}

/**
 * Rendszer szintű statisztikák
 */
export async function getSystemStatistics(): Promise<{
  totalServers: number;
  onlineServers: number;
  totalPlayers: number;
  totalCpuUsage: number;
  totalRamUsage: number;
  totalDiskUsage: number;
  averageUptime: number;
}> {
  try {
    const servers = await prisma.server.findMany({
      where: {
        agent: {
          isNot: null,
        },
      },
      include: {
        agent: true,
      },
    });

    let totalCpu = 0;
    let totalRam = 0;
    let totalDisk = 0;
    let onlineCount = 0;
    let totalPlayers = 0;

    for (const server of servers) {
      if (server.status === 'ONLINE') {
        onlineCount++;
      }

      const resourceUsage = server.resourceUsage as any;
      if (resourceUsage) {
        totalCpu += resourceUsage.cpu || 0;
        totalRam += resourceUsage.ram || 0;
        totalDisk += resourceUsage.disk || 0;
        totalPlayers += resourceUsage.players || 0;
      }
    }

    return {
      totalServers: servers.length,
      onlineServers: onlineCount,
      totalPlayers,
      totalCpuUsage: totalCpu,
      totalRamUsage: totalRam,
      totalDiskUsage: totalDisk,
      averageUptime: 0, // TODO: Uptime számítás
    };
  } catch (error) {
    console.error('Get system statistics error:', error);
    return {
      totalServers: 0,
      onlineServers: 0,
      totalPlayers: 0,
      totalCpuUsage: 0,
      totalRamUsage: 0,
      totalDiskUsage: 0,
      averageUptime: 0,
    };
  }
}

/**
 * Erőforrás trendek (növekedés/csökkenés)
 */
export async function getResourceTrends(
  serverId: string,
  hours: number = 24
): Promise<{
  cpuTrend: 'increasing' | 'decreasing' | 'stable';
  ramTrend: 'increasing' | 'decreasing' | 'stable';
  diskTrend: 'increasing' | 'decreasing' | 'stable';
}> {
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const metrics = await getAdvancedMetrics(serverId, startTime, endTime);

    if (metrics.length < 2) {
      return {
        cpuTrend: 'stable',
        ramTrend: 'stable',
        diskTrend: 'stable',
      };
    }

    const first = metrics[0];
    const last = metrics[metrics.length - 1];

    const cpuDiff = last.cpu.usage - first.cpu.usage;
    const ramDiff = (last.memory.used / last.memory.total) - (first.memory.used / first.memory.total);
    const diskDiff = (last.disk.used / last.disk.total) - (first.disk.used / first.disk.total);

    const threshold = 0.05; // 5% változás

    return {
      cpuTrend: cpuDiff > threshold ? 'increasing' : cpuDiff < -threshold ? 'decreasing' : 'stable',
      ramTrend: ramDiff > threshold ? 'increasing' : ramDiff < -threshold ? 'decreasing' : 'stable',
      diskTrend: diskDiff > threshold ? 'increasing' : diskDiff < -threshold ? 'decreasing' : 'stable',
    };
  } catch (error) {
    console.error('Get resource trends error:', error);
    return {
      cpuTrend: 'stable',
      ramTrend: 'stable',
      diskTrend: 'stable',
    };
  }
}

