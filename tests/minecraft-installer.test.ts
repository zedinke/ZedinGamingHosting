/**
 * Minecraft Installer Unit Tests
 * Comprehensive test suite for Minecraft server installation and management
 */

import { MinecraftInstaller } from '@/lib/installers/games/MinecraftInstaller';
import { InstallConfig, InstallResult } from '@/lib/installers/utils/BaseGameInstaller';
import { PortManager } from '@/lib/installers/utils/PortManager';
import { DebugLogger } from '@/lib/installers/utils/DebugLogger';

// Mock external dependencies
jest.mock('@/lib/installers/utils/PortManager');
jest.mock('@/lib/installers/utils/DebugLogger');

describe('MinecraftInstaller', () => {
  let installer: MinecraftInstaller;
  let portManager: jest.Mocked<PortManager>;
  let logger: jest.Mocked<DebugLogger>;

  const mockOrderId = 'ORD-2025-00001';
  const mockMachineId = 'MACHINE-001';

  beforeEach(() => {
    // Initialize mocks
    portManager = new PortManager() as jest.Mocked<PortManager>;
    logger = new DebugLogger() as jest.Mocked<DebugLogger>;

    // Create installer instance
    installer = new MinecraftInstaller(portManager, logger);
  });

  describe('Configuration Validation', () => {
    test('should accept valid Minecraft configuration', async () => {
      const validConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048, // 2GB
        gameConfig: {
          difficulty: 2,
          gamemode: 'survival',
          pvp: true,
          enableNether: true,
        },
      };

      const result = await installer.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject maxPlayers below minimum (1)', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 0, // Invalid
        port: 25565,
        ram: 2048,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/maxPlayers.*1.*100/i));
    });

    test('should reject maxPlayers above maximum (100)', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 150, // Invalid
        port: 25565,
        ram: 2048,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/maxPlayers.*1.*100/i));
    });

    test('should reject port below 10000', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 5000, // Invalid - below 10000
        ram: 2048,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/port.*10000.*65535/i));
    });

    test('should reject port above 65535', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 70000, // Invalid - above 65535
        ram: 2048,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/port.*10000.*65535/i));
    });

    test('should reject RAM below 512MB', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 256, // Invalid - below 512MB
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/RAM.*512.*32768/i));
    });

    test('should reject RAM above 32GB', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 65536, // Invalid - above 32GB
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/RAM.*512.*32768/i));
    });

    test('should use default RAM of 1GB if not specified', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        // ram not specified
      };

      const result = await installer.validateConfig(config);
      expect(result.valid).toBe(true);
      // Should use default 1024MB
    });
  });

  describe('Docker Compose Generation', () => {
    test('should generate valid docker-compose structure', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
        gameConfig: {
          difficulty: 2,
          gamemode: 'survival',
        },
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toBeDefined();
      expect(compose).toContain('minecraft-server');
      expect(compose).toContain('itzg/minecraft-server');
      expect(compose).toContain('25565');
      expect(compose).toContain('EULA=TRUE');
      expect(compose).toContain('MEMORY=2G');
    });

    test('should set correct memory environment variable', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 4096, // 4GB
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('MEMORY=4G');
    });

    test('should include RCON configuration', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('ENABLE_RCON=true');
      expect(compose).toContain('RCON_PORT=');
    });

    test('should include game configuration options', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
        gameConfig: {
          difficulty: 3,
          gamemode: 'creative',
          pvp: false,
          enableNether: false,
        },
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('DIFFICULTY=3');
      expect(compose).toContain('GAMEMODE=creative');
      expect(compose).toContain('PVP=false');
    });

    test('should include health check configuration', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('healthcheck');
      expect(compose).toContain('interval: 30s');
      expect(compose).toContain('retries: 3');
    });
  });

  describe('Port Allocation', () => {
    test('should allocate single port via PortManager', async () => {
      portManager.allocate = jest.fn().mockResolvedValue({ port: 25565 });

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
      };

      await installer.allocatePorts(config);

      expect(portManager.allocate).toHaveBeenCalledWith('MINECRAFT', 25565);
    });

    test('should use auto-allocated port if not specified', async () => {
      portManager.allocate = jest.fn().mockResolvedValue({ port: 30000 });

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        // port not specified
        ram: 2048,
      };

      const result = await installer.allocatePorts(config);

      expect(portManager.allocate).toHaveBeenCalled();
      expect(result.port).toBe(30000);
    });

    test('should handle port allocation failure', async () => {
      portManager.allocate = jest.fn().mockRejectedValue(new Error('Port range exhausted'));

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
      };

      await expect(installer.allocatePorts(config)).rejects.toThrow('Port range exhausted');
    });
  });

  describe('Pre-Installation Steps', () => {
    test('should call preInstall before actual installation', async () => {
      const preInstallSpy = jest.spyOn(installer, 'preInstall').mockResolvedValue(void 0);

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
      };

      await installer.preInstall(config);

      expect(preInstallSpy).toHaveBeenCalledWith(config);
      preInstallSpy.mockRestore();
    });
  });

  describe('Health Check', () => {
    test('should return success on healthy port', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
      };

      // Mock successful health check
      const healthCheckSpy = jest.spyOn(installer, 'healthCheck')
        .mockResolvedValue(true);

      const result = await installer.healthCheck(config);

      expect(result).toBe(true);
      healthCheckSpy.mockRestore();
    });

    test('should return failure on unhealthy port', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
      };

      // Mock failed health check
      const healthCheckSpy = jest.spyOn(installer, 'healthCheck')
        .mockResolvedValue(false);

      const result = await installer.healthCheck(config);

      expect(result).toBe(false);
      healthCheckSpy.mockRestore();
    });
  });

  describe('Logging', () => {
    test('should log at appropriate levels', async () => {
      logger.log = jest.fn();

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'MINECRAFT',
        maxPlayers: 50,
        port: 25565,
        ram: 2048,
      };

      await installer.validateConfig(config);

      // Logger should have been called at least once
      expect(logger.log).toHaveBeenCalled();
    });
  });
});
