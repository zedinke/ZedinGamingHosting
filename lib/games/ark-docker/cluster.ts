/**
 * ARK Docker Cluster Management
 * Handles multi-server cluster synchronization via Docker volumes
 * Enables player character migration between servers
 */

import { join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';

export interface ClusterNode {
  serverId: string;
  gameType: 'ark-ascended' | 'ark-evolved';
  mapName: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'offline';
}

export interface PlayerCharacter {
  characterId: string;
  playerId: string;
  serverSource: string;
  characterData: Record<string, any>;
  migratedAt?: Date;
}

/**
 * ARK Cluster Manager - Handles multi-server clusters
 */
export class ArkClusterManager extends EventEmitter {
  private clusterDir: string;
  private clusterId: string;
  private nodes: Map<string, ClusterNode> = new Map();

  constructor(clusterDir: string, clusterId: string) {
    super();
    this.clusterDir = join(clusterDir, clusterId);
    this.clusterId = clusterId;
  }

  /**
   * Initialize cluster
   */
  async initialize(): Promise<void> {
    try {
      logger.info(`[ArkCluster] Initializing cluster: ${this.clusterId}`);

      // Create cluster directory structure
      await mkdir(this.clusterDir, { recursive: true });
      await mkdir(join(this.clusterDir, 'clusters'), { recursive: true });
      await mkdir(join(this.clusterDir, 'player-data'), { recursive: true });
      await mkdir(join(this.clusterDir, 'sync'), { recursive: true });

      // Create cluster metadata file
      const metadataPath = join(this.clusterDir, 'cluster.json');
      if (!existsSync(metadataPath)) {
        const metadata = {
          clusterId: this.clusterId,
          createdAt: new Date().toISOString(),
          nodes: [],
          syncInterval: 60000, // 1 minute
          lastSync: null,
        };
        await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      logger.info(`[ArkCluster] Cluster initialized: ${this.clusterId}`);
      this.emit('initialized');
    } catch (error: any) {
      logger.error(`[ArkCluster] Initialization failed`, error as Error);
      throw error;
    }
  }

  /**
   * Add a server node to the cluster
   */
  async addNode(node: ClusterNode): Promise<void> {
    try {
      logger.info(`[ArkCluster] Adding node to cluster: ${node.serverId}`);

      // Validate node configuration
      if (!node.serverId || !node.gameType || !node.mapName) {
        throw new Error('Missing required node configuration');
      }

      // Add to nodes map
      this.nodes.set(node.serverId, node);

      // Update metadata
      await this.updateMetadata();

      logger.info(`[ArkCluster] Node added: ${node.serverId}`);
      this.emit('node-added', node);
    } catch (error: any) {
      logger.error(`[ArkCluster] Failed to add node`, error as Error);
      throw error;
    }
  }

  /**
   * Remove a server node from the cluster
   */
  async removeNode(serverId: string): Promise<void> {
    try {
      logger.info(`[ArkCluster] Removing node from cluster: ${serverId}`);

      this.nodes.delete(serverId);

      // Update metadata
      await this.updateMetadata();

      logger.info(`[ArkCluster] Node removed: ${serverId}`);
      this.emit('node-removed', { serverId });
    } catch (error: any) {
      logger.error(`[ArkCluster] Failed to remove node`, error as Error);
      throw error;
    }
  }

  /**
   * Get all cluster nodes
   */
  getNodes(): ClusterNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Sync cluster data between servers
   */
  async syncClusterData(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`[ArkCluster] Syncing cluster data: ${this.clusterId}`);

      const clustersPath = join(this.clusterDir, 'clusters');
      const nodes = this.getNodes();

      // Copy cluster data from each node's container
      for (const node of nodes) {
        try {
          const nodeClusterPath = join(clustersPath, node.serverId);
          await mkdir(nodeClusterPath, { recursive: true });

          // Copy from container volume
          const command = `docker run --rm -v ark-cluster:/cluster -v ${nodeClusterPath}:/backup alpine cp -r /cluster/* /backup/`;
          execSync(command, { stdio: 'pipe' });

          logger.info(`[ArkCluster] Synced data for node: ${node.serverId}`);
        } catch (error: any) {
          logger.warn(`[ArkCluster] Failed to sync node ${node.serverId}: ${error.message}`);
        }
      }

      // Update last sync time
      await this.updateMetadata();

      logger.info(`[ArkCluster] Cluster data sync completed`);
      this.emit('sync-completed');

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(`[ArkCluster] Sync failed`, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Migrate player character to another server
   */
  async migrateCharacter(
    characterId: string,
    sourceServer: string,
    targetServer: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(
        `[ArkCluster] Migrating character ${characterId} from ${sourceServer} to ${targetServer}`
      );

      // Verify both servers are in cluster
      if (!this.nodes.has(sourceServer) || !this.nodes.has(targetServer)) {
        throw new Error('Source or target server not found in cluster');
      }

      const playerDataPath = join(this.clusterDir, 'player-data', characterId);

      // Export character data from source server
      const sourceNode = this.nodes.get(sourceServer)!;
      const characterData = await this.exportCharacter(characterId, sourceNode);

      // Save character data
      await mkdir(playerDataPath, { recursive: true });
      await writeFile(
        join(playerDataPath, 'character.json'),
        JSON.stringify(characterData, null, 2)
      );

      // Import character data to target server
      const targetNode = this.nodes.get(targetServer)!;
      await this.importCharacter(characterId, characterData, targetNode);

      // Record migration
      const migrationRecord = {
        characterId,
        sourceServer,
        targetServer,
        migratedAt: new Date().toISOString(),
      };

      const syncPath = join(this.clusterDir, 'sync', `${characterId}.json`);
      await writeFile(syncPath, JSON.stringify(migrationRecord, null, 2));

      logger.info(
        `[ArkCluster] Character migrated successfully: ${characterId}`
      );
      this.emit('character-migrated', migrationRecord);

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(
        `[ArkCluster] Character migration failed for ${characterId}`,
        error as Error
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Export player character from server
   */
  private async exportCharacter(
    characterId: string,
    node: ClusterNode
  ): Promise<Record<string, any>> {
    try {
      logger.info(`[ArkCluster] Exporting character ${characterId} from ${node.serverId}`);

      // In production, this would read actual character save files from the container
      // For now, we return a template structure
      const characterData = {
        characterId,
        serverId: node.serverId,
        exportedAt: new Date().toISOString(),
        level: 0,
        experience: 0,
        tribe: '',
        inventory: [],
        attributes: {},
        engrams: [],
        // In production, read from actual save file
      };

      return characterData;
    } catch (error: any) {
      logger.error(`[ArkCluster] Failed to export character ${characterId}`, error as Error);
      throw error;
    }
  }

  /**
   * Import player character to server
   */
  private async importCharacter(
    characterId: string,
    characterData: Record<string, any>,
    node: ClusterNode
  ): Promise<void> {
    try {
      logger.info(`[ArkCluster] Importing character ${characterId} to ${node.serverId}`);

      // In production, this would write character data to container volumes
      // For now, we log the operation
      logger.info(
        `[ArkCluster] Character ${characterId} ready for import on ${node.serverId}`
      );
    } catch (error: any) {
      logger.error(
        `[ArkCluster] Failed to import character ${characterId} to ${node.serverId}`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Update cluster metadata
   */
  private async updateMetadata(): Promise<void> {
    try {
      const metadataPath = join(this.clusterDir, 'cluster.json');

      const metadata = {
        clusterId: this.clusterId,
        createdAt: new Date().toISOString(),
        nodes: Array.from(this.nodes.values()),
        syncInterval: 60000,
        lastSync: new Date().toISOString(),
      };

      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error: any) {
      logger.error('[ArkCluster] Failed to update metadata', error as Error);
    }
  }

  /**
   * Get cluster status
   */
  async getStatus(): Promise<{
    clusterId: string;
    nodeCount: number;
    nodes: ClusterNode[];
    lastSync?: string;
  }> {
    try {
      const metadataPath = join(this.clusterDir, 'cluster.json');

      let lastSync: string | undefined;
      if (existsSync(metadataPath)) {
        const metadata = JSON.parse(
          await readFile(metadataPath, 'utf-8')
        );
        lastSync = metadata.lastSync;
      }

      return {
        clusterId: this.clusterId,
        nodeCount: this.nodes.size,
        nodes: Array.from(this.nodes.values()),
        lastSync,
      };
    } catch (error: any) {
      logger.error('[ArkCluster] Failed to get status', error as Error);
      throw error;
    }
  }
}
