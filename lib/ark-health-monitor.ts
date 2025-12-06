/**
 * ARK Server Health Monitoring
 * Real-time FPS, RAM, CPU tracking with lag detection
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface ServerHealthMetrics {
  serverId: string;
  timestamp: Date;
  fps: number;
  playerCount: number;
  maxPlayers: number;
  cpuUsage: number;
  ramUsage: number;
  maxRam: number;
  isHealthy: boolean;
  issues: string[];
}

export interface HealthThresholds {
  fpsMin: number; // Min acceptable FPS
  cpuMax: number; // Max CPU %
  ramMax: number; // Max RAM %
  playerCountMax: number; // Max concurrent players
}

// Default health thresholds
const DEFAULT_THRESHOLDS: HealthThresholds = {
  fpsMin: 30,
  cpuMax: 85,
  ramMax: 90,
  playerCountMax: 70,
};

// In-memory health metrics storage (in production, use database)
const healthMetricsCache = new Map<string, ServerHealthMetrics[]>();
const MAX_METRICS_HISTORY = 288; // Keep 24 hours of 5-min intervals

/**
 * Record server health metrics
 */
export async function recordServerHealth(
  serverId: string,
  metrics: Partial<ServerHealthMetrics>
) {
  try {
    const timestamp = new Date();

    // Get server config for thresholds
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = (server?.configuration as any) || {};
    const thresholds = { ...DEFAULT_THRESHOLDS, ...config.healthThresholds };

    // Detect health issues
    const issues: string[] = [];

    if ((metrics.fps || 0) < thresholds.fpsMin) {
      issues.push(`Low FPS: ${metrics.fps || 0} (min: ${thresholds.fpsMin})`);
    }

    if ((metrics.cpuUsage || 0) > thresholds.cpuMax) {
      issues.push(`High CPU: ${metrics.cpuUsage || 0}% (max: ${thresholds.cpuMax}%)`);
    }

    if ((metrics.ramUsage || 0) > thresholds.ramMax) {
      issues.push(`High RAM: ${metrics.ramUsage || 0}% (max: ${thresholds.ramMax}%)`);
    }

    if (
      (metrics.playerCount || 0) > (metrics.maxPlayers || 70) * 0.95
    ) {
      issues.push(`Server nearly full: ${metrics.playerCount}/${metrics.maxPlayers} players`);
    }

    const healthMetrics: ServerHealthMetrics = {
      serverId,
      timestamp,
      fps: metrics.fps || 0,
      playerCount: metrics.playerCount || 0,
      maxPlayers: metrics.maxPlayers || 70,
      cpuUsage: metrics.cpuUsage || 0,
      ramUsage: metrics.ramUsage || 0,
      maxRam: metrics.maxRam || 16384,
      isHealthy: issues.length === 0,
      issues,
    };

    // Store in cache
    if (!healthMetricsCache.has(serverId)) {
      healthMetricsCache.set(serverId, []);
    }

    const cache = healthMetricsCache.get(serverId)!;
    cache.push(healthMetrics);

    // Keep only recent history
    if (cache.length > MAX_METRICS_HISTORY) {
      cache.shift();
    }

    // Log issues if any
    if (issues.length > 0) {
      logger.warn('Server health issues detected', {
        serverId,
        issues,
        metrics: healthMetrics,
      });
    }

    // Save to database for persistence (batched)
    try {
      await prisma.server.update({
        where: { id: serverId },
        data: {
          configuration: {
            ...config,
            lastHealthMetrics: {
              ...healthMetrics,
              timestamp: timestamp.toISOString(),
            },
          },
        },
      });
    } catch (err) {
      logger.error('Failed to save health metrics', err as Error, { serverId });
    }

    return healthMetrics;
  } catch (error: any) {
    logger.error('Failed to record health metrics', error, { serverId });
    throw error;
  }
}

/**
 * Get server health history
 */
export function getServerHealthHistory(serverId: string, limit?: number) {
  const cache = healthMetricsCache.get(serverId) || [];
  
  if (!limit) {
    return cache;
  }

  return cache.slice(-limit);
}

/**
 * Get latest health status
 */
export function getLatestServerHealth(serverId: string) {
  const cache = healthMetricsCache.get(serverId);
  if (!cache || cache.length === 0) {
    return null;
  }

  return cache[cache.length - 1];
}

/**
 * Analyze health trends
 */
export function analyzeServerHealthTrends(serverId: string, hours: number = 1) {
  const metrics = getServerHealthHistory(serverId);
  if (metrics.length === 0) {
    return null;
  }

  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  const recentMetrics = metrics.filter((m) => m.timestamp > cutoffTime);

  if (recentMetrics.length === 0) {
    return null;
  }

  const avgFps =
    recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
  const avgCpu =
    recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length;
  const avgRam =
    recentMetrics.reduce((sum, m) => sum + m.ramUsage, 0) / recentMetrics.length;
  const avgPlayers =
    recentMetrics.reduce((sum, m) => sum + m.playerCount, 0) / recentMetrics.length;

  const unhealthyCount = recentMetrics.filter((m) => !m.isHealthy).length;
  const healthScore = ((recentMetrics.length - unhealthyCount) / recentMetrics.length) * 100;

  return {
    timeframe: `${hours}h`,
    metrics: recentMetrics.length,
    avgFps: Math.round(avgFps),
    avgCpu: Math.round(avgCpu),
    avgRam: Math.round(avgRam),
    avgPlayers: Math.round(avgPlayers),
    healthScore: Math.round(healthScore),
    trend: calculateTrend(recentMetrics.map((m) => m.fps)),
    issues: Array.from(
      new Set(recentMetrics.flatMap((m) => m.issues))
    ).slice(0, 5),
  };
}

/**
 * Calculate health trend (improving/declining)
 */
function calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
  if (values.length < 2) return 'stable';

  const firstHalf =
    values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) /
    Math.floor(values.length / 2);
  const secondHalf =
    values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) /
    (values.length - Math.floor(values.length / 2));

  const diff = ((secondHalf - firstHalf) / firstHalf) * 100;

  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/**
 * Check if auto-restart needed
 */
export async function checkAutoRestartNeeded(serverId: string) {
  const health = getLatestServerHealth(serverId);
  if (!health) return false;

  // Restart if FPS critically low or health score very bad
  const trends = analyzeServerHealthTrends(serverId, 1);
  if (trends && trends.healthScore < 20 && health.fps < 15) {
    logger.warn('Auto-restart recommended due to critical health issues', {
      serverId,
      healthScore: trends.healthScore,
      fps: health.fps,
    });
    return true;
  }

  return false;
}

export {};
