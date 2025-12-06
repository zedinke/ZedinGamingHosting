# 🧪 Unit Test Framework - Dokumentáció

**Status**: ✅ SETUP COMPLETE  
**Test Runner**: Jest 30.2.0  
**Test Files**: 6 (1 legacy ARK + 5 new installers)  
**Coverage Target**: 95%+  

---

## 📋 Teszt Fájlok

| Fájl | Tesztek száma | Status | Cél |
|------|---------------|--------|-----|
| `tests/minecraft-installer.test.ts` | 25+ | 🔄 Running | Minecraft config, Docker, ports, health |
| `tests/rust-installer.test.ts` | 20+ | 🔄 Running | Rust + Oxide, 3 ports, world config |
| `tests/satisfactory-installer.test.ts` | 25+ | 🔄 Running | Satisfactory strict limits, 8GB RAM, mods |
| `tests/game-installer-factory.test.ts` | 20+ | 🔄 Running | Factory pattern, game routing, support lists |
| `tests/port-manager.test.ts` | 30+ | 🔄 Running | Port allocation, conflicts, 13 game types |
| `tests/ark-docker.test.ts` | ~45 | ⏳ Legacy | Existing ARK tests (legacy format) |

**Total Test Cases**: 150+

---

## 🚀 Jest Konfigurálás

### `jest.config.js`
```javascript
{
  preset: 'ts-jest',              // TypeScript support
  testEnvironment: 'jsdom',       // Browser-like environment
  roots: ['<rootDir>/tests'],     // Test directory
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'lib/**/*.ts',                // Coverage scope
    '!lib/**/*.d.ts',
    '!**/*.config.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'    // Path alias support
  }
}
```

### `package.json` - Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

---

## 🎯 Teszt Szerkezet

### Minecraft Installer Tests

**Kategóriák**:
1. **Configuration Validation** (8 teszt)
   - Valid config elfogadása
   - maxPlayers range (1-100)
   - Port range (10000-65535)
   - RAM range (512MB-32GB)
   - Default values

2. **Docker Compose Generation** (5 teszt)
   - Valid struktura
   - Memory settings
   - RCON config
   - Game options
   - Health check

3. **Port Allocation** (3 teszt)
   - Single port allocation
   - Auto-allocation
   - Failure handling

4. **Pre-Installation** (1 teszt)
   - preInstall lifecycle

5. **Health Check** (2 teszt)
   - Healthy port
   - Unhealthy port

6. **Logging** (1 teszt)
   - Proper logging levels

---

### Rust Installer Tests

**Kategóriák**:
1. **Configuration Validation** (9 teszt)
   - Valid config
   - maxPlayers (10-1000)
   - Seed validation (0-2147483647)
   - World size (1000-6000)
   - Range checks

2. **Docker Compose** (4 teszt)
   - Oxide framework
   - RCON web interface (8080)
   - Auto-update
   - Server name

3. **Port Allocation** (1 teszt)
   - 3 ports (game, query, RCON)

4. **Resource Allocation** (2 teszt)
   - 8 CPU cores
   - 8GB RAM

5. **Plugin Support** (1 teszt)
   - Plugin directory creation

6. **Health Check** (1 teszt)
   - 3-port verification

7. **Error Handling** (1 teszt)
   - Invalid config gracefully

---

### Satisfactory Installer Tests

**Kategóriák**:
1. **Configuration Validation** (9 teszt)
   - Valid config
   - maxPlayers strict (1-16)
   - 8GB minimum RAM
   - RAM maximum (32GB)
   - Port range

2. **Docker Compose** (5 teszt)
   - Satisfactory image
   - Extended startup grace
   - 3 ports allocation
   - Mod directory
   - Auto-pause config

3. **Resource Allocation** (2 teszt)
   - 8 CPU cores
   - Full RAM allocation

4. **Mod Support** (1 teszt)
   - Mod directory creation

5. **Stabilization Delay** (1 teszt)
   - 10-second init delay

6. **Health Check** (2 teszt)
   - 3-port verification
   - Timeout handling

7. **Config Parameters** (2 teszt)
   - Password
   - Save interval

8. **Error Handling** (2 teszt)
   - Invalid RAM
   - Invalid player count

---

### GameInstallerFactory Tests

**Kategóriák**:
1. **Installer Creation** (5 teszt)
   - ARK_ASCENDED
   - ARK_EVOLVED (legacy)
   - MINECRAFT
   - RUST
   - SATISFACTORY

2. **Game Type Support** (3 teszt)
   - Get supported types list
   - Check support status
   - Reject unsupported

3. **Error Handling** (5 teszt)
   - Unsupported game type
   - Null game type
   - Empty game type
   - Null machine ID
   - Empty machine ID

4. **Installer Configuration** (4 teszt)
   - Correct game type
   - Correct machine ID
   - Independent instances (different games)
   - Independent instances (same game)

5. **Scalability** (2 teszt)
   - Rapid consecutive creates
   - Varying machine IDs

6. **Integration** (2 teszt)
   - Basic interface check
   - All 4 games same interface

7. **Logging** (1 teszt)
   - Creation logging

8. **Performance** (2 teszt)
   - Singleton pattern
   - Consistent behavior

---

### PortManager Tests

**Kategóriák**:
1. **Port Allocation** (4 teszt)
   - ARK_ASCENDED allocation
   - MINECRAFT allocation
   - RUST (multiple ports)
   - SATISFACTORY allocation

2. **Conflict Detection** (4 teszt)
   - Duplicate rejection
   - Same game type collision
   - Cross-game type uniqueness
   - Sequential different ports OK

3. **ARK Port Config** (2 teszt)
   - All 6 ARK ports
   - Cluster support

4. **Port Range Validation** (5 teszt)
   - Valid range (10000-65535)
   - Below 10000 reject
   - Above 65535 reject
   - Port 0 reject
   - Negative reject

5. **Configuration Maps** (1 teszt)
   - 13 game type support

6. **Concurrent Allocation** (2 teszt)
   - Concurrent allocations safe
   - Duplicate concurrent prevent

7. **Singleton Pattern** (2 teszt)
   - getInstance consistency
   - State maintenance

8. **Port Release** (1 teszt)
   - Deallocate and reuse

9. **Error Handling** (6 teszt)
   - Null game type
   - Undefined game type
   - Empty game type
   - Null port
   - Invalid port type
   - Unsupported game type

10. **Performance** (2 teszt)
    - Allocation <100ms
    - Conflict detection <50ms

---

## 🏃 Teszt Futtatás

### Összes Teszt Futtatása
```bash
npm test
```

### Konkrét Teszt File
```bash
npm test minecraft-installer.test.ts
npm test rust-installer.test.ts
npm test satisfactory-installer.test.ts
npm test game-installer-factory.test.ts
npm test port-manager.test.ts
```

### Watch Mode (Fejlesztés közben)
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

**Expected Output**:
```
PASS  tests/minecraft-installer.test.ts
PASS  tests/rust-installer.test.ts
PASS  tests/satisfactory-installer.test.ts
PASS  tests/game-installer-factory.test.ts
PASS  tests/port-manager.test.ts

Test Suites: 5 passed, 5 total
Tests:       150+ passed
Snapshots:   0
Time:        ~10s
Coverage:    > 95%
```

---

## 📊 Coverage Goals

| Komponens | Target | Actual |
|-----------|--------|--------|
| Minecraft Installer | 95% | 🔄 TBD |
| Rust Installer | 95% | 🔄 TBD |
| Satisfactory Installer | 95% | 🔄 TBD |
| GameInstallerFactory | 98% | 🔄 TBD |
| PortManager | 98% | 🔄 TBD |
| BaseGameInstaller | 90% | 🔄 TBD |
| DebugLogger | 85% | 🔄 TBD |
| **Overall** | **95%** | 🔄 TBD |

---

## 🔧 Teszt Írási Template

### Új Installer Teszt
```typescript
import { MyGameInstaller } from '@/lib/installers/games/MyGameInstaller';
import { InstallConfig } from '@/lib/installers/utils/BaseGameInstaller';
import { PortManager } from '@/lib/installers/utils/PortManager';
import { DebugLogger } from '@/lib/installers/utils/DebugLogger';

jest.mock('@/lib/installers/utils/PortManager');
jest.mock('@/lib/installers/utils/DebugLogger');

describe('MyGameInstaller', () => {
  let installer: MyGameInstaller;
  let portManager: jest.Mocked<PortManager>;
  let logger: jest.Mocked<DebugLogger>;

  beforeEach(() => {
    portManager = new PortManager() as jest.Mocked<PortManager>;
    logger = new DebugLogger() as jest.Mocked<DebugLogger>;
    installer = new MyGameInstaller(portManager, logger);
  });

  describe('Configuration Validation', () => {
    test('should accept valid configuration', async () => {
      const validConfig: InstallConfig = {
        orderId: 'ORD-123',
        machineId: 'MACHINE-001',
        gameType: 'MY_GAME',
        maxPlayers: 32,
        port: 25565,
        ram: 2048,
      };

      const result = await installer.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid configuration', async () => {
      const invalidConfig: InstallConfig = {
        // ...
      };

      const result = await installer.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
    });
  });

  // ... More test categories
});
```

---

## 🐛 Troubleshooting

### Teszt Timeout
```typescript
// Set longer timeout for integration tests
jest.setTimeout(30000);
```

### Mock Issues
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

---

## 📈 Next Steps

1. **Run Unit Tests**
   ```bash
   npm test -- --coverage
   ```
   - Check coverage reports
   - Fix failing tests
   - Aim for >95%

2. **E2E Test Execution**
   - Combine unit tests + E2E
   - Verify real order workflow
   - Test concurrent installations

3. **Performance Baseline**
   - Measure test execution time
   - Identify slow tests
   - Optimize if needed

4. **CI/CD Integration**
   - Add to GitHub Actions
   - Run on every commit
   - Block PRs with failures

5. **Additional Installers**
   - Add tests for 7 Days to Die
   - Add tests for Valheim
   - Add tests for The Forest
   - Add tests for other games

---

## 📚 Jest Documentation

- [Jest Official Docs](https://jestjs.io/docs/getting-started)
- [TypeScript with Jest](https://jestjs.io/docs/getting-started#using-typescript)
- [Testing Async Code](https://jestjs.io/docs/asynchronous)
- [Mocking](https://jestjs.io/docs/mock-functions)
- [Snapshot Testing](https://jestjs.io/docs/snapshot-testing)

---

**Test Infrastructure**: ✅ READY  
**150+ Test Cases**: ✅ CREATED  
**Next Phase**: E2E + Manual Testing  
**Target Coverage**: > 95%  

🎯 **Go! Run the tests and start debugging!**
