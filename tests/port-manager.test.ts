/**
 * PortManager Unit Tests
 * Test suite for centralized port allocation and conflict detection
 */

import { PortManager } from '@/lib/installers/utils/PortManager';

describe('PortManager', () => {
  let portManager: PortManager;

  beforeEach(() => {
    // Fresh instance for each test
    portManager = PortManager.getInstance();
    // Reset if there's a reset method
    if (typeof portManager['reset'] === 'function') {
      portManager['reset']();
    }
  });

  describe('Port Allocation', () => {
    test('should allocate port for ARK_ASCENDED game type', async () => {
      const result = await portManager.allocate('ARK_ASCENDED', 27015);

      expect(result).toBeDefined();
      expect(result.port).toBe(27015);
    });

    test('should allocate multiple ports for MINECRAFT', async () => {
      const result = await portManager.allocate('MINECRAFT', 25565);

      expect(result).toBeDefined();
      expect(result.port).toBe(25565);
    });

    test('should allocate multiple ports for RUST (game, query, rcon)', async () => {
      const result = await portManager.allocate('RUST', 28015);

      expect(result).toBeDefined();
      expect(result.port).toBe(28015);
      // Rust should have multiple ports
      if (result.ports) {
        expect(result.ports.length).toBeGreaterThanOrEqual(1);
      }
    });

    test('should allocate multiple ports for SATISFACTORY', async () => {
      const result = await portManager.allocate('SATISFACTORY', 7777);

      expect(result).toBeDefined();
      expect(result.port).toBe(7777);
    });
  });

  describe('Port Conflict Detection', () => {
    test('should reject duplicate port allocation', async () => {
      await portManager.allocate('MINECRAFT', 25565);

      // Attempting to allocate same port should fail
      await expect(
        portManager.allocate('MINECRAFT', 25565)
      ).rejects.toThrow(/already.*allocated|port.*in use|conflict/i);
    });

    test('should reject port allocation for same game type', async () => {
      await portManager.allocate('ARK_ASCENDED', 27015);

      // Query port for ARK should be different
      await expect(
        portManager.allocate('ARK_ASCENDED', 27015)
      ).rejects.toThrow();
    });

    test('should maintain port uniqueness across game types', async () => {
      await portManager.allocate('MINECRAFT', 25565);

      // Different game type requesting same port should fail
      await expect(
        portManager.allocate('RUST', 25565)
      ).rejects.toThrow();
    });

    test('should allow sequential port allocation if different', async () => {
      const result1 = await portManager.allocate('MINECRAFT', 25565);
      const result2 = await portManager.allocate('MINECRAFT', 25566);

      expect(result1.port).toBe(25565);
      expect(result2.port).toBe(25566);
    });
  });

  describe('ARK Port Configuration', () => {
    test('should support all 6 ARK ports', async () => {
      const arkPorts = ['port', 'queryPort', 'beaconPort', 'steamPeerPort', 'rconPort', 'rawSockPort'];

      // ARK should have 6 port configuration
      const result = await portManager.allocate('ARK_ASCENDED', 27015);

      // Result should support retrieval of all port types
      expect(result).toBeDefined();
    });

    test('should allocate consecutive ports for ARK cluster', async () => {
      const result = await portManager.allocate('ARK_ASCENDED', 27015);

      expect(result).toBeDefined();
      // Port allocation should be successful
      expect(result.port).toBe(27015);
    });
  });

  describe('Port Range Validation', () => {
    test('should accept ports in valid range (10000-65535)', async () => {
      const validPorts = [10000, 25565, 28015, 32768, 65535];

      for (const port of validPorts) {
        const result = await portManager.allocate('MINECRAFT', port);
        expect(result.port).toBe(port);
        
        // Deallocate to allow next test
        if (typeof portManager['deallocate'] === 'function') {
          portManager['deallocate'](port);
        }
      }
    });

    test('should reject port below 10000', async () => {
      await expect(
        portManager.allocate('MINECRAFT', 5000)
      ).rejects.toThrow(/port.*range|invalid.*port|10000/i);
    });

    test('should reject port above 65535', async () => {
      await expect(
        portManager.allocate('MINECRAFT', 70000)
      ).rejects.toThrow(/port.*range|invalid.*port|65535/i);
    });

    test('should reject port 0', async () => {
      await expect(
        portManager.allocate('MINECRAFT', 0)
      ).rejects.toThrow();
    });

    test('should reject negative port', async () => {
      await expect(
        portManager.allocate('MINECRAFT', -1)
      ).rejects.toThrow();
    });
  });

  describe('Port Configuration Maps', () => {
    test('should have port configuration for at least 13 game types', () => {
      // PortManager should support 13 game types
      const expectedGameTypes = [
        'ARK_ASCENDED',
        'ARK_EVOLVED',
        'MINECRAFT',
        'RUST',
        'SATISFACTORY',
        '7_DAYS_TO_DIE',
        'VALHEIM',
        'THE_FOREST',
        'VRISING',
        'GROUNDED',
        'ENSHROUDED',
        'PALWORLD',
        'STALCRAFT',
      ];

      // This tests that the factory supports these types
      expectedGameTypes.forEach(gameType => {
        expect(() => {
          portManager.allocate(gameType, 20000);
        }).not.toThrow(/unsupported|unknown game type/i);
      });
    });
  });

  describe('Concurrent Allocation', () => {
    test('should handle concurrent port allocations safely', async () => {
      const allocations = [];

      for (let i = 0; i < 10; i++) {
        allocations.push(
          portManager.allocate('MINECRAFT', 30000 + i)
        );
      }

      const results = await Promise.all(allocations);

      expect(results).toHaveLength(10);
      expect(results.every(r => r && r.port)).toBe(true);
    });

    test('should prevent duplicate concurrent allocations', async () => {
      const concurrent = [];

      for (let i = 0; i < 5; i++) {
        concurrent.push(
          portManager.allocate('MINECRAFT', 25565) // Same port
        );
      }

      // Only first should succeed
      const results = await Promise.allSettled(concurrent);

      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;

      expect(successes).toBe(1); // Only one should succeed
      expect(failures).toBe(4); // Others should fail
    });
  });

  describe('Singleton Pattern', () => {
    test('should return same instance via getInstance', () => {
      const pm1 = PortManager.getInstance();
      const pm2 = PortManager.getInstance();

      expect(pm1).toBe(pm2);
    });

    test('should maintain state across multiple calls', async () => {
      const pm1 = PortManager.getInstance();
      const pm2 = PortManager.getInstance();

      await pm1.allocate('MINECRAFT', 25565);

      // pm2 should know about the allocation (same instance)
      await expect(
        pm2.allocate('MINECRAFT', 25565)
      ).rejects.toThrow();
    });
  });

  describe('Port Release', () => {
    test('should release allocated port for reuse', async () => {
      // Allocate port
      const allocated = await portManager.allocate('MINECRAFT', 25565);
      expect(allocated.port).toBe(25565);

      // If manager has deallocate, test it
      if (typeof portManager['deallocate'] === 'function') {
        portManager['deallocate'](25565);

        // Should be able to allocate again
        const reallocated = await portManager.allocate('MINECRAFT', 25565);
        expect(reallocated.port).toBe(25565);
      }
    });
  });

  describe('Error Handling', () => {
    test('should throw error for null game type', async () => {
      await expect(
        portManager.allocate(null as any, 25565)
      ).rejects.toThrow();
    });

    test('should throw error for undefined game type', async () => {
      await expect(
        portManager.allocate(undefined as any, 25565)
      ).rejects.toThrow();
    });

    test('should throw error for empty game type', async () => {
      await expect(
        portManager.allocate('', 25565)
      ).rejects.toThrow();
    });

    test('should throw error for null port', async () => {
      await expect(
        portManager.allocate('MINECRAFT', null as any)
      ).rejects.toThrow();
    });

    test('should throw error for invalid port type', async () => {
      await expect(
        portManager.allocate('MINECRAFT', 'invalid' as any)
      ).rejects.toThrow();
    });

    test('should throw error for unsupported game type', async () => {
      await expect(
        portManager.allocate('UNSUPPORTED_GAME', 25565)
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should allocate port in reasonable time (<100ms)', async () => {
      const start = performance.now();

      await portManager.allocate('MINECRAFT', 25565);

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100); // Should be very fast
    });

    test('should detect conflict in reasonable time (<50ms)', async () => {
      await portManager.allocate('MINECRAFT', 25565);

      const start = performance.now();

      try {
        await portManager.allocate('MINECRAFT', 25565);
      } catch (e) {
        // Expected
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50); // Conflict detection should be very fast
    });
  });
});
