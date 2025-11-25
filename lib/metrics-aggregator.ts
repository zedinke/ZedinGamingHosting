/**
 * Metrikák aggregálása és elemzése
 */

import { prisma } from './prisma';

export interface AggregatedMetrics {
  period: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  requestsByEndpoint: Record<string, number>;
  requestsByMethod: Record<string, number>;
}

/**
 * Metrikák aggregálása időszakra
 */
export async function aggregateMetrics(
  startTime: Date,
  endTime: Date
): Promise<AggregatedMetrics> {
  // Jelenleg a performance monitor in-memory adatokat használ
  // Később time-series DB-ből lehetne lekérdezni

  // TODO: Time-series DB integráció után implementálni
  return {
    period: `${startTime.toISOString()} - ${endTime.toISOString()}`,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 0,
    requestsByEndpoint: {},
    requestsByMethod: {},
  };
}

/**
 * Top endpointok lekérdezése
 */
export async function getTopEndpoints(limit: number = 10): Promise<
  Array<{
    endpoint: string;
    method: string;
    count: number;
    avgResponseTime: number;
    errorRate: number;
  }>
> {
  // TODO: Time-series DB integráció után implementálni
  return [];
}

