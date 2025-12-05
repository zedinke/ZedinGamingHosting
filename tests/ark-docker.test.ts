/**
 * ARK Docker Installer Test Suite
 * Comprehensive tests for Docker-based server management
 */

import { ArkDockerInstaller, ArkServerConfig, ServerStatus } from '@/lib/games/ark-docker/installer';
import { ArkClusterManager, ClusterNode } from '@/lib/games/ark-docker/cluster';
import { execSync } from 'child_process';
import { join } from 'path';
import { mkdir, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

describe('ArkDockerInstaller', () => {
  let installer: ArkDockerInstaller;
  const testDir = '/tmp/ark-docker-tests';
  const testServerId = 'test-server-001';

  beforeAll(async () => {
    // Setup test environment
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
    await mkdir(testDir, { recursive: true });

    installer = new ArkDockerInstaller(testDir);
  });

  afterAll(async () => {
    // Cleanup
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });

  describe('Configuration Validation', () => {
    test('should validate required config fields', () => {
      const invalidConfig: Partial<ArkServerConfig> = {
        serverName: 'Test Server',
        // Missing serverId, adminPassword, etc.
      };

      expect(() => {
        // @ts-ignore
        installer['validateConfig'](invalidConfig as ArkServerConfig);
      }).toThrow('Missing required configuration');
    });

    test('should validate port ranges', () => {
      const invalidConfig: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        maxPlayers: 70,
        difficulty: 1.0,
        serverPort: 500, // Invalid - below 1024
        queryPort: 27015,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
      };

      expect(() => {
        installer['validateConfig'](invalidConfig);
      }).toThrow('Invalid server port range');
    });

    test('should validate port uniqueness', () => {
      const invalidConfig: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        maxPlayers: 70,
        difficulty: 1.0,
        serverPort: 27015,
        queryPort: 27015, // Same as serverPort
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
      };

      expect(() => {
        installer['validateConfig'](invalidConfig);
      }).toThrow('Server port and query port must be different');
    });

    test('should validate difficulty range', () => {
      const invalidConfig: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        maxPlayers: 70,
        difficulty: 5.0, // Invalid - above 4.0
        serverPort: 27015,
        queryPort: 27016,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
      };

      expect(() => {
        installer['validateConfig'](invalidConfig);
      }).toThrow('Difficulty must be between 0.5 and 4.0');
    });

    test('should validate max players range', () => {
      const invalidConfig: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        maxPlayers: 2000, // Invalid - above 1000
        difficulty: 1.0,
        serverPort: 27015,
        queryPort: 27016,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
      };

      expect(() => {
        installer['validateConfig'](invalidConfig);
      }).toThrow('Max players must be between 1 and 1000');
    });

    test('should validate game type', () => {
      const invalidConfig: Partial<ArkServerConfig> = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'invalid-game' as any,
        mapName: 'TheIsland_WP',
        maxPlayers: 70,
        difficulty: 1.0,
        serverPort: 27015,
        queryPort: 27016,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
      };

      expect(() => {
        // @ts-ignore
        installer['validateConfig'](invalidConfig as ArkServerConfig);
      }).toThrow('Invalid game type');
    });

    test('should accept valid configuration', () => {
      const validConfig: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        maxPlayers: 70,
        difficulty: 1.5,
        serverPort: 27015,
        queryPort: 27016,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
        ramMb: 8192,
      };

      expect(() => {
        installer['validateConfig'](validConfig);
      }).not.toThrow();
    });
  });

  describe('Environment File Generation', () => {
    test('should generate valid env file', () => {
      const config: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        maxPlayers: 70,
        difficulty: 1.0,
        serverPort: 27015,
        queryPort: 27016,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
        serverPassword: 'password123',
        clusterId: 'cluster-001',
        clusterMode: true,
      };

      const envContent = installer['generateEnvFile'](config);

      expect(envContent).toContain('SERVER_NAME=Test Server');
      expect(envContent).toContain('SERVER_PORT=27015');
      expect(envContent).toContain('QUERY_PORT=27016');
      expect(envContent).toContain('STEAM_API_KEY=test-key');
      expect(envContent).toContain('MAP_NAME=TheIsland_WP');
      expect(envContent).toContain('MAX_PLAYERS=70');
      expect(envContent).toContain('DIFFICULTY=1');
      expect(envContent).toContain('ADMIN_PASSWORD=admin123');
      expect(envContent).toContain('SERVER_PASSWORD=password123');
      expect(envContent).toContain('CLUSTER_ID=cluster-001');
      expect(envContent).toContain('CLUSTER_MODE=true');
    });

    test('should escape special characters in env values', () => {
      const config: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test "Server" with "quotes"',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        maxPlayers: 70,
        difficulty: 1.0,
        serverPort: 27015,
        queryPort: 27016,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
      };

      const envContent = installer['generateEnvFile'](config);

      expect(envContent).toContain('SERVER_NAME=Test \\"Server\\" with \\"quotes\\"');
    });
  });

  describe('Docker Compose Generation', () => {
    test('should generate valid docker-compose file', () => {
      const config: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        maxPlayers: 70,
        difficulty: 1.0,
        serverPort: 27015,
        queryPort: 27016,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
        ramMb: 8192,
        clusterId: 'cluster-001',
      };

      const composeContent = installer['generateDockerCompose'](config);

      expect(composeContent).toContain('version: \'3.9\'');
      expect(composeContent).toContain('zedin-gaming/ark-ascended:latest');
      expect(composeContent).toContain('env_file:');
      expect(composeContent).toContain('- .env');
      expect(composeContent).toContain(`label: "zed.server-id=${testServerId}"`);
      expect(composeContent).toContain('restart: unless-stopped');
      expect(composeContent).toContain('healthcheck:');
    });

    test('should include volumes for cluster mode', () => {
      const config: ArkServerConfig = {
        serverId: testServerId,
        serverName: 'Test Server',
        gameType: 'ark-evolved',
        mapName: 'TheIsland_P',
        maxPlayers: 70,
        difficulty: 1.0,
        serverPort: 27015,
        queryPort: 27016,
        steamApiKey: 'test-key',
        adminPassword: 'admin123',
        clusterId: 'cluster-001',
      };

      const composeContent = installer['generateDockerCompose'](config);

      expect(composeContent).toContain('ark-data-');
      expect(composeContent).toContain('ark-cluster:');
      expect(composeContent).toContain('volumes:');
    });
  });

  describe('Environment Parsing', () => {
    test('should parse env file correctly', () => {
      const envContent = `
# Comment line
SERVER_NAME=Test Server
SERVER_PORT=27015
QUERY_PORT=27016
STEAM_API_KEY=test-key
EMPTY_VALUE=
`;

      const parsed = installer['parseEnvFile'](envContent);

      expect(parsed.SERVER_NAME).toBe('Test Server');
      expect(parsed.SERVER_PORT).toBe('27015');
      expect(parsed.QUERY_PORT).toBe('27016');
      expect(parsed.STEAM_API_KEY).toBe('test-key');
      expect(parsed.EMPTY_VALUE).toBe('');
    });

    test('should handle values with equals signs', () => {
      const envContent = `
CONNECTION_STRING=host=localhost;port=5432
`;

      const parsed = installer['parseEnvFile'](envContent);

      expect(parsed.CONNECTION_STRING).toBe('host=localhost;port=5432');
    });
  });
});

describe('ArkClusterManager', () => {
  let clusterManager: ArkClusterManager;
  const testDir = '/tmp/ark-cluster-tests';
  const clusterId = 'test-cluster-001';

  beforeAll(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
    await mkdir(testDir, { recursive: true });

    clusterManager = new ArkClusterManager(testDir, clusterId);
  });

  afterAll(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });

  describe('Cluster Operations', () => {
    test('should initialize cluster', async () => {
      await clusterManager.initialize();

      expect(existsSync(join(testDir, clusterId))).toBe(true);
      expect(existsSync(join(testDir, clusterId, 'cluster.json'))).toBe(true);
    });

    test('should add cluster node', async () => {
      const node: ClusterNode = {
        serverId: 'server-001',
        gameType: 'ark-ascended',
        mapName: 'TheIsland_WP',
        ipAddress: 'localhost',
        port: 27015,
        status: 'offline',
      };

      await clusterManager.addNode(node);

      const nodes = clusterManager.getNodes();
      expect(nodes.length).toBe(1);
      expect(nodes[0].serverId).toBe('server-001');
    });

    test('should remove cluster node', async () => {
      const node: ClusterNode = {
        serverId: 'server-002',
        gameType: 'ark-evolved',
        mapName: 'TheIsland_P',
        ipAddress: 'localhost',
        port: 27016,
        status: 'offline',
      };

      await clusterManager.addNode(node);
      await clusterManager.removeNode('server-002');

      const nodes = clusterManager.getNodes();
      expect(nodes.find((n) => n.serverId === 'server-002')).toBeUndefined();
    });

    test('should get cluster status', async () => {
      const status = await clusterManager.getStatus();

      expect(status.clusterId).toBe(clusterId);
      expect(status.nodeCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(status.nodes)).toBe(true);
    });
  });
});

describe('ARK Docker Integration', () => {
  test('should provide complete workflow', async () => {
    const installer = new ArkDockerInstaller('/tmp/ark-integration-test');

    // Test configuration
    const config: ArkServerConfig = {
      serverId: 'integration-test-001',
      serverName: 'Integration Test Server',
      gameType: 'ark-ascended',
      mapName: 'TheIsland_WP',
      maxPlayers: 70,
      difficulty: 1.0,
      serverPort: 27015,
      queryPort: 27016,
      steamApiKey: 'test-api-key',
      adminPassword: 'admin123',
      ramMb: 8192,
    };

    // Validate configuration doesn't throw
    expect(() => {
      installer['validateConfig'](config);
    }).not.toThrow();

    // Generate env file
    const envContent = installer['generateEnvFile'](config);
    expect(envContent).toBeTruthy();
    expect(envContent).toContain('SERVER_NAME=Integration Test Server');

    // Generate docker-compose
    const composeContent = installer['generateDockerCompose'](config);
    expect(composeContent).toBeTruthy();
    expect(composeContent).toContain('zedin-gaming/ark-ascended:latest');
  });
});

// Mock Docker for testing
export class MockDocker {
  private containers: Map<string, any> = new Map();

  createContainer(config: any): string {
    const id = `mock-container-${Date.now()}`;
    this.containers.set(id, { ...config, running: false });
    return id;
  }

  startContainer(id: string): void {
    const container = this.containers.get(id);
    if (container) {
      container.running = true;
    }
  }

  stopContainer(id: string): void {
    const container = this.containers.get(id);
    if (container) {
      container.running = false;
    }
  }

  removeContainer(id: string): void {
    this.containers.delete(id);
  }

  getContainer(id: string): any {
    return this.containers.get(id);
  }

  getAllContainers(): Map<string, any> {
    return this.containers;
  }
}
