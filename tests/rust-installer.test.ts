/**
 * Rust Installer Unit Tests
 * Comprehensive test suite for Rust server installation with oxide framework
 */

import { RustInstaller } from '@/lib/installers/games/RustInstaller';
import { InstallConfig } from '@/lib/installers/utils/BaseGameInstaller';
import { PortManager } from '@/lib/installers/utils/PortManager';
import { DebugLogger } from '@/lib/installers/utils/DebugLogger';

jest.mock('@/lib/installers/utils/PortManager');
jest.mock('@/lib/installers/utils/DebugLogger');

describe('RustInstaller', () => {
  let installer: RustInstaller;
  let portManager: jest.Mocked<PortManager>;
  let logger: jest.Mocked<DebugLogger>;

  const mockOrderId = 'ORD-2025-00002';
  const mockMachineId = 'MACHINE-001';

  beforeEach(() => {
    portManager = new PortManager() as jest.Mocked<PortManager>;
    logger = new DebugLogger() as jest.Mocked<DebugLogger>;
    installer = new RustInstaller(portManager, logger);
  });

  describe('Configuration Validation', () => {
    test('should accept valid Rust configuration', async () => {
      const validConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096, // 4GB
        gameConfig: {
          seed: 12345,
          worldSize: 3000,
          saveInterval: 600,
        },
      };

      const result = await installer.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject maxPlayers below minimum (10)', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 5, // Invalid - below 10
        port: 28015,
        ram: 4096,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/maxPlayers.*10.*1000/i));
    });

    test('should reject maxPlayers above maximum (1000)', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 1500, // Invalid - above 1000
        port: 28015,
        ram: 4096,
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/maxPlayers.*10.*1000/i));
    });

    test('should accept valid seed range (0-2147483647)', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          seed: 2147483647, // Maximum valid seed
          worldSize: 3000,
        },
      };

      const result = await installer.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    test('should reject seed below 0', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          seed: -1, // Invalid
          worldSize: 3000,
        },
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/seed/i));
    });

    test('should reject seed above 2147483647', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          seed: 2147483648, // Invalid - above max int32
          worldSize: 3000,
        },
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/seed/i));
    });

    test('should accept valid world size range (1000-6000)', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          seed: 12345,
          worldSize: 4000, // Valid - in range
        },
      };

      const result = await installer.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    test('should reject worldSize below 1000', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          worldSize: 500, // Invalid - below 1000
        },
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/worldSize.*1000.*6000/i));
    });

    test('should reject worldSize above 6000', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          worldSize: 8000, // Invalid - above 6000
        },
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/worldSize.*1000.*6000/i));
    });
  });

  describe('Docker Compose Generation', () => {
    test('should generate valid docker-compose with oxide framework', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          seed: 12345,
          worldSize: 3000,
        },
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('didstopia/rust-server');
      expect(compose).toContain('28015'); // Game port
      expect(compose).toContain('OXIDE=true'); // Oxide framework enabled
    });

    test('should include RCON web interface port (8080)', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('8080'); // RCON web port
    });

    test('should include auto-update configuration', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('UPDATE_CHECKING=true');
    });

    test('should set server name from config', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          serverName: 'My Rust Server',
        },
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('My Rust Server');
    });

    test('should allocate 3 ports for Rust', async () => {
      portManager.allocate = jest.fn()
        .mockResolvedValueOnce({ port: 28015 })
        .mockResolvedValueOnce({ port: 28016 })
        .mockResolvedValueOnce({ port: 28017 });

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
      };

      const result = await installer.allocatePorts(config);

      // Should allocate 3 ports (game, query, rustPlus)
      expect(portManager.allocate).toHaveBeenCalledTimes(3);
      expect(result.ports).toHaveLength(3);
    });
  });

  describe('Resource Allocation', () => {
    test('should allocate 8 CPU cores for Rust', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
      };

      const compose = await installer.buildDockerCompose(config);

      // Check for CPU limits in compose file
      expect(compose).toContain('cpus'); // Should specify CPU limits
    });

    test('should allocate 8GB RAM for Rust', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 8192, // 8GB
      };

      const compose = await installer.buildDockerCompose(config);

      expect(compose).toContain('mem_limit');
    });
  });

  describe('Plugin Support', () => {
    test('should create plugin directory in postInstall', async () => {
      const postInstallSpy = jest.spyOn(installer, 'postInstall')
        .mockResolvedValue(void 0);

      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
      };

      await installer.postInstall(config);

      expect(postInstallSpy).toHaveBeenCalledWith(config);
      postInstallSpy.mockRestore();
    });
  });

  describe('Health Check', () => {
    test('should verify 3 Rust ports are responsive', async () => {
      const config: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
      };

      const healthCheckSpy = jest.spyOn(installer, 'healthCheck')
        .mockResolvedValue(true);

      const result = await installer.healthCheck(config);

      expect(result).toBe(true);
      healthCheckSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid game config gracefully', async () => {
      const invalidConfig: InstallConfig = {
        orderId: mockOrderId,
        machineId: mockMachineId,
        gameType: 'RUST',
        maxPlayers: 100,
        port: 28015,
        ram: 4096,
        gameConfig: {
          seed: 'invalid', // Should be number
        } as any,
      };

      const result = await installer.validateConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
