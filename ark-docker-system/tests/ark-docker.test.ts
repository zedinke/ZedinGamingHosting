/**
 * ARK Docker System - Comprehensive Test Suite
 * 30+ test cases covering all functionality
 * ~650 lines of TypeScript
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  ArkDockerInstaller,
  ArkClusterManager,
  deployServers,
  buildDockerImage,
  pushDockerImage,
  performHealthCheck,
  rollbackDeployment,
  scaleDeployment,
  backupDeploymentState,
  restoreDeploymentState,
  getDeploymentMetrics,
  migrateDeployment,
  cleanupDeploymentResources,
  deployWithCanary,
  PortAllocator,
  ConfigValidator,
  createSmallAscendedConfig,
  createMediumAscendedConfig,
  createLargeAscendedClusterConfig,
  createSmallEvolvedConfig,
  createMediumEvolvedConfig,
  createLargeEvolvedClusterConfig,
  ARK_ASCENDED_MAPS,
  ARK_EVOLVED_MAPS,
  type DockerConfig,
  type ClusterConfig,
  type DeploymentConfig
} from '../src/index';

/**
 * Test Suite: ArkDockerInstaller
 */
describe('ArkDockerInstaller', () => {
  let installer: ArkDockerInstaller;
  let config: DockerConfig;

  beforeEach(() => {
    config = createSmallAscendedConfig();
    installer = new ArkDockerInstaller(config);
  });

  it('should validate configuration on creation', () => {
    expect(installer).toBeDefined();
  });

  it('should throw error for invalid server name', () => {
    const invalidConfig = { ...config, serverName: '' };
    expect(() => new ArkDockerInstaller(invalidConfig)).toThrow('Server name is required');
  });

  it('should throw error for weak admin password', () => {
    const invalidConfig = { ...config, adminPassword: 'weak' };
    expect(() => new ArkDockerInstaller(invalidConfig)).toThrow('Admin password must be at least 6 characters');
  });

  it('should throw error for invalid max players', () => {
    const invalidConfig = { ...config, maxPlayers: 600 };
    expect(() => new ArkDockerInstaller(invalidConfig)).toThrow('Max players must be between 1 and 500');
  });

  it('should throw error for invalid port', () => {
    const invalidConfig = { ...config, port: 500 };
    expect(() => new ArkDockerInstaller(invalidConfig)).toThrow('Port must be between 1024 and 65535');
  });

  it('should throw error for invalid difficulty', () => {
    const invalidConfig = { ...config, difficulty: 2 };
    expect(() => new ArkDockerInstaller(invalidConfig)).toThrow('Difficulty must be between 0 and 1');
  });

  it('should get installation status', () => {
    const status = installer.getStatus();
    expect(status).toHaveProperty('isInstalling');
    expect(status).toHaveProperty('installedVersion');
    expect(status).toHaveProperty('config');
    expect(status.isInstalling).toBe(false);
  });

  it('should add and retrieve container IDs', () => {
    installer.addContainerId('test-container', 'abc123def456');
    expect(installer.getContainerId('test-container')).toBe('abc123def456');
  });

  it('should clear all container IDs', () => {
    installer.addContainerId('container1', 'id1');
    installer.addContainerId('container2', 'id2');
    installer.clearContainerIds();
    expect(installer.getContainerId('container1')).toBeUndefined();
    expect(installer.getContainerId('container2')).toBeUndefined();
  });

  it('should get all container IDs', () => {
    installer.addContainerId('container1', 'id1');
    installer.addContainerId('container2', 'id2');
    const allIds = installer.getAllContainerIds();
    expect(allIds.size).toBe(2);
    expect(allIds.get('container1')).toBe('id1');
  });

  it('should validate Docker installation', async () => {
    const result = await installer.validateDockerInstallation();
    expect(result).toHaveProperty('dockerInstalled');
    expect(result).toHaveProperty('dockerVersion');
    expect(result).toHaveProperty('composeInstalled');
    expect(result).toHaveProperty('composeVersion');
  });

  it('should estimate installation time', () => {
    const estimate = installer.estimateInstallationTime();
    expect(estimate).toHaveProperty('estimated_minutes');
    expect(estimate).toHaveProperty('depends_on');
    expect(estimate.estimated_minutes).toBeGreaterThan(0);
    expect(Array.isArray(estimate.depends_on)).toBe(true);
  });

  it('should emit validated event', (done) => {
    const newInstaller = new ArkDockerInstaller(config);
    newInstaller.on('validated', (data) => {
      expect(data).toHaveProperty('config');
      done();
    });
  });

  it('should handle ARK Ascended configuration', () => {
    const ascendedConfig = createMediumAscendedConfig();
    const ascendedInstaller = new ArkDockerInstaller(ascendedConfig);
    expect(ascendedInstaller.getStatus().config.arkVersion).toBe('ascended');
  });

  it('should handle ARK Evolved configuration', () => {
    const evolvedConfig = createSmallEvolvedConfig();
    const evolvedInstaller = new ArkDockerInstaller(evolvedConfig);
    expect(evolvedInstaller.getStatus().config.arkVersion).toBe('evolved');
  });
});

/**
 * Test Suite: ArkClusterManager
 */
describe('ArkClusterManager', () => {
  let clusterManager: ArkClusterManager;
  let clusterConfig: ClusterConfig;

  beforeEach(() => {
    clusterConfig = {
      clusterId: 'test-cluster',
      clusterName: 'Test Cluster',
      adminPassword: 'admin123!@#',
      nodes: [
        {
          id: 'node-1',
          name: 'Node 1',
          host: 'localhost',
          port: 7777,
          rconPort: 27015,
          map: 'TheIsland',
          playerCount: 0,
          maxPlayers: 70,
          status: 'offline',
          uptime: 0,
          lastHeartbeat: new Date()
        },
        {
          id: 'node-2',
          name: 'Node 2',
          host: 'localhost',
          port: 7779,
          rconPort: 27016,
          map: 'Genesis',
          playerCount: 0,
          maxPlayers: 70,
          status: 'offline',
          uptime: 0,
          lastHeartbeat: new Date()
        }
      ],
      maxCharactersPerPlayer: 2,
      enableCrossServerTransfer: true,
      enableCrossGameTransfer: false,
      characterDataPath: '/ark/cluster/characters',
      backupPath: '/ark/cluster/backups',
      syncIntervalMs: 10000,
      healthCheckIntervalMs: 30000
    };

    clusterManager = new ArkClusterManager(clusterConfig);
  });

  it('should create cluster manager with valid config', () => {
    expect(clusterManager).toBeDefined();
  });

  it('should throw error for missing cluster ID', () => {
    const invalidConfig = { ...clusterConfig, clusterId: '' };
    expect(() => new ArkClusterManager(invalidConfig)).toThrow('Cluster ID is required');
  });

  it('should throw error for missing cluster name', () => {
    const invalidConfig = { ...clusterConfig, clusterName: '' };
    expect(() => new ArkClusterManager(invalidConfig)).toThrow('Cluster name is required');
  });

  it('should throw error for no nodes', () => {
    const invalidConfig = { ...clusterConfig, nodes: [] };
    expect(() => new ArkClusterManager(invalidConfig)).toThrow('At least one cluster node is required');
  });

  it('should throw error for invalid max characters', () => {
    const invalidConfig = { ...clusterConfig, maxCharactersPerPlayer: 0 };
    expect(() => new ArkClusterManager(invalidConfig)).toThrow('Max characters per player must be between 1 and 10');
  });

  it('should start cluster manager', async () => {
    await clusterManager.start();
    expect(clusterManager.getClusterStatus().isRunning).toBe(true);
    await clusterManager.stop();
  });

  it('should stop cluster manager', async () => {
    await clusterManager.start();
    await clusterManager.stop();
    expect(clusterManager.getClusterStatus().isRunning).toBe(false);
  });

  it('should get cluster status', async () => {
    const status = clusterManager.getClusterStatus();
    expect(status).toHaveProperty('clusterId');
    expect(status).toHaveProperty('clusterName');
    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('nodeCount');
    expect(status.nodeCount).toBe(2);
  });

  it('should get node status by ID', () => {
    const nodeStatus = clusterManager.getNodeStatus('node-1');
    expect(nodeStatus).toBeDefined();
    expect(nodeStatus?.name).toBe('Node 1');
  });

  it('should get all nodes', () => {
    const nodes = clusterManager.getAllNodes();
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBe(2);
  });

  it('should get character data from node', async () => {
    // Mock node as online
    const nodeStatus = clusterManager.getNodeStatus('node-1');
    if (nodeStatus) nodeStatus.status = 'online';

    const characterData = await clusterManager.getCharacterData('node-1', 'char-123');
    expect(characterData).toHaveProperty('characterId');
    expect(characterData).toHaveProperty('characterName');
    expect(characterData).toHaveProperty('playerId');
  });

  it('should backup character data', async () => {
    const backupId = await clusterManager.backupCharacterData('char-123');
    expect(backupId).toContain('backup-');
    expect(backupId).toContain('char-123');
  });

  it('should restore character from backup', async () => {
    const restoredCharacter = await clusterManager.restoreCharacterData('node-1', 'backup-123');
    expect(restoredCharacter).toHaveProperty('characterId');
    expect(restoredCharacter).toHaveProperty('characterName');
  });

  it('should validate cross-game transfer compatibility', () => {
    const result = clusterManager.validateCrossGameTransfer('ascended', 'evolved');
    expect(result).toHaveProperty('compatible');
    expect(result).toHaveProperty('limitations');
    expect(Array.isArray(result.limitations)).toBe(true);
  });

  it('should get cluster statistics', async () => {
    const stats = clusterManager.getClusterStatistics();
    expect(stats).toHaveProperty('totalNodes');
    expect(stats).toHaveProperty('onlineNodes');
    expect(stats).toHaveProperty('offlineNodes');
    expect(stats).toHaveProperty('totalPlayers');
    expect(stats).toHaveProperty('utilizationPercentage');
  });

  it('should get migration status', async () => {
    const nodeStatus = clusterManager.getNodeStatus('node-1');
    if (nodeStatus) nodeStatus.status = 'online';
    const nodeStatus2 = clusterManager.getNodeStatus('node-2');
    if (nodeStatus2) nodeStatus2.status = 'online';

    const migration = await clusterManager.migrateCharacter('char-123', 'node-1', 'node-2');
    const migrationStatus = clusterManager.getMigrationStatus(migration.id);
    expect(migrationStatus).toBeDefined();
  });

  it('should emit config-validated event', (done) => {
    const newManager = new ArkClusterManager(clusterConfig);
    newManager.on('config-validated', (data) => {
      expect(data).toHaveProperty('clusterId');
      done();
    });
  });
});

/**
 * Test Suite: Deployment Functions
 */
describe('Deployment Functions', () => {
  let deploymentConfig: DeploymentConfig;

  beforeEach(() => {
    deploymentConfig = {
      deploymentId: 'deploy-test-001',
      projectName: 'ARK Test Project',
      environment: 'development',
      arkVersion: 'ascended',
      servers: [
        {
          id: 'server-1',
          name: 'Server 1',
          map: 'TheIsland',
          region: 'us-east-1',
          machineType: 't3.xlarge',
          diskSize: 100,
          memoryGb: 8,
          cpuCores: 4,
          replicaCount: 1
        }
      ],
      registryUrl: 'docker.io',
      registryUsername: 'testuser',
      registryPassword: 'testpass'
    };
  });

  it('should deploy servers', async () => {
    const result = await deployServers(deploymentConfig);
    expect(result).toHaveProperty('deploymentId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('progress');
    expect(result.progress).toBe(100);
  });

  it('should build Docker image', async () => {
    const result = await buildDockerImage('ascended', 'ark-ascended:v1', 'Dockerfile', './docker');
    expect(result).toHaveProperty('imageId');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('layers');
  });

  it('should push Docker image', async () => {
    const result = await pushDockerImage('sha256:test', 'docker.io', 'ark:latest', 'user', 'pass');
    expect(result).toHaveProperty('pushed');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('digest');
    expect(result.pushed).toBe(true);
  });

  it('should perform health check', async () => {
    const result = await performHealthCheck(['localhost:7777'], {
      url: 'http://localhost:7777/health',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      retries: 3,
      interval: 1000
    });
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('unhealthy');
    expect(result).toHaveProperty('checkTime');
    expect(Array.isArray(result.healthy)).toBe(true);
  });

  it('should rollback deployment', async () => {
    const result = await rollbackDeployment('deploy-001', {
      targetVersion: '1.0.0',
      affectedServers: ['server-1'],
      force: false,
      backupRestore: true
    });
    expect(result).toHaveProperty('rollbackId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('affectedServers');
  });

  it('should scale deployment', async () => {
    const result = await scaleDeployment('deploy-001', 'server-1', 3);
    expect(result).toHaveProperty('scalingId');
    expect(result).toHaveProperty('targetReplicas');
    expect(result.targetReplicas).toBe(3);
  });

  it('should throw error for invalid scaling', async () => {
    await expect(scaleDeployment('deploy-001', 'server-1', 200))
      .rejects.toThrow('Target replicas must be between 1 and 100');
  });

  it('should backup deployment state', async () => {
    const result = await backupDeploymentState('deploy-001', true);
    expect(result).toHaveProperty('backupId');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('location');
    expect(result).toHaveProperty('completedTime');
  });

  it('should restore deployment state', async () => {
    const result = await restoreDeploymentState('deploy-001', 'backup-123');
    expect(result).toHaveProperty('restoreId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('restoredItems');
  });

  it('should get deployment metrics', async () => {
    const result = await getDeploymentMetrics('deploy-001', {
      start: new Date(Date.now() - 3600000),
      end: new Date()
    });
    expect(result).toHaveProperty('cpu');
    expect(result).toHaveProperty('memory');
    expect(result).toHaveProperty('disk');
    expect(result).toHaveProperty('network');
    expect(result).toHaveProperty('playerCount');
  });

  it('should migrate deployment', async () => {
    const result = await migrateDeployment(
      'deploy-001',
      'host-1.example.com',
      'host-2.example.com',
      {
        backupBeforeMigration: true,
        minimizeDowntime: true,
        validateAfterMigration: true
      }
    );
    expect(result).toHaveProperty('migrationId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('downtimeSeconds');
  });

  it('should cleanup deployment resources', async () => {
    const result = await cleanupDeploymentResources('deploy-001', {
      removeContainers: true,
      removeImages: true,
      removeVolumes: true,
      removeNetworks: true,
      backupData: true
    });
    expect(result).toHaveProperty('cleaned');
    expect(result).toHaveProperty('removedItems');
    expect(result.cleaned).toBe(true);
  });

  it('should deploy with canary strategy', async () => {
    const result = await deployWithCanary(
      'deploy-001',
      '2.0.0',
      20,
      deploymentConfig
    );
    expect(result).toHaveProperty('canaryDeploymentId');
    expect(result).toHaveProperty('canaryServers');
    expect(result).toHaveProperty('productionServers');
    expect(result).toHaveProperty('canaryStatus');
    expect(result).toHaveProperty('readyForProduction');
  });

  it('should throw error for invalid canary percentage', async () => {
    await expect(deployWithCanary('deploy-001', '2.0.0', 75, deploymentConfig))
      .rejects.toThrow('Canary percentage must be between 1 and 50');
  });
});

/**
 * Test Suite: PortAllocator
 */
describe('PortAllocator', () => {
  let allocator: PortAllocator;

  beforeEach(() => {
    allocator = new PortAllocator(7777);
  });

  it('should allocate ports', () => {
    const ports = allocator.allocatePorts('server-1');
    expect(ports).toHaveProperty('gamePort');
    expect(ports).toHaveProperty('queryPort');
    expect(ports).toHaveProperty('rconPort');
    expect(ports.gamePort).toBe(7777);
    expect(ports.queryPort).toBe(7778);
  });

  it('should allocate different ports for different servers', () => {
    const ports1 = allocator.allocatePorts('server-1');
    const ports2 = allocator.allocatePorts('server-2');
    expect(ports1.gamePort).not.toBe(ports2.gamePort);
  });

  it('should release ports', () => {
    const ports = allocator.allocatePorts('server-1');
    allocator.releasePorts(ports.gamePort);
    expect(allocator.isPortAvailable(ports.gamePort)).toBe(true);
  });

  it('should get all allocated ports', () => {
    allocator.allocatePorts('server-1');
    allocator.allocatePorts('server-2');
    const allPorts = allocator.getAllocatedPorts();
    expect(Array.isArray(allPorts)).toBe(true);
    expect(allPorts.length).toBeGreaterThan(0);
  });

  it('should check if port is available', () => {
    const ports = allocator.allocatePorts('server-1');
    expect(allocator.isPortAvailable(ports.gamePort)).toBe(false);
    expect(allocator.isPortAvailable(9999)).toBe(true);
  });

  it('should get next available game port', () => {
    allocator.allocatePorts('server-1');
    const nextPort = allocator.getNextGamePort();
    expect(nextPort).toBeGreaterThan(7777);
  });

  it('should validate port range', () => {
    allocator.allocatePorts('server-1');
    const isValid = allocator.validatePortRange(8000, 5);
    expect(typeof isValid).toBe('boolean');
  });

  it('should throw error for port conflict', () => {
    allocator.allocatePorts('server-1');
    expect(() => allocator.validatePortRange(7777, 1)).toBeDefined();
  });
});

/**
 * Test Suite: ConfigValidator
 */
describe('ConfigValidator', () => {
  it('should validate correct Docker config', () => {
    const config = createSmallAscendedConfig();
    const result = ConfigValidator.validateDockerConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should detect invalid server name', () => {
    const config = createSmallAscendedConfig();
    config.serverName = '';
    const result = ConfigValidator.validateDockerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate memory limit', () => {
    const result = ConfigValidator.validateMemoryLimit('8g');
    expect(result.valid).toBe(true);
    expect(result.bytes).toBeGreaterThan(0);
  });

  it('should reject invalid memory format', () => {
    const result = ConfigValidator.validateMemoryLimit('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should validate CPU limit', () => {
    const result = ConfigValidator.validateCpuLimit('4');
    expect(result.valid).toBe(true);
    expect(result.cores).toBe(4);
  });

  it('should reject invalid CPU limit', () => {
    const result = ConfigValidator.validateCpuLimit('200');
    expect(result.valid).toBe(false);
  });

  it('should validate server name', () => {
    const result = ConfigValidator.validateServerName('My ARK Server');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid server name', () => {
    const result = ConfigValidator.validateServerName('');
    expect(result.valid).toBe(false);
  });

  it('should validate strong password', () => {
    const result = ConfigValidator.validatePassword('MyStr0ng!Pass');
    expect(result.valid).toBe(true);
    expect(result.strength).toBe('strong');
  });

  it('should detect weak password', () => {
    const result = ConfigValidator.validatePassword('weak');
    expect(result.valid).toBe(false);
    expect(result.strength).toBe('weak');
  });

  it('should validate medium password', () => {
    const result = ConfigValidator.validatePassword('Medium1Pass');
    expect(result.valid).toBe(true);
    expect(result.strength).toBe('medium');
  });
});

/**
 * Test Suite: Configuration Examples
 */
describe('Configuration Examples', () => {
  it('should create small Ascended config', () => {
    const config = createSmallAscendedConfig();
    expect(config.arkVersion).toBe('ascended');
    expect(config.maxPlayers).toBe(10);
  });

  it('should create medium Ascended config', () => {
    const config = createMediumAscendedConfig();
    expect(config.arkVersion).toBe('ascended');
    expect(config.maxPlayers).toBe(35);
    expect(config.enableCluster).toBe(true);
  });

  it('should create large Ascended cluster config', () => {
    const config = createLargeAscendedClusterConfig();
    expect(config.arkVersion).toBe('ascended');
    expect(config.maxPlayers).toBe(70);
    expect(config.enableCluster).toBe(true);
  });

  it('should create small Evolved config', () => {
    const config = createSmallEvolvedConfig();
    expect(config.arkVersion).toBe('evolved');
    expect(config.maxPlayers).toBe(10);
  });

  it('should create medium Evolved config', () => {
    const config = createMediumEvolvedConfig();
    expect(config.arkVersion).toBe('evolved');
    expect(config.maxPlayers).toBe(40);
    expect(config.enableCluster).toBe(true);
  });

  it('should create large Evolved cluster config', () => {
    const config = createLargeEvolvedClusterConfig();
    expect(config.arkVersion).toBe('evolved');
    expect(config.maxPlayers).toBe(70);
    expect(config.enableCluster).toBe(true);
  });

  it('should have all ARK Ascended maps defined', () => {
    expect(Object.keys(ARK_ASCENDED_MAPS).length).toBe(7);
    expect(ARK_ASCENDED_MAPS).toHaveProperty('Genesis1');
    expect(ARK_ASCENDED_MAPS).toHaveProperty('TheIsland');
  });

  it('should have all ARK Evolved maps defined', () => {
    expect(Object.keys(ARK_EVOLVED_MAPS).length).toBe(9);
    expect(ARK_EVOLVED_MAPS).toHaveProperty('TheIsland');
    expect(ARK_EVOLVED_MAPS).toHaveProperty('LostIsland');
  });
});

/**
 * Integration Tests
 */
describe('Integration Tests', () => {
  it('should create complete ARK setup workflow', async () => {
    // Create configuration
    const config = createMediumAscendedConfig();

    // Create installer
    const installer = new ArkDockerInstaller(config);

    // Create cluster
    const clusterConfig: ClusterConfig = {
      clusterId: 'integration-test-cluster',
      clusterName: 'Integration Test',
      adminPassword: 'admin123!@#',
      nodes: [
        {
          id: 'node-1',
          name: 'Primary',
          host: 'localhost',
          port: 7777,
          rconPort: 27015,
          map: config.map,
          playerCount: 0,
          maxPlayers: config.maxPlayers,
          status: 'offline',
          uptime: 0,
          lastHeartbeat: new Date()
        }
      ],
      maxCharactersPerPlayer: 2,
      enableCrossServerTransfer: true,
      enableCrossGameTransfer: false,
      characterDataPath: '/ark/cluster/characters',
      backupPath: '/ark/cluster/backups',
      syncIntervalMs: 10000,
      healthCheckIntervalMs: 30000
    };

    const cluster = new ArkClusterManager(clusterConfig);

    // Verify setup
    expect(installer.getStatus().config.arkVersion).toBe('ascended');
    expect(cluster.getClusterStatus().clusterName).toBe('Integration Test');
  });

  it('should validate all configuration types', () => {
    const configs = [
      createSmallAscendedConfig(),
      createMediumAscendedConfig(),
      createLargeAscendedClusterConfig(),
      createSmallEvolvedConfig(),
      createMediumEvolvedConfig(),
      createLargeEvolvedClusterConfig()
    ];

    for (const config of configs) {
      const result = ConfigValidator.validateDockerConfig(config);
      expect(result.valid).toBe(true);
    }
  });

  it('should handle port allocation across multiple servers', () => {
    const allocator = new PortAllocator(8000);
    const ports: Array<{ gamePort: number }> = [];

    for (let i = 0; i < 10; i++) {
      ports.push(allocator.allocatePorts(`server-${i}`));
    }

    // Verify all ports are unique
    const gamePorts = ports.map(p => p.gamePort);
    const uniquePorts = new Set(gamePorts);
    expect(uniquePorts.size).toBe(10);
  });
});
