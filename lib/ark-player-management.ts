/**
 * Player Management & Community Tools
 * Whitelist/blacklist kezelés, auto-ban system, tribe statistics, leaderboard
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface PlayerProfile {
  playerId: string;
  playerName: string;
  steamId: string;
  joinDate: number;
  lastSeen: number;
  totalPlayTime: number; // minutes
  isWhitelisted: boolean;
  isBlacklisted: boolean;
  reputation: number; // -100 to 100
  violations: number;
  warning?: string;
  bannedUntil?: number;
}

export interface PlayerStatistics {
  playerId: string;
  playerName: string;
  level: number;
  kills: number;
  deaths: number;
  kdRatio: number;
  tamedDinos: number;
  craftedItems: number;
  structuresBuilt: number;
  tribesJoined: number;
  totalPlayTime: number;
}

export interface TribeStatistics {
  tribeId: string;
  tribeName: string;
  leader: string;
  memberCount: number;
  totalKills: number;
  totalDeaths: number;
  avgKdRatio: number;
  level: number;
  structureCount: number;
  dinoCount: number;
  wealth: number; // Ingot/resources value
}

export interface BanRule {
  ruleId: string;
  playerId: string;
  playerName: string;
  steamId: string;
  banType: 'temporary' | 'permanent';
  reason: string;
  bannedBy: string;
  bannedAt: number;
  expiresAt?: number;
  appealed?: boolean;
  appealReason?: string;
}

export interface PlayerViolation {
  violationId: string;
  playerId: string;
  playerName: string;
  violationType:
    | 'chat_spam'
    | 'toxicity'
    | 'glitch_exploit'
    | 'griefing'
    | 'offline_raid'
    | 'name_violation'
    | 'other';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  reportedBy?: string;
  notes?: string;
  resolved: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
  category: 'kills' | 'level' | 'playtime' | 'wealth';
  tribe?: string;
}

/**
 * Játékos hozzáadása a whitelist-hez
 */
export async function addToWhitelist(
  serverId: string,
  steamId: string,
  playerName: string,
  allowedUntil?: number
): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    if (!server) return false;

    const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
    const whitelist = ((config as any).whitelist || []) as Array<{
      steamId: string;
      playerName: string;
      addedAt: number;
      allowedUntil?: number;
    }>;

    // Duplikátum ellenőrzés
    if (whitelist.some((w) => w.steamId === steamId)) {
      return false;
    }

    const whitelistEntry = {
      steamId,
      playerName,
      addedAt: Date.now(),
      allowedUntil,
    };

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          whitelist: [whitelistEntry, ...whitelist],
        } as any,
      },
    });

    logger.info('Player added to whitelist', { serverId, steamId, playerName });
    return true;
  } catch (error) {
    logger.error('Error adding to whitelist', error as Error, { serverId, steamId });
    return false;
  }
}

/**
 * Játékos eltávolítása a whitelist-ről
 */
export async function removeFromWhitelist(serverId: string, steamId: string): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    if (!server) return false;

    const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
    const whitelist = ((config as any).whitelist || []).filter((w: any) => w.steamId !== steamId);

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          whitelist,
        } as any,
      },
    });

    logger.info('Player removed from whitelist', { serverId, steamId });
    return true;
  } catch (error) {
    logger.error('Error removing from whitelist', error as Error, { serverId, steamId });
    return false;
  }
}

/**
 * Whitelist CSV/JSON importálása
 */
export async function importWhitelist(
  serverId: string,
  players: Array<{ steamId: string; playerName: string }>
): Promise<{ imported: number; failed: number }> {
  let imported = 0;
  let failed = 0;

  try {
    for (const player of players) {
      try {
        const success = await addToWhitelist(serverId, player.steamId, player.playerName);
        if (success) imported++;
        else failed++;
      } catch (error) {
        failed++;
      }
    }

    logger.info('Whitelist imported', { serverId, imported, failed });
    return { imported, failed };
  } catch (error) {
    logger.error('Error importing whitelist', error as Error, { serverId });
    return { imported, failed };
  }
}

/**
 * Blacklist hozzáadás (ban)
 */
export async function banPlayer(
  serverId: string,
  steamId: string,
  playerName: string,
  bannedBy: string,
  reason: string,
  banType: 'temporary' | 'permanent' = 'permanent',
  durationMinutes?: number
): Promise<BanRule> {
  const ruleId = `ban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const bannedAt = Date.now();
  const expiresAt = banType === 'temporary' ? bannedAt + (durationMinutes || 60) * 60 * 1000 : undefined;

  try {
    const banRule: BanRule = {
      ruleId,
      playerId: '',
      playerName,
      steamId,
      banType,
      reason,
      bannedBy,
      bannedAt,
      expiresAt,
    };

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : ({} as any);
    const banList = ((config as any).banList || []) as BanRule[];

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          banList: [banRule, ...banList],
        } as any,
      },
    });

    logger.warn('Player banned', {
      serverId,
      steamId,
      playerName,
      banType,
      reason,
      bannedBy,
    });

    return banRule;
  } catch (error) {
    logger.error('Error banning player', error as Error, { serverId, steamId });
    throw error;
  }
}

/**
 * Auto-ban rendszer: X sikertelen bejelentkezés = auto ban
 */
export async function autobanFailedLogins(
  serverId: string,
  maxAttempts: number = 5
): Promise<{ banCount: number; message: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : ({} as any);
    const failedLogins = ((config as any).failedLogins || new Map()) as Map<string, number>;

    let banCount = 0;
    const banList = ((config as any).banList || []) as BanRule[];

    for (const [steamId, attempts] of failedLogins.entries()) {
      if (attempts >= maxAttempts) {
        const alreadyBanned = banList.some((b) => b.steamId === steamId);
        if (!alreadyBanned) {
          const banRule = await banPlayer(
            serverId,
            steamId,
            `Player_${steamId}`,
            'SYSTEM',
            `Automatic ban: ${attempts} failed login attempts`,
            'temporary',
            24 * 60 // 24 hours
          );
          banCount++;
          failedLogins.delete(steamId);
        }
      }
    }

    if (banCount > 0) {
      await prisma.server.update({
        where: { id: serverId },
        data: {
          configuration: {
            ...config,
            failedLogins: Object.fromEntries(failedLogins),
          } as any,
        },
      });
    }

    return {
      banCount,
      message: `Auto-banned ${banCount} players for excessive failed login attempts`,
    };
  } catch (error) {
    logger.error('Error in auto-ban system', error as Error, { serverId });
    return { banCount: 0, message: 'Error executing auto-ban' };
  }
}

/**
 * Tribe statisztikák lekérése
 */
export async function getTribeStatistics(serverId: string): Promise<TribeStatistics[]> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : ({} as any);
    const tribes = ((config as any).tribes || []) as any[];

    return tribes.map((tribe) => ({
      tribeId: tribe.tribeId,
      tribeName: tribe.tribeName,
      leader: tribe.leader,
      memberCount: tribe.members?.length || 0,
      totalKills: tribe.kills || 0,
      totalDeaths: tribe.deaths || 0,
      avgKdRatio:
        (tribe.kills || 0) / Math.max(tribe.deaths || 1, 1) || 0,
      level: tribe.level || 0,
      structureCount: tribe.structures?.length || 0,
      dinoCount: tribe.dinos?.length || 0,
      wealth: (tribe.ingots || 0) + (tribe.crystals || 0) * 10,
    }));
  } catch (error) {
    logger.error('Error getting tribe statistics', error as Error, { serverId });
    throw error;
  }
}

/**
 * Globális leaderboard
 */
export async function getLeaderboard(
  serverId: string,
  category: 'kills' | 'level' | 'playtime' | 'wealth' = 'kills',
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : ({} as any);
    const characters = ((config as any).characters || []) as any[];

    const sorted = characters
      .map((char: any) => ({
        playerId: char.playerId,
        playerName: char.playerName,
        tribe: char.tribeName,
        value:
          category === 'kills'
            ? char.kills || 0
            : category === 'level'
              ? char.level || 0
              : category === 'playtime'
                ? char.playTime || 0
                : char.wealth || 0,
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, limit)
      .map((entry: any, index: number) => ({
        rank: index + 1,
        ...entry,
        category,
      }));

    return sorted;
  } catch (error) {
    logger.error('Error getting leaderboard', error as Error, { serverId });
    throw error;
  }
}

/**
 * Playver violation naplózása
 */
export async function reportPlayerViolation(
  serverId: string,
  playerId: string,
  playerName: string,
  violationType: PlayerViolation['violationType'],
  severity: 'low' | 'medium' | 'high',
  reportedBy?: string,
  notes?: string
): Promise<PlayerViolation> {
  const violationId = `vio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const violation: PlayerViolation = {
      violationId,
      playerId,
      playerName,
      violationType,
      severity,
      timestamp: Date.now(),
      reportedBy,
      notes,
      resolved: false,
    };

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : ({} as any);
    const violations = ((config as any).violations || []) as PlayerViolation[];

    // Auto-reputation system
    let reputationPenalty = 0;
    switch (severity) {
      case 'low':
        reputationPenalty = -5;
        break;
      case 'medium':
        reputationPenalty = -15;
        break;
      case 'high':
        reputationPenalty = -30;
        break;
    }

    // Auto-ban if reputation drops below -80
    const violationCount = violations.filter((v) => v.playerId === playerId && !v.resolved).length;
    if (violationCount >= 3 && severity === 'high') {
      await banPlayer(
        serverId,
        playerId,
        playerName,
        'SYSTEM',
        `Multiple violations: ${violationType}`,
        'temporary',
        24 * 60
      );
    }

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          violations: [violation, ...violations],
        } as any,
      },
    });

    logger.warn('Player violation reported', {
      serverId,
      playerId,
      playerName,
      violationType,
      severity,
    });

    return violation;
  } catch (error) {
    logger.error('Error reporting violation', error as Error, { serverId, playerId });
    throw error;
  }
}
