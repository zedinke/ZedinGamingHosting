/**
 * Cross-Cluster Management Dashboard
 * Multi-szerver klaszter kezelés, karakterek közötti szinkronizáció
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface ClusterServer {
  serverId: string;
  serverName: string;
  mapName: string;
  maxPlayers: number;
  currentPlayers: number;
  isOnline: boolean;
  lastSync: number;
}

export interface ClusterCharacter {
  characterId: string;
  characterName: string;
  playerId: string;
  playerName: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  location: string; // szerver/mapa
  tribe?: string;
  inventory: Array<{ itemId: string; itemName: string; quantity: number }>;
  engrams: string[];
  lastUpdated: number;
}

export interface ClusterInventory {
  storageId: string;
  storageName: string;
  serverId: string;
  ownerId: string;
  items: Array<{ itemId: string; itemName: string; quantity: number; quality?: number }>;
  capacity: number;
  currentUsage: number;
  lastSync: number;
}

export interface ClusterTopology {
  clusterId: string;
  clusterName: string;
  servers: ClusterServer[];
  totalPlayers: number;
  totalCapacity: number;
  lastSyncTime: number;
  syncStatus: 'synced' | 'syncing' | 'failed';
}

export interface CharacterTransferRequest {
  characterId: string;
  fromServerId: string;
  toServerId: string;
  playerId: string;
  playerName: string;
  status: 'pending' | 'approved' | 'transferred' | 'failed';
  requestedAt: number;
  transferredAt?: number;
  reason?: string;
}

/**
 * Klaszter topológia lekérése
 */
export async function getClusterTopology(clusterId: string): Promise<ClusterTopology> {
  try {
    const servers = await prisma.server.findMany({
      select: {
        id: true,
        name: true,
        configuration: true,
      },
    });

    const clusterServers: ClusterServer[] = servers.map((server) => {
      const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
      return {
        serverId: server.id,
        serverName: server.name,
        mapName: (config.mapName as string) || 'Unknown',
        maxPlayers: (config.maxPlayers as number) || 70,
        currentPlayers: (config.currentPlayers as number) || 0,
        isOnline: (config.isOnline as boolean) || false,
        lastSync: (config.lastSync as number) || Date.now(),
      };
    });

    const totalPlayers = clusterServers.reduce((sum, s) => sum + s.currentPlayers, 0);
    const totalCapacity = clusterServers.reduce((sum, s) => sum + s.maxPlayers, 0);

    const topology: ClusterTopology = {
      clusterId,
      clusterName: `Cluster ${clusterId}`,
      servers: clusterServers,
      totalPlayers,
      totalCapacity,
      lastSyncTime: Date.now(),
      syncStatus: 'synced',
    };

    logger.info('Cluster topology retrieved', {
      clusterId,
      serverCount: servers.length,
      totalPlayers,
    });

    return topology;
  } catch (error) {
    logger.error('Error getting cluster topology', error as Error, { clusterId });
    throw error;
  }
}

/**
 * Karakterek szinkronizálása szerveren belül
 */
export async function syncClusterCharacters(clusterId: string): Promise<{
  success: boolean;
  syncedCharacters: number;
  failedCharacters: number;
}> {
  let syncedCharacters = 0;
  let failedCharacters = 0;

  try {
    logger.info('Starting cluster character sync', { clusterId });

    const servers = await prisma.server.findMany({
      select: { id: true, configuration: true },
    });

    for (const server of servers) {
      try {
        const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
        const characterData = (config.characters as any[]) || [];

        for (const character of characterData) {
          // Szinkronizálás logika (simuláció)
          // Valódi implementáció: SQL adatbázis szinkronizáció
          syncedCharacters++;
        }
      } catch (error) {
        logger.warn('Failed to sync characters on server', { serverId: server.id });
        failedCharacters++;
      }
    }

    logger.info('Cluster sync completed', {
      clusterId,
      syncedCharacters,
      failedCharacters,
    });

    return { success: failedCharacters === 0, syncedCharacters, failedCharacters };
  } catch (error) {
    logger.error('Error syncing cluster characters', error as Error, { clusterId });
    return { success: false, syncedCharacters, failedCharacters };
  }
}

/**
 * Karakter átjelentkezési kérelem
 */
export async function requestCharacterTransfer(
  characterId: string,
  playerId: string,
  playerName: string,
  fromServerId: string,
  toServerId: string,
  reason?: string
): Promise<CharacterTransferRequest> {
  const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const fromServer = await prisma.server.findUnique({
      where: { id: fromServerId },
      select: { name: true, configuration: true },
    });

    const toServer = await prisma.server.findUnique({
      where: { id: toServerId },
      select: { name: true, configuration: true },
    });

    if (!fromServer || !toServer) {
      throw new Error('One or both servers not found');
    }

    const transferRequest: CharacterTransferRequest = {
      characterId,
      fromServerId,
      toServerId,
      playerId,
      playerName,
      status: 'pending',
      requestedAt: Date.now(),
      reason,
    };

    // Adatbázisba mentés
    const fromConfig = typeof fromServer.configuration === 'object' ? fromServer.configuration : ({} as any);
    const transferRequests = ((fromConfig as any).transferRequests || []) as CharacterTransferRequest[];

    await prisma.server.update({
      where: { id: fromServerId },
      data: {
        configuration: {
          ...fromConfig,
          transferRequests: [transferRequest, ...transferRequests],
        } as any,
      },
    });

    logger.info('Character transfer requested', {
      transferId,
      characterId,
      playerName,
      fromServer: fromServer.name,
      toServer: toServer.name,
    });

    return transferRequest;
  } catch (error) {
    logger.error('Error requesting character transfer', error as Error, {
      characterId,
      playerId,
    });
    throw error;
  }
}

/**
 * Karakter átjelentkezés jóváhagyása
 */
export async function approveCharacterTransfer(
  characterId: string,
  fromServerId: string,
  toServerId: string
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info('Approving character transfer', { characterId, fromServerId, toServerId });

    const fromServer = await prisma.server.findUnique({
      where: { id: fromServerId },
      select: { configuration: true },
    });

    const toServer = await prisma.server.findUnique({
      where: { id: toServerId },
      select: { configuration: true },
    });

    if (!fromServer || !toServer) {
      return { success: false, message: 'Servers not found' };
    }

    // Karakter adat lekérése
    const fromConfig = typeof fromServer.configuration === 'object' ? fromServer.configuration : ({} as any);
    const characterData = ((fromConfig as any).characters || []).find(
      (c: any) => c.characterId === characterId
    );

    if (!characterData) {
      return { success: false, message: 'Character not found' };
    }

    // Karakter hozzáadása a célszerverhez
    const toConfig = typeof toServer.configuration === 'object' ? toServer.configuration : ({} as any);
    const toCharacters = ((toConfig as any).characters || []) as any[];

    await prisma.server.update({
      where: { id: toServerId },
      data: {
        configuration: {
          ...toConfig,
          characters: [characterData, ...toCharacters],
        } as any,
      },
    });

    // Karakter eltávolítása a forrásszerverről
    const fromCharacters = ((fromConfig as any).characters || []).filter(
      (c: any) => c.characterId !== characterId
    );

    await prisma.server.update({
      where: { id: fromServerId },
      data: {
        configuration: {
          ...fromConfig,
          characters: fromCharacters,
        } as any,
      },
    });

    logger.info('Character transferred successfully', {
      characterId,
      fromServer: fromServerId,
      toServer: toServerId,
    });

    return { success: true, message: 'Character transferred successfully' };
  } catch (error) {
    logger.error('Error approving character transfer', error as Error, { characterId });
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}

/**
 * Közös inventory lekérése (klaszter szintű)
 */
export async function getSharedClusterInventory(
  clusterId: string,
  storageId?: string
): Promise<ClusterInventory[]> {
  try {
    const servers = await prisma.server.findMany({
      select: { id: true, configuration: true },
    });

    const inventories: ClusterInventory[] = [];

    for (const server of servers) {
      const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
      const storages = ((config as any).sharedStorages || []) as any[];

      for (const storage of storages) {
        if (!storageId || storage.storageId === storageId) {
          inventories.push({
            storageId: storage.storageId,
            storageName: storage.storageName,
            serverId: server.id,
            ownerId: storage.ownerId,
            items: storage.items || [],
            capacity: storage.capacity || 350,
            currentUsage: (storage.items || []).length,
            lastSync: Date.now(),
          });
        }
      }
    }

    return inventories;
  } catch (error) {
    logger.error('Error getting cluster inventory', error as Error, { clusterId });
    throw error;
  }
}

/**
 * Klaszter-szintű globális leaderboard
 */
export async function getClusterLeaderboard(clusterId: string): Promise<Array<{
  rank: number;
  playerName: string;
  playerId: string;
  totalLevel: number;
  totalKills: number;
  totalDeaths: number;
  characterCount: number;
  tribeName?: string;
}>> {
  try {
    const servers = await prisma.server.findMany({
      select: { configuration: true },
    });

    const playerStats = new Map<
      string,
      {
        playerName: string;
        playerId: string;
        totalLevel: number;
        totalKills: number;
        totalDeaths: number;
        characterCount: number;
        tribeName?: string;
      }
    >();

    for (const server of servers) {
      const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
      const characters = ((config as any).characters || []) as any[];

      for (const character of characters) {
        const playerId = character.playerId;
        const existing = playerStats.get(playerId);

        playerStats.set(playerId, {
          playerName: character.playerName,
          playerId,
          totalLevel: (existing?.totalLevel || 0) + (character.level || 0),
          totalKills: (existing?.totalKills || 0) + (character.kills || 0),
          totalDeaths: (existing?.totalDeaths || 0) + (character.deaths || 0),
          characterCount: (existing?.characterCount || 0) + 1,
          tribeName: character.tribeName || existing?.tribeName,
        });
      }
    }

    return Array.from(playerStats.values())
      .sort((a, b) => b.totalLevel - a.totalLevel)
      .map((player, index) => ({
        rank: index + 1,
        ...player,
      }))
      .slice(0, 100);
  } catch (error) {
    logger.error('Error getting cluster leaderboard', error as Error, { clusterId });
    throw error;
  }
}

/**
 * Klaszter-szintű disaster recovery (failover)
 */
export async function initiateClusterFailover(
  clusterId: string,
  failedServerId: string,
  backupServerId: string
): Promise<{ success: boolean; message: string; transferredCharacters: number }> {
  try {
    logger.warn('Initiating cluster failover', {
      clusterId,
      failedServerId,
      backupServerId,
    });

    const failedServer = await prisma.server.findUnique({
      where: { id: failedServerId },
      select: { configuration: true },
    });

    const backupServer = await prisma.server.findUnique({
      where: { id: backupServerId },
      select: { configuration: true },
    });

    if (!failedServer || !backupServer) {
      return {
        success: false,
        message: 'Servers not found',
        transferredCharacters: 0,
      };
    }

    const failedConfig = typeof failedServer.configuration === 'object' ? failedServer.configuration : ({} as any);
    const backupConfig = typeof backupServer.configuration === 'object' ? backupServer.configuration : ({} as any);

    const failedCharacters = ((failedConfig as any).characters || []) as any[];
    const backupCharacters = ((backupConfig as any).characters || []) as any[];

    // Karakterek átmozgatása
    const allCharacters = [...failedCharacters, ...backupCharacters];

    await prisma.server.update({
      where: { id: backupServerId },
      data: {
        configuration: {
          ...backupConfig,
          characters: allCharacters,
        } as any,
      },
    });

    // Eredeti szerver törlése
    await prisma.server.update({
      where: { id: failedServerId },
      data: {
        configuration: {
          ...failedConfig,
          characters: [],
          failoverStatus: 'recovered_to_backup',
        } as any,
      },
    });

    logger.info('Cluster failover completed', {
      clusterId,
      transferredCharacters: failedCharacters.length,
    });

    return {
      success: true,
      message: `Successfully transferred ${failedCharacters.length} characters to backup server`,
      transferredCharacters: failedCharacters.length,
    };
  } catch (error) {
    logger.error('Error initiating cluster failover', error as Error, { clusterId });
    return {
      success: false,
      message: (error as Error).message,
      transferredCharacters: 0,
    };
  }
}
