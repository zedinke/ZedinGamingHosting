/**
 * Performance monitoring rendszer
 */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;

  /**
   * Metrika hozzáadása
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Csak az utolsó N metrikát tartjuk meg
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Átlagos válaszidő lekérdezése
   */
  getAverageResponseTime(endpoint?: string, method?: string): number {
    let filtered = this.metrics;

    if (endpoint) {
      filtered = filtered.filter((m) => m.endpoint === endpoint);
    }

    if (method) {
      filtered = filtered.filter((m) => m.method === method);
    }

    if (filtered.length === 0) {
      return 0;
    }

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * Leglassabb endpointok
   */
  getSlowestEndpoints(limit: number = 10): Array<{ endpoint: string; method: string; avgDuration: number }> {
    const endpointMap = new Map<string, { count: number; totalDuration: number }>();

    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointMap.get(key) || { count: 0, totalDuration: 0 };
      endpointMap.set(key, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + metric.duration,
      });
    }

    return Array.from(endpointMap.entries())
      .map(([key, data]) => {
        const [method, endpoint] = key.split(' ', 2);
        return {
          endpoint,
          method,
          avgDuration: data.totalDuration / data.count,
        };
      })
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  /**
   * Hibaarány lekérdezése
   */
  getErrorRate(endpoint?: string): number {
    let filtered = this.metrics;

    if (endpoint) {
      filtered = filtered.filter((m) => m.endpoint === endpoint);
    }

    if (filtered.length === 0) {
      return 0;
    }

    const errors = filtered.filter((m) => m.statusCode >= 400).length;
    return errors / filtered.length;
  }

  /**
   * Metrikák törlése
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Összes metrika lekérdezése
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance middleware Next.js API route-okhoz
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  endpoint: string,
  method: string = 'GET'
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let statusCode = 200;

    try {
      const response = await handler(...args);
      
      if (response instanceof Response) {
        statusCode = response.status;
      }

      return response;
    } catch (error: any) {
      statusCode = error.statusCode || 500;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      performanceMonitor.recordMetric({
        endpoint,
        method,
        duration,
        statusCode,
        timestamp: new Date(),
      });
    }
  }) as T;
}

