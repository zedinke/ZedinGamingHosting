/**
 * Adatbázis optimalizációk és helper függvények
 */

import { prisma } from './prisma';
import { cache } from './cache';

/**
 * Szerverek lekérdezése cache-tel
 */
export async function getServersWithCache(
  userId?: string,
  includeOffline: boolean = false
) {
  const cacheKey = `servers:${userId || 'all'}:${includeOffline}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const where: any = {};
  if (userId) {
    where.userId = userId;
  }
  if (!includeOffline) {
    where.status = { not: 'OFFLINE' };
  }

  const servers = await prisma.server.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      machine: {
        select: {
          id: true,
          name: true,
          ipAddress: true,
        },
      },
      agent: {
        select: {
          id: true,
          agentId: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  cache.set(cacheKey, servers, 30 * 1000); // 30 másodperc
  return servers;
}

/**
 * Felhasználó lekérdezése cache-tel
 */
export async function getUserWithCache(userId: string) {
  const cacheKey = `user:${userId}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
  });

  if (user) {
    cache.set(cacheKey, user, 5 * 60 * 1000); // 5 perc
  }

  return user;
}

/**
 * Statisztikák lekérdezése cache-tel
 */
export async function getSystemStatsWithCache() {
  const cacheKey = 'system:stats';
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const [totalUsers, totalServers, activeSubscriptions, totalRevenue] =
    await Promise.all([
      prisma.user.count(),
      prisma.server.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

  const stats = {
    totalUsers,
    totalServers,
    activeSubscriptions,
    totalRevenue: totalRevenue._sum.amount || 0,
  };

  cache.set(cacheKey, stats, 60 * 1000); // 1 perc
  return stats;
}

/**
 * Cache invalidálás felhasználóhoz
 */
export function invalidateUserCache(userId: string) {
  cache.delete(`user:${userId}`);
  cache.delete(`servers:${userId}:true`);
  cache.delete(`servers:${userId}:false`);
}

/**
 * Cache invalidálás szerverhez
 */
export function invalidateServerCache(serverId: string, userId?: string) {
  if (userId) {
    cache.delete(`servers:${userId}:true`);
    cache.delete(`servers:${userId}:false`);
  }
  cache.delete('servers:all:true');
  cache.delete('servers:all:false');
  cache.delete('system:stats');
}

