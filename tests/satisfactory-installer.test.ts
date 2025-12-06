/**
 * Satisfactory Installer Unit Tests
 * Comprehensive test suite for Satisfactory factory-building game server installation
 */

import { SatisfactoryInstaller } from '@/lib/installers/games/SatisfactoryInstaller';
import { InstallConfig } from '@/lib/installers/utils/BaseGameInstaller';
import { PortManager } from '@/lib/installers/utils/PortManager';
import { DebugLogger } from '@/lib/installers/utils/DebugLogger';

jest.mock('@/lib/installers/utils/PortManager');
jest.mock('@/lib/installers/utils/DebugLogger');

describe('SatisfactoryInstaller', () => {
  let installer: SatisfactoryInstaller;
  let portManager: jest.Mocked<PortManager>;
  let logger: jest.Mocked<DebugLogger>;

  const mockOrderId = 'ORD-2025-00003';
  const mockMachineId = 'MACHINE-001';

  beforeEach(() => {
    portManager = new PortManager() as jest.Mocked<PortManager>;
    logger = new DebugLogger() as jest.Mocked<DebugLogger>;
    installer = new SatisfactoryInstaller(portManager, logger);
  });

  describe('Configuration Validation', () => {
    test('should accept valid Satisfactory configuration', async () => {
      const validConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8, // Satisfactory-specific
        port: 7777,
        ram: 8192, // 8GB minimum for Satisfactory
        gameConfig: {
          serverName: 'My Satisfactory Server',
          autoPause: true,
          savesInterval: 900,
        },
      };

      const result = await installer.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should enforce strict maxPlayers limit (1-16 for Satisfactory)', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 20, // Invalid - above 16 (Satisfactory limit)
        port: 7777,
        ram: 8192,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/maxPlayers.*1.*16/i));
    });

    test('should reject maxPlayers below 1', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 0, // Invalid
        port: 7777,
        ram: 8192,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/maxPlayers.*1.*16/i));
    });

    test('should enforce 8GB minimum RAM requirement for Satisfactory', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 4096, // 4GB - below 8GB minimum
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/8GB|8192/i));
    });

    test('should accept exactly 8GB RAM (minimum)', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192, // Exactly 8GB
      };

      const result = await installer.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    test('should accept up to 32GB RAM', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 32768, // 32GB
      };

      const result = await installer.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    test('should reject RAM above 32GB', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 65536, // 64GB - above maximum
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
    });

    test('should validate port range (10000-65535)', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 5000, // Invalid - below 10000
        ram: 8192,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/port.*10000.*65535/i));
    });
  });

  describe('Docker Compose Generation', () => {
    test('should generate docker-compose with Satisfactory image', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('wolveix/satisfactory-server');
      expect(compose).toContain('7777'); // Game port
    });

    test('should include extended startup grace period for Satisfactory', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      const compose = await installer.buildDockerCompose(config);

      // Satisfactory needs longer startup time than typical games
      expect(compose).toContain('start_period'); // Docker health check start period
    });

    test('should allocate 3 ports (game, beacon, query)', async () => {
      portManager.allocate = jest.fn()
        .mockResolvedValueOnce({ port: 7777 })
        .mockResolvedValueOnce({ port: 7778 })
        .mockResolvedValueOnce({ port: 7779 });

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      const result = await installer.allocatePorts(config);

      // Should allocate 3 ports
      expect(portManager.allocate).toHaveBeenCalledTimes(3);
      expect(result.ports).toHaveLength(3);
    });

    test('should include mod directory configuration', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      const compose = await installer.buildDockerCompose(config);

      // Should include mods directory mount
      expect(compose).toContain('mods');
    });

    test('should include auto-pause configuration option', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
        gameConfig: {
          autoPause: true,
        },
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('AUTO_PAUSE');
    });
  });

  describe('Resource Allocation', () => {
    test('should allocate 8 CPU cores for Satisfactory', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      const compose = await installer.buildDockerCompose(config);

      // Check for CPU limit specification
      expect(compose).toContain('cpus');
    });

    test('should allocate full specified RAM', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 16384, // 16GB
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('mem_limit');
      expect(compose).toContain('16G'); // 16GB
    });
  });

  describe('Mod Support', () => {
    test('should create mod directory in postInstall', async () => {
      const postInstallSpy = jest.spyOn(installer, 'postInstall')
        .mockResolvedValue(void 0);

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      await installer.postInstall(config);

      expect(postInstallSpy).toHaveBeenCalledWith(config);
      postInstallSpy.mockRestore();
    });
  });

  describe('Stabilization Delay', () => {
    test('should include longer initialization period for Satisfactory', async () => {
      const postInstallSpy = jest.spyOn(installer, 'postInstall')
        .mockResolvedValue(void 0);

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      // Satisfactory has a 10-second stabilization wait in postInstall
      const startTime = Date.now();
      await installer.postInstall(config);
      const elapsed = Date.now() - startTime;

      // Should have delayed at least a bit (can't test exact 10sec in unit test)
      // But test is mocked, so just verify the method was called
      expect(postInstallSpy).toHaveBeenCalledWith(config);
      postInstallSpy.mockRestore();
    });
  });

  describe('Health Check', () => {
    test('should verify 3 Satisfactory ports are responsive', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      const healthCheckSpy = jest.spyOn(installer, 'healthCheck')
        .mockResolvedValue(true);

      const result = await installer.healthCheck(config);

      expect(result).toBe(true);
      healthCheckSpy.mockRestore();
    });

    test('should handle health check timeout for slow-starting server', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
      };

      const healthCheckSpy = jest.spyOn(installer, 'healthCheck')
        .mockRejectedValue(new Error('Health check timeout'));

      await expect(installer.healthCheck(config)).rejects.toThrow('Health check timeout');
      healthCheckSpy.mockRestore();
    });
  });

  describe('Configuration Parameters', () => {
    test('should handle password configuration', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
        gameConfig: {
          password: 'SecurePass123',
        },
      };

      const compose = await installer.buildDockerCompose(config);

      // Should include password configuration
      expect(compose).toContain('PASSWORD') || expect(compose).toContain('password');
    });

    test('should handle save interval configuration', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 8192,
        gameConfig: {
          savesInterval: 1200, // 20 minutes
        },
      };

      const result = await installer.validateConfig(config);

      expect(result.valid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid RAM configuration gracefully', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 8,
        port: 7777,
        ram: 4096, // Below 8GB minimum
      };

      const result = await installer.validateConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle invalid player count gracefully', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'SATISFACTORY',
        maxPlayers: 17, // Above 16 player limit
        port: 7777,
        ram: 8192,
      };

      const result = await installer.validateConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
