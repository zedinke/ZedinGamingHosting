/**
 * Test Script: Moduláris Installer Tesztelés
 * 
 * Futtatás: npx ts-node scripts/test-modular-installer.ts
 */

import { gameInstallerFactory } from '../lib/installers/index.js';
import { DebugLogger } from '../lib/installers/utils/DebugLogger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = new DebugLogger('test-installer');

async function testArkAscendedInstallation() {
  try {
    logger.info('🧪 Starting ARK Ascended Installer Test');

    // 1. Test Config
    const testConfig = {
      serverId: `test-${uuidv4().slice(0, 8)}`,
      serverName: 'Test ARK Server',
      maxPlayers: 70,
      port: 27015,
      adminPassword: 'testadmin123',
      serverPassword: 'testpass',
      map: 'TheIsland_WP',
      ram: 8192,
    };

    logger.info('Test config created:', testConfig);

    // 2. Factory-val installer létrehozása
    logger.debug('Creating installer via factory');
    const installer = gameInstallerFactory.create('ARK_ASCENDED', 'test-machine-1');

    // 3. Validation
    logger.debug('Running validation');
    const validation = await installer.validateConfig(testConfig);
    if (!validation.valid) {
      logger.error('Validation failed', undefined, { errors: validation.errors });
      return false;
    }
    logger.info('✅ Validation passed');

    // 4. Port Allocation
    logger.debug('Testing port allocation');
    const ports = await installer.allocatePorts(27015);
    logger.info('✅ Ports allocated:', ports);

    // 5. Docker Compose Generation
    logger.debug('Generating Docker Compose');
    const dockerCompose = installer['buildDockerCompose'](testConfig, ports);
    logger.debug('Docker Compose snippet:', {
      lines: dockerCompose.split('\n').length,
      firstLines: dockerCompose.split('\n').slice(0, 5).join('\n'),
    });

    // 6. Health Check Script
    logger.debug('Generating health check script');
    const healthCheck = installer['buildHealthCheck'](ports);
    logger.info('Health check script length:', healthCheck.length);

    logger.info('✅ All tests passed!');
    logger.info('\n=== FULL LOGS ===\n');
    logger.info(installer.getLogs());

    return true;
  } catch (error: any) {
    logger.error('Test failed', error);
    logger.info('\n=== LOGS ON FAILURE ===\n');
    logger.info(logger.getLogsAsString());
    return false;
  }
}

async function testPortManager() {
  try {
    logger.info('🧪 Testing Port Manager');

    const { portManager } = await import('../lib/installers/utils/PortManager');

    // Test ARK Ascended
    logger.debug('Testing ARK_ASCENDED port allocation');
    const arkPorts = portManager.allocate('ARK_ASCENDED', 27015);
    logger.info('✅ ARK ports:', arkPorts);

    // Test Minecraft
    logger.debug('Testing MINECRAFT port allocation');
    const minecraftPorts = portManager.allocate('MINECRAFT', 25565);
    logger.info('✅ Minecraft ports:', minecraftPorts);

    // Test validation
    logger.debug('Testing validation');
    const isValid = portManager.validate('ARK_ASCENDED', arkPorts);
    logger.info('✅ Validation result:', isValid);

    // Test config fetch
    logger.debug('Fetching all configs');
    const allConfigs = portManager.getAllConfigs();
    logger.info('✅ Supported games:', Object.keys(allConfigs).length);

    return true;
  } catch (error: any) {
    logger.error('Port Manager test failed', error);
    return false;
  }
}

async function testGameInstallerFactory() {
  try {
    logger.info('🧪 Testing Game Installer Factory');

    // Test ARK creation
    logger.debug('Creating ARK_ASCENDED installer');
    const arkInstaller = gameInstallerFactory.create('ARK_ASCENDED', 'machine-1');
    logger.info('✅ ARK installer created:', arkInstaller.constructor.name);

    // Test supported games
    logger.debug('Checking supported games');
    const supported = gameInstallerFactory.getSupportedGameTypes();
    logger.info('✅ Supported games:', supported);

    // Test unsupported game
    logger.debug('Testing unsupported game');
    try {
      gameInstallerFactory.create('UNKNOWN_GAME' as any, 'machine-1');
      logger.error('Should have thrown error for unknown game');
      return false;
    } catch (e: any) {
      logger.info('✅ Correctly rejected unknown game:', e.message);
    }

    return true;
  } catch (error: any) {
    logger.error('Factory test failed', error);
    return false;
  }
}

async function main() {
  console.clear();
  logger.info('╔══════════════════════════════════════╗');
  logger.info('║  Moduláris Installer - Test Suite    ║');
  logger.info('╚══════════════════════════════════════╝\n');

  try {
    const results = {
      portManager: await testPortManager(),
      factory: await testGameInstallerFactory(),
      arkInstaller: await testArkAscendedInstallation(),
    };

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║  TEST RESULTS                        ║');
    console.log('╚══════════════════════════════════════╝\n');

    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`);
    });

    const allPassed = Object.values(results).every((r) => r);
    console.log(`\n${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}\n`);

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    logger.error('Test suite error', error as Error);
    process.exit(1);
  }
}

main();
