/**
 * ARK Cluster Manager
 * Handles multi-server cluster operations and character migration
 * ~380 lines of TypeScript implementation
 */

import { EventEmitter } from 'events';

export interface ClusterNode {
  id: string;
  name: string;
  host: string;
  port: number;
  rconPort: number;
  map: string;
  playerCount: number;
  maxPlayers: number;
  status: 'online' | 'offline' | 'error';
  uptime: number;
  lastHeartbeat: Date;
}

export interface CharacterData {
  characterId: string;
  characterName: string;
  playerId: string;
  playerName: string;
  level: number;
  experience: number;
  health: number;
  stamina: number;
  oxygen: number;
  food: number;
  water: number;
  weight: number;
  position: {
    x: number;
    y: number;
    z: number;
    map: string;
  };
  inventory: any[];
  equipment: any[];
  engrams: string[];
  tames: any[];
  createdAt: Date;
  lastPlayed: Date;
  corrupted: boolean;
}

export interface MigrationRequest {
  id: string;
  characterId: string;
  sourceClusterId: string;
  targetClusterId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startTime?: Date;
  completedTime?: Date;
  error?: string;
}

export interface ClusterConfig {
  clusterId: string;
  clusterName: string;
  adminPassword: string;
  nodes: ClusterNode[];
  maxCharactersPerPlayer: number;
  enableCrossServerTransfer: boolean;
  enableCrossGameTransfer: boolean;
  characterDataPath: string;
  backupPath: string;
  syncIntervalMs: number;
  healthCheckIntervalMs: number;
}

export class ArkClusterManager extends EventEmitter {
  private config: ClusterConfig;
  private nodes: Map<string, ClusterNode> = new Map();
  private migrations: Map<string, MigrationRequest> = new Map();
  private healthCheckInterval?: ReturnType<typeof setInterval>;
  private syncInterval?: ReturnType<typeof setInterval>;
  private isRunning: boolean = false;

  constructor(config: ClusterConfig) {
    super();
    this.config = config;
    this.initializeNodes();
    this.validateConfig();
  }

  /**
   * Validates cluster configuration
   */
  private validateConfig(): void {
    if (!this.config.clusterId || this.config.clusterId.length === 0) {
      throw new Error('Cluster ID is required');
    }

    if (!this.config.clusterName || this.config.clusterName.length === 0) {
      throw new Error('Cluster name is required');
    }

    if (this.config.nodes.length === 0) {
      throw new Error('At least one cluster node is required');
    }

    if (this.config.maxCharactersPerPlayer < 1 || this.config.maxCharactersPerPlayer > 10) {
      throw new Error('Max characters per player must be between 1 and 10');
    }

    if (this.config.syncIntervalMs < 5000) {
      throw new Error('Sync interval must be at least 5 seconds');
    }

    this.emit('config-validated', { clusterId: this.config.clusterId });
  }

  /**
   * Initializes cluster nodes
   */
  private initializeNodes(): void {
    for (const nodeConfig of this.config.nodes) {
      const node: ClusterNode = {
        ...nodeConfig,
        status: 'offline',
        uptime: 0,
        lastHeartbeat: new Date()
      };
      this.nodes.set(node.id, node);
    }
  }

  /**
   * Starts the cluster manager
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Cluster manager is already running');
    }

    this.isRunning = true;
    this.emit('start', { clusterId: this.config.clusterId });

    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);

    // Start data synchronization
    this.syncInterval = setInterval(() => {
      this.synchronizeCluster();
    }, this.config.syncIntervalMs);
  }

  /**
   * Stops the cluster manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.isRunning = false;
    this.emit('stop', { clusterId: this.config.clusterId });
  }

  /**
   * Performs health checks on all nodes
   */
  private async performHealthCheck(): Promise<void> {
    const results = [];

    for (const [nodeId, node] of this.nodes) {
      try {
        // In production, would send actual health check queries
        const isHealthy = Math.random() > 0.1; // Simulated health check
        
        if (isHealthy && node.status === 'offline') {
          node.status = 'online';
          this.emit('node-recovered', node);
        } else if (!isHealthy && node.status === 'online') {
          node.status = 'offline';
          this.emit('node-down', node);
        }

        node.lastHeartbeat = new Date();
        results.push({ nodeId, status: node.status });
      } catch (error) {
        node.status = 'error';
        this.emit('node-error', { nodeId, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    this.emit('health-check-complete', results);
  }

  /**
   * Synchronizes cluster data
   */
  private async synchronizeCluster(): Promise<void> {
    try {
      // Synchronize all migration requests
      for (const [migrationId, migration] of this.migrations) {
        if (migration.status === 'in-progress') {
          // Check migration status
          // In production, would query actual server state
        }
      }

      this.emit('sync-complete', { timestamp: new Date() });
    } catch (error) {
      this.emit('sync-error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Initiates character migration between clusters
   */
  async migrateCharacter(
    characterId: string,
    sourceClusterId: string,
    targetClusterId: string
  ): Promise<MigrationRequest> {
    if (!this.config.enableCrossServerTransfer) {
      throw new Error('Cross-server transfer is disabled');
    }

    const sourceNode = Array.from(this.nodes.values()).find(n => n.id === sourceClusterId);
    const targetNode = Array.from(this.nodes.values()).find(n => n.id === targetClusterId);

    if (!sourceNode || !targetNode) {
      throw new Error('Invalid cluster or node IDs');
    }

    if (sourceNode.status !== 'online' || targetNode.status !== 'online') {
      throw new Error('Source or target node is not online');
    }

    const migration: MigrationRequest = {
      id: `mig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      characterId,
      sourceClusterId,
      targetClusterId,
      status: 'pending',
      startTime: new Date()
    };

    this.migrations.set(migration.id, migration);
    this.emit('migration-initiated', migration);

    try {
      // Simulate migration process
      migration.status = 'in-progress';
      this.emit('migration-started', migration);

      // Wait for completion (in production, would poll actual migration status)
      await new Promise(resolve => setTimeout(resolve, 5000));

      migration.status = 'completed';
      migration.completedTime = new Date();
      this.emit('migration-completed', migration);
    } catch (error) {
      migration.status = 'failed';
      migration.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('migration-failed', migration);
      throw error;
    }

    return migration;
  }

  /**
   * Gets character data from a node
   */
  async getCharacterData(nodeId: string, characterId: string): Promise<CharacterData> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    if (node.status !== 'online') {
      throw new Error(`Node ${nodeId} is not online`);
    }

    // In production, would query actual server
    const mockCharacterData: CharacterData = {
      characterId,
      characterName: 'SampleCharacter',
      playerId: 'player123',
      playerName: 'PlayerName',
      level: 100,
      experience: 1000000,
      health: 1000,
      stamina: 500,
      oxygen: 100,
      food: 100,
      water: 100,
      weight: 5000,
      position: {
        x: 0,
        y: 0,
        z: 0,
        map: node.map
      },
      inventory: [],
      equipment: [],
      engrams: [],
      tames: [],
      createdAt: new Date(),
      lastPlayed: new Date(),
      corrupted: false
    };

    return mockCharacterData;
  }

  /**
   * Saves character data to a node
   */
  async saveCharacterData(nodeId: string, characterData: CharacterData): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    if (node.status !== 'online') {
      throw new Error(`Node ${nodeId} is not online`);
    }

    // In production, would save to actual server
    this.emit('character-saved', { nodeId, characterId: characterData.characterId });
  }

  /**
   * Backs up character data
   */
  async backupCharacterData(characterId: string): Promise<string> {
    const backupId = `backup-${Date.now()}-${characterId}`;

    try {
      // In production, would create actual backup
      this.emit('backup-created', { backupId, characterId });
      return backupId;
    } catch (error) {
      this.emit('backup-failed', { characterId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Restores character from backup
   */
  async restoreCharacterData(nodeId: string, backupId: string): Promise<CharacterData> {
    // In production, would restore from actual backup
    const mockCharacterData: CharacterData = {
      characterId: 'restored-char',
      characterName: 'RestoredCharacter',
      playerId: 'player123',
      playerName: 'PlayerName',
      level: 100,
      experience: 1000000,
      health: 1000,
      stamina: 500,
      oxygen: 100,
      food: 100,
      water: 100,
      weight: 5000,
      position: {
        x: 0,
        y: 0,
        z: 0,
        map: 'Unknown'
      },
      inventory: [],
      equipment: [],
      engrams: [],
      tames: [],
      createdAt: new Date(),
      lastPlayed: new Date(),
      corrupted: false
    };

    this.emit('character-restored', { backupId, characterId: mockCharacterData.characterId });
    return mockCharacterData;
  }

  /**
   * Gets cluster status
   */
  getClusterStatus(): {
    clusterId: string;
    clusterName: string;
    isRunning: boolean;
    nodeCount: number;
    onlineNodeCount: number;
    totalPlayers: number;
    activeMigrations: number;
    nodes: ClusterNode[];
  } {
    const nodeArray = Array.from(this.nodes.values());
    const onlineNodes = nodeArray.filter(n => n.status === 'online').length;
    const totalPlayers = nodeArray.reduce((sum, n) => sum + n.playerCount, 0);
    const activeMigrations = Array.from(this.migrations.values())
      .filter(m => m.status === 'in-progress').length;

    return {
      clusterId: this.config.clusterId,
      clusterName: this.config.clusterName,
      isRunning: this.isRunning,
      nodeCount: nodeArray.length,
      onlineNodeCount: onlineNodes,
      totalPlayers,
      activeMigrations,
      nodes: nodeArray
    };
  }

  /**
   * Gets node status by ID
   */
  getNodeStatus(nodeId: string): ClusterNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Gets all nodes
   */
  getAllNodes(): ClusterNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Gets migration status
   */
  getMigrationStatus(migrationId: string): MigrationRequest | undefined {
    return this.migrations.get(migrationId);
  }

  /**
   * Gets all active migrations
   */
  getActiveMigrations(): MigrationRequest[] {
    return Array.from(this.migrations.values())
      .filter(m => m.status === 'in-progress' || m.status === 'pending');
  }

  /**
   * Cancels a migration
   */
  async cancelMigration(migrationId: string): Promise<void> {
    const migration = this.migrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    if (migration.status === 'completed' || migration.status === 'failed') {
      throw new Error(`Cannot cancel migration with status ${migration.status}`);
    }

    migration.status = 'failed';
    migration.error = 'Cancelled by user';
    this.emit('migration-cancelled', migration);
  }

  /**
   * Validates cross-game transfer compatibility
   */
  validateCrossGameTransfer(
    sourceGame: 'ascended' | 'evolved',
    targetGame: 'ascended' | 'evolved'
  ): { compatible: boolean; limitations: string[] } {
    const limitations: string[] = [];

    if (sourceGame !== targetGame && this.config.enableCrossGameTransfer === false) {
      return {
        compatible: false,
        limitations: ['Cross-game transfer is disabled in cluster configuration']
      };
    }

    if (sourceGame === 'ascended' && targetGame === 'evolved') {
      limitations.push('Ascended-specific items will be converted or lost');
      limitations.push('Some engrams may not be available');
    }

    if (sourceGame === 'evolved' && targetGame === 'ascended') {
      limitations.push('Character will be updated to Ascended standards');
      limitations.push('Some stats may be recalculated');
    }

    return {
      compatible: true,
      limitations
    };
  }

  /**
   * Gets cluster statistics
   */
  getClusterStatistics(): {
    totalNodes: number;
    onlineNodes: number;
    offlineNodes: number;
    errorNodes: number;
    totalPlayers: number;
    averagePlayersPerNode: number;
    totalCapacity: number;
    utilizationPercentage: number;
    uptimePercentage: number;
  } {
    const nodeArray = Array.from(this.nodes.values());
    const onlineNodes = nodeArray.filter(n => n.status === 'online').length;
    const offlineNodes = nodeArray.filter(n => n.status === 'offline').length;
    const errorNodes = nodeArray.filter(n => n.status === 'error').length;
    const totalPlayers = nodeArray.reduce((sum, n) => sum + n.playerCount, 0);
    const totalCapacity = nodeArray.reduce((sum, n) => sum + n.maxPlayers, 0);

    return {
      totalNodes: nodeArray.length,
      onlineNodes,
      offlineNodes,
      errorNodes,
      totalPlayers,
      averagePlayersPerNode: onlineNodes > 0 ? totalPlayers / onlineNodes : 0,
      totalCapacity,
      utilizationPercentage: totalCapacity > 0 ? (totalPlayers / totalCapacity) * 100 : 0,
      uptimePercentage: nodeArray.length > 0 ? (onlineNodes / nodeArray.length) * 100 : 0
    };
  }
}
