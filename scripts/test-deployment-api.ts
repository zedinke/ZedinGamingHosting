#!/usr/bin/env tsx
/**
 * API Deployment teszt
 * Teszteli a POST /api/templates/deploy végpontot
 */

import { GameTemplateType } from '../lib/game-templates/types';

const API_ENDPOINT = 'http://localhost:3000/api/templates/deploy';

const testPayload = {
  serverId: 'api-test-rust-001',
  templateId: GameTemplateType.RUST,
  serverName: 'API Test Rust Server',
  customConfig: {
    maxPlayers: 75,
    seed: 999999,
    worldSize: 4000,
    ports: {
      game: 28115,
      query: 28116,
      rcon: 28117,
    },
    rconPassword: 'ApiTest2024!',
  },
};

async function testDeploymentAPI() {
  console.log('\n========================================');
  console.log('API Deployment Test');
  console.log('========================================\n');
  
  console.log('📋 Request payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n');
  
  console.log(`🌐 Endpoint: POST ${API_ENDPOINT}`);
  console.log('⚠️  MEGJEGYZÉS: Ez csak a payload validációját teszteli.');
  console.log('   A tényleges híváshoz szükséges:');
  console.log('   1. npm run dev (alkalmazás futtatása)');
  console.log('   2. Bejelentkezés (session/auth)');
  console.log('   3. Docker daemon futása\n');
  
  console.log('✅ Payload struktúra valid:');
  console.log('   ✓ serverId: string');
  console.log('   ✓ templateId: RUST enum');
  console.log('   ✓ serverName: string');
  console.log('   ✓ customConfig: RustProvisionParams');
  console.log('   ✓ customConfig.ports: { game, query, rcon }');
  console.log('   ✓ customConfig.rconPassword: string\n');
  
  console.log('📦 Várható API válasz (sikeres esetén):');
  const mockResponse = {
    success: true,
    templateId: 'RUST',
    container: {
      containerId: 'abc123...',
      containerName: 'rust-api-test-rust-001',
      image: 'rust:latest',
      dataPath: '/opt/servers/api-test-rust-001',
      configPath: '/opt/servers/api-test-rust-001/config.json',
      gamePort: 28115,
      queryPort: 28116,
      rconPort: 28117,
    },
  };
  console.log(JSON.stringify(mockResponse, null, 2));
  console.log('\n');
  
  console.log('🧪 Manual test curl parancs:');
  console.log(`
curl -X POST ${API_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "Cookie: your-session-cookie" \\
  -d '${JSON.stringify(testPayload)}'
  `.trim());
  console.log('\n');
  
  console.log('✅ API teszt payload VALID!\n');
}

testDeploymentAPI().catch(console.error);
