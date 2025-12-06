/**
 * Real-time Event Logging & Analytics System
 * Játékos események, admin akciók, performance metrics historikum
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export type EventType =
  | 'player_kill'
  | 'player_death'
  | 'player_tamed'
  | 'player_craft'
  | 'player_joined'
  | 'player_left'
  | 'tribe_created'
  | 'tribe_disbanded'
  | 'tribe_member_join'
  | 'tribe_member_leave'
  | 'admin_ban'
  | 'admin_kick'
  | 'admin_command'
  | 'admin_config_change'
  | 'server_crash'
  | 'server_start'
  | 'server_stop'
  | 'performance_lag'
  | 'performance_critical';

export interface GameEvent {
  eventId: string;
  serverId: string;
  eventType: EventType;
  timestamp: number;
  playerId?: string;
  playerName?: string;
  tribeId?: string;
  tribeName?: string;
  metadata: Record<string, any>; // Esemény-specifikus adatok
  location?: { x: number; y: number; z: number };
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceMetrics {
  timestamp: number;
  serverId: string;
  fps: number;
  cpuUsage: number;
  ramUsage: number;
  playerCount: number;
  maxPlayers: number;
  structures: number;
  dinos: number;
  lag: number;
}

export interface AdminAuditLog {
  auditId: string;
  serverId: string;
  adminId: string;
  adminName: string;
  action: string;
  targetPlayerId?: string;
  targetTribeId?: string;
  changes?: Record<string, { before: any; after: any }>;
  timestamp: number;
  ipAddress: string;
}

export interface EventStatistics {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  topPlayers: Array<{ playerId: string; playerName: string; eventCount: number }>;
  topTribes: Array<{ tribeId: string; tribeName: string; eventCount: number }>;
  killDeathRatios: Array<{ playerId: string; kills: number; deaths: number; ratio: number }>;
  activityTimeline: Array<{ hour: number; eventCount: number }>;
}

/**
 * Játékos esemény naplózása
 */
export async function logGameEvent(event: Omit<GameEvent, 'eventId' | 'timestamp'>): Promise<GameEvent> {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const eventWithMeta: GameEvent = {
    ...event,
    eventId,
    timestamp: Date.now(),
  };

  try {
    // Redis-ben tárolás real-time streamhez
    await redis.xadd(
      `events:${event.serverId}`,
      '*',
      'data',
      JSON.stringify(eventWithMeta),
      'type',
      event.eventType
    );

    // Adatbázisba mentés
    const server = await prisma.server.findUnique({
      where: { id: event.serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : {};
    const eventHistory = ((config as any)?.eventHistory || []) as GameEvent[];

    await prisma.server.update({
      where: { id: event.serverId },
      data: {
        configuration: {
          ...config,
          eventHistory: [eventWithMeta as any, ...eventHistory.slice(0, 9999)], // Keep last 10k
        } as any,
      },
    });

    logger.info('Game event logged', {
      eventId,
      eventType: event.eventType,
      serverId: event.serverId,
    });

    return eventWithMeta;
  } catch (error) {
    logger.error('Error logging game event', error as Error, { eventId });
    throw error;
  }
}

/**
 * Admin audit naplózása
 */
export async function logAdminAction(
  serverId: string,
  adminId: string,
  adminName: string,
  action: string,
  targetPlayerId?: string,
  changes?: Record<string, { before: any; after: any }>,
  ipAddress: string = '0.0.0.0'
): Promise<AdminAuditLog> {
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const auditLog: AdminAuditLog = {
      auditId,
      serverId,
      adminId,
      adminName,
      action,
      targetPlayerId,
      changes,
      timestamp: Date.now(),
      ipAddress,
    };

    // Redis-ben tárolás
    await redis.xadd(
      `audit:${serverId}`,
      '*',
      'data',
      JSON.stringify(auditLog)
    );

    // Adatbázisba
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : {};
    const auditHistory = ((config as any)?.auditHistory || []) as AdminAuditLog[];

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          auditHistory: [auditLog as any, ...(auditHistory.slice(0, 4999) as any[])], // Keep last 5k
        } as any,
      },
    });

    logger.info('Admin action logged', {
      auditId,
      adminName,
      action,
      targetPlayerId,
      serverId,
    });

    return auditLog;
  } catch (error) {
    logger.error('Error logging admin action', error as Error, { serverId, adminName });
    throw error;
  }
}

/**
 * Performance metrics naplózása
 */
export async function recordPerformanceMetrics(
  metrics: Omit<PerformanceMetrics, 'timestamp'>
): Promise<PerformanceMetrics> {
  const fullMetrics: PerformanceMetrics = {
    ...metrics,
    timestamp: Date.now(),
  };

  try {
    // Redis-ben tárolás
    await redis.xadd(
      `metrics:${metrics.serverId}`,
      '*',
      'data',
      JSON.stringify(fullMetrics)
    );

    // Adatbázisba
    const server = await prisma.server.findUnique({
      where: { id: metrics.serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : {};
    const metricsHistory = ((config as any)?.metricsHistory || []) as PerformanceMetrics[];

    // Keep last 288 entries (24h @ 5-min intervals)
    await prisma.server.update({
      where: { id: metrics.serverId },
      data: {
        configuration: {
          ...config,
          metricsHistory: [fullMetrics, ...metricsHistory.slice(0, 287)],
          latestMetrics: fullMetrics,
        } as any,
      },
    });

    return fullMetrics;
  } catch (error) {
    logger.error('Error recording performance metrics', error as Error, {
      serverId: metrics.serverId,
    });
    throw error;
  }
}

/**
 * Esemény statisztikák lekérése
 */
export async function getEventStatistics(
  serverId: string,
  timeWindowHours: number = 24
): Promise<EventStatistics> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const eventHistory = ((server?.configuration as any)?.eventHistory || []) as GameEvent[];
    const cutoffTime = Date.now() - timeWindowHours * 60 * 60 * 1000;

    const recentEvents = eventHistory.filter((e) => e.timestamp >= cutoffTime);

    // Statisztikák számítása
    const eventsByType: Record<EventType, number> = {} as Record<EventType, number>;
    const playerKills = new Map<string, number>();
    const playerDeaths = new Map<string, number>();
    const tribeEventCounts = new Map<string, number>();
    const hourlyActivity = new Map<number, number>();

    for (const event of recentEvents) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

      if (event.eventType === 'player_kill' && event.playerId) {
        playerKills.set(event.playerId, (playerKills.get(event.playerId) || 0) + 1);
      }
      if (event.eventType === 'player_death' && event.playerId) {
        playerDeaths.set(event.playerId, (playerDeaths.get(event.playerId) || 0) + 1);
      }
      if (event.tribeId) {
        tribeEventCounts.set(event.tribeId, (tribeEventCounts.get(event.tribeId) || 0) + 1);
      }

      const hour = new Date(event.timestamp).getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    }

    // Top játékosok
    const topPlayers = Array.from(
      new Map<string, { playerId: string; playerName: string; eventCount: number }>([
        ...recentEvents
          .filter((e) => e.playerId)
          .reduce((map, e) => {
            const key = e.playerId!;
            map.set(key, {
              playerId: key,
              playerName: e.playerName || 'Unknown',
              eventCount: (map.get(key)?.eventCount || 0) + 1,
            });
            return map;
          }, new Map()),
      ]).values()
    )
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Top törzsek
    const topTribes = Array.from(
      new Map<string, { tribeId: string; tribeName: string; eventCount: number }>([
        ...recentEvents
          .filter((e) => e.tribeId)
          .reduce((map, e) => {
            const key = e.tribeId!;
            map.set(key, {
              tribeId: key,
              tribeName: e.tribeName || 'Unknown Tribe',
              eventCount: tribeEventCounts.get(key) || 0,
            });
            return map;
          }, new Map()),
      ]).values()
    )
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Kill/Death arányok
    const killDeathRatios = Array.from(playerKills.keys())
      .map((playerId) => ({
        playerId,
        kills: playerKills.get(playerId) || 0,
        deaths: playerDeaths.get(playerId) || 0,
        ratio: (playerKills.get(playerId) || 0) / Math.max(playerDeaths.get(playerId) || 1, 1),
      }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);

    const activityTimeline = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      eventCount: hourlyActivity.get(i) || 0,
    }));

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      topPlayers,
      topTribes,
      killDeathRatios,
      activityTimeline,
    };
  } catch (error) {
    logger.error('Error getting event statistics', error as Error, { serverId });
    throw error;
  }
}

/**
 * Real-time event stream (WebSocket támogatás)
 */
export async function subscribeToEvents(
  serverId: string,
  callback: (event: GameEvent) => void
): Promise<() => void> {
  const streamName = `events:${serverId}`;
  const consumerGroup = `consumer_${Date.now()}`;

  try {
    // Redis stream consumer setup
    await redis.xgroup('CREATE', streamName, consumerGroup, '$', 'MKSTREAM');
  } catch (error) {
    // Group már létezik
  }

  const pollInterval = setInterval(async () => {
    try {
      const messages = await redis.xreadgroup(
        'GROUP',
        consumerGroup,
        `client_${Date.now()}`,
        'COUNT',
        '10',
        'STREAMS',
        streamName,
        '>'
      );

      if (messages && Array.isArray(messages)) {
        for (const [, msgList] of (messages as any)) {
          if (Array.isArray(msgList)) {
            for (const [, data] of (msgList as any)) {
              if (Array.isArray(data)) {
                const idx = data.indexOf('data');
                if (idx !== -1) {
                  const eventData = JSON.parse(data[idx + 1]);
                  callback(eventData);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Error polling events', { serverId });
    }
  }, 1000);

  return () => clearInterval(pollInterval);
}

/**
 * Exportálás CSV/JSON formátumban
 */
export async function exportEventsTelemetry(
  serverId: string,
  format: 'csv' | 'json' = 'json'
): Promise<string> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const eventHistory = ((server?.configuration as any)?.eventHistory || []) as GameEvent[];

    if (format === 'json') {
      return JSON.stringify(eventHistory, null, 2);
    }

    // CSV export
    const csvHeader = [
      'eventId',
      'timestamp',
      'eventType',
      'playerId',
      'playerName',
      'tribeId',
      'tribeName',
      'severity',
      'metadata',
    ].join(',');

    const csvRows = eventHistory.map((e) =>
      [
        e.eventId,
        new Date(e.timestamp).toISOString(),
        e.eventType,
        e.playerId || '',
        e.playerName || '',
        e.tribeId || '',
        e.tribeName || '',
        e.severity || '',
        JSON.stringify(e.metadata),
      ].map((v) => `"${v}"`).join(',')
    );

    return [csvHeader, ...csvRows].join('\n');
  } catch (error) {
    logger.error('Error exporting telemetry', error as Error, { serverId });
    throw error;
  }
}
