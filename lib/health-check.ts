/**
 * Health check rendszer
 */

import { prisma } from './prisma';
import { performanceMonitor } from './performance-monitor';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: { status: 'ok' | 'error'; latency?: number };
    cache: { status: 'ok' | 'error'; size: number };
    performance: { status: 'ok' | 'warning' | 'error'; avgResponseTime: number; errorRate: number };
  };
  timestamp: Date;
}

/**
 * Health check végrehajtása
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {
    database: { status: 'error' },
    cache: { status: 'error', size: 0 },
    performance: { status: 'error', avgResponseTime: 0, errorRate: 0 },
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';

  // Database check
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    checks.database = { status: 'ok', latency };
  } catch (error) {
    checks.database = { status: 'error' };
  }

  // Cache check
  try {
    const stats = performanceMonitor.getAllMetrics();
    checks.cache = { status: 'ok', size: stats.length };
  } catch (error) {
    checks.cache = { status: 'error', size: 0 };
  }

  // Performance check
  try {
    const avgResponseTime = performanceMonitor.getAverageResponseTime();
    const errorRate = performanceMonitor.getErrorRate();

    if (avgResponseTime < 500 && errorRate < 0.01) {
      checks.performance = { status: 'ok', avgResponseTime, errorRate };
    } else if (avgResponseTime < 1000 && errorRate < 0.05) {
      checks.performance = { status: 'warning', avgResponseTime, errorRate };
    } else {
      checks.performance = { status: 'error', avgResponseTime, errorRate };
    }
  } catch (error) {
    checks.performance = { status: 'error', avgResponseTime: 0, errorRate: 0 };
  }

  // Overall status meghatározása
  const errorCount = [
    checks.database.status,
    checks.cache.status,
    checks.performance.status,
  ].filter((s) => s === 'error').length;

  const warningCount = [
    checks.database.status,
    checks.cache.status,
    checks.performance.status,
  ].filter((s) => s === 'warning').length;

  if (errorCount === 0 && warningCount === 0) {
    overallStatus = 'healthy';
  } else if (errorCount === 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'unhealthy';
  }

  return {
    status: overallStatus,
    checks,
    timestamp: new Date(),
  };
}

