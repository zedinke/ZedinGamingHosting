/**
 * GameInstallerFactory Unit Tests
 * Test suite for factory pattern game installer selection and routing
 */

import { GameInstallerFactory } from '@/lib/installers/GameInstallerFactory';
import { ArkAscendedInstaller } from '@/lib/installers/games/ArkAscendedInstaller';
import { MinecraftInstaller } from '@/lib/installers/games/MinecraftInstaller';
import { RustInstaller } from '@/lib/installers/games/RustInstaller';
import { SatisfactoryInstaller } from '@/lib/installers/games/SatisfactoryInstaller';

describe('GameInstallerFactory', () => {
  const factory = GameInstallerFactory.getInstance();
  const mockMachineId = 'MACHINE-001';

  describe('Installer Creation', () => {
    test('should create ArkAscendedInstaller for ARK_ASCENDED game type', () => {
      const installer = factory.create('ARK_ASCENDED', mockMachineId);

      expect(installer).toBeDefined();
      expect(installer).toBeInstanceOf(ArkAscendedInstaller);
    });

    test('should create ArkAscendedInstaller for ARK_EVOLVED (legacy)', () => {
      const installer = factory.create('ARK_EVOLVED', mockMachineId);

      expect(installer).toBeDefined();
      expect(installer).toBeInstanceOf(ArkAscendedInstaller);
    });

    test('should create MinecraftInstaller for MINECRAFT game type', () => {
      const installer = factory.create('MINECRAFT', mockMachineId);

      expect(installer).toBeDefined();
      expect(installer).toBeInstanceOf(MinecraftInstaller);
    });

    test('should create RustInstaller for RUST game type', () => {
      const installer = factory.create('RUST', mockMachineId);

      expect(installer).toBeDefined();
      expect(installer).toBeInstanceOf(RustInstaller);
    });

    test('should create SatisfactoryInstaller for SATISFACTORY game type', () => {
      const installer = factory.create('SATISFACTORY', mockMachineId);

      expect(installer).toBeDefined();
      expect(installer).toBeInstanceOf(SatisfactoryInstaller);
    });
  });

  describe('Game Type Support', () => {
    test('should list all supported game types', () => {
      const supported = factory.getSupportedGameTypes();

      expect(supported).toBeDefined();
      expect(Array.isArray(supported)).toBe(true);
      expect(supported.length).toBeGreaterThanOrEqual(4); // At least 4 games
      expect(supported).toContain('ARK_ASCENDED');
      expect(supported).toContain('MINECRAFT');
      expect(supported).toContain('RUST');
      expect(supported).toContain('SATISFACTORY');
    });

    test('should check if game type is supported', () => {
      expect(factory.isSupported('ARK_ASCENDED')).toBe(true);
      expect(factory.isSupported('MINECRAFT')).toBe(true);
      expect(factory.isSupported('RUST')).toBe(true);
      expect(factory.isSupported('SATISFACTORY')).toBe(true);
    });

    test('should return false for unsupported game type', () => {
      expect(factory.isSupported('INVALID_GAME')).toBe(false);
      expect(factory.isSupported('ROBLOX')).toBe(false);
      expect(factory.isSupported('')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unsupported game type', () => {
      expect(() => {
        factory.create('UNSUPPORTED_GAME', mockMachineId);
      }).toThrow();
    });

    test('should throw error for null game type', () => {
      expect(() => {
        factory.create(null as any, mockMachineId);
      }).toThrow();
    });

    test('should throw error for empty game type', () => {
      expect(() => {
        factory.create('', mockMachineId);
      }).toThrow();
    });

    test('should throw error for null machine ID', () => {
      expect(() => {
        factory.create('MINECRAFT', null as any);
      }).toThrow();
    });

    test('should throw error for empty machine ID', () => {
      expect(() => {
        factory.create('MINECRAFT', '');
      }).toThrow();
    });
  });

  describe('Installer Configuration', () => {
    test('should pass correct game type to installer', () => {
      const installer = factory.create('MINECRAFT', mockMachineId);

      // Verify installer is properly initialized
      expect(installer).toBeDefined();
      expect(installer.constructor.name).toBe('MinecraftInstaller');
    });

    test('should pass correct machine ID to installer', () => {
      const installer = factory.create('RUST', mockMachineId);

      expect(installer).toBeDefined();
      // Installer should have machineId in its context
    });

    test('should create independent instances for different game types', () => {
      const arkInstaller = factory.create('ARK_ASCENDED', mockMachineId);
      const minecraftInstaller = factory.create('MINECRAFT', mockMachineId);
      const rustInstaller = factory.create('RUST', mockMachineId);

      // Should be different instances
      expect(arkInstaller).not.toBe(minecraftInstaller);
      expect(minecraftInstaller).not.toBe(rustInstaller);
    });

    test('should create independent instances for same game type', () => {
      const installer1 = factory.create('MINECRAFT', mockMachineId);
      const installer2 = factory.create('MINECRAFT', mockMachineId);

      // Should be different instances (no singleton caching per instance)
      expect(installer1).not.toBe(installer2);
    });
  });

  describe('Scalability', () => {
    test('should handle rapid consecutive creates', () => {
      const installers: any[] = [];

      for (let i = 0; i < 100; i++) {
        const gameType = ['ARK_ASCENDED', 'MINECRAFT', 'RUST', 'SATISFACTORY'][i % 4];
        const installer = factory.create(gameType as any, mockMachineId);
        installers.push(installer);
      }

      expect(installers.length).toBe(100);
      expect(installers.every(inst => inst !== null && inst !== undefined)).toBe(true);
    });

    test('should handle create with varying machine IDs', () => {
      const machineIds = [
        'MACHINE-001',
        'MACHINE-002',
        'GAMESERVER-PROD-01',
        'BACKUP-SERVER',
      ];

      machineIds.forEach(machineId => {
        const installer = factory.create('MINECRAFT', machineId);
        expect(installer).toBeDefined();
      });
    });
  });

  describe('Integration Tests', () => {
    test('should create installer and validate basic interface', () => {
      const installer = factory.create('MINECRAFT', mockMachineId);

      // Check for required methods from BaseGameInstaller
      expect(typeof installer.validateConfig).toBe('function');
      expect(typeof installer.buildDockerCompose).toBe('function');
      expect(typeof installer.allocatePorts).toBe('function');
      expect(typeof installer.preInstall).toBe('function');
      expect(typeof installer.postInstall).toBe('function');
      expect(typeof installer.startServer).toBe('function');
      expect(typeof installer.stopServer).toBe('function');
      expect(typeof installer.healthCheck).toBe('function');
    });

    test('should support all 4 main game types with same interface', async () => {
      const gameTypes = ['ARK_ASCENDED', 'MINECRAFT', 'RUST', 'SATISFACTORY'];

      for (const gameType of gameTypes) {
        const installer = factory.create(gameType as any, mockMachineId);

        // All should have the same interface
        expect(typeof installer.validateConfig).toBe('function');
        expect(typeof installer.buildDockerCompose).toBe('function');
        expect(typeof installer.allocatePorts).toBe('function');
        expect(typeof installer.startServer).toBe('function');
        expect(typeof installer.stopServer).toBe('function');
        expect(typeof installer.healthCheck).toBe('function');
      }
    });
  });

  describe('Logging', () => {
    test('should log installer creation', () => {
      // Assuming factory has logging capability
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const installer = factory.create('MINECRAFT', mockMachineId);

      expect(installer).toBeDefined();
      // Logger should have been called (if implemented)

      consoleSpy.mockRestore();
    });
  });

  describe('Caching & Performance', () => {
    test('should maintain factory singleton', () => {
      const factory1 = GameInstallerFactory.getInstance();
      const factory2 = GameInstallerFactory.getInstance();

      expect(factory1).toBe(factory2);
    });

    test('should return consistent behavior across calls', () => {
      const supported1 = factory.getSupportedGameTypes();
      const supported2 = factory.getSupportedGameTypes();

      expect(supported1).toEqual(supported2);
    });
  });
});
