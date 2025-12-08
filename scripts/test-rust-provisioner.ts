#!/usr/bin/env tsx
/**
 * Rust Provisioner teszt script
 * Szimulálja a deployment folyamatot Docker nélkül (dry-run)
 */

import { RustProvisionParams } from '../lib/provisioning/rust-provisioner';

// Mock exec async
const mockExecAsync = async (command: string): Promise<{ stdout: string; stderr: string }> => {
  console.log(`[MOCK EXEC] ${command}`);
  
  if (command.includes('docker image inspect')) {
    throw new Error('Image not found'); // Trigger build
  }
  
  if (command.includes('docker build')) {
    return { stdout: 'Successfully built abc123\nSuccessfully tagged rust:latest', stderr: '' };
  }
  
  if (command.includes('docker rm')) {
    return { stdout: 'rust-test-srv-001', stderr: '' };
  }
  
  if (command.includes('docker run')) {
    return { stdout: '1234567890abcdef', stderr: '' };
  }
  
  return { stdout: '', stderr: '' };
};

// Mock fs
const mockFs = {
  mkdir: async (path: string, opts: any) => {
    console.log(`[MOCK FS] mkdir: ${path}`);
  },
  writeFile: async (path: string, data: string) => {
    console.log(`[MOCK FS] writeFile: ${path}`);
    console.log(`[MOCK FS] Content:\n${data}`);
  },
};

// Teszt paraméterek
const testParams: RustProvisionParams = {
  serverId: 'test-srv-001',
  serverName: 'Zed Rust Test #1',
  maxPlayers: 50,
  seed: 424242,
  worldSize: 3000,
  ports: {
    game: 28025,
    query: 28026,
    rcon: 28027,
  },
  rconPassword: 'TestPassword123',
};

async function runTest() {
  console.log('\n========================================');
  console.log('Rust Provisioner - Dry Run Test');
  console.log('========================================\n');
  
  console.log('📋 Test paraméterek:');
  console.log(JSON.stringify(testParams, null, 2));
  console.log('\n');
  
  console.log('🔧 Szimuláció lépései:\n');
  
  // 1. Könyvtár létrehozás
  const serverDir = `/opt/servers/${testParams.serverId}`;
  await mockFs.mkdir(serverDir, { recursive: true });
  
  // 2. Config generálás
  const config = {
    serverName: testParams.serverName,
    maxPlayers: testParams.maxPlayers ?? 100,
    seed: testParams.seed ?? 12345,
    worldSize: testParams.worldSize ?? 3500,
    rconPassword: testParams.rconPassword ?? 'change_me',
    ports: {
      game: testParams.ports?.game ?? 28015,
      query: testParams.ports?.query ?? 28016,
      rcon: testParams.ports?.rcon ?? 28017,
    },
  };
  
  await mockFs.writeFile(
    `${serverDir}/config.json`,
    JSON.stringify(config, null, 2)
  );
  
  // 3. Image check/build
  console.log('\n[STEP] Docker image ellenőrzés...');
  try {
    await mockExecAsync('docker image inspect rust:latest');
    console.log('✅ Image már létezik');
  } catch {
    console.log('⚠️  Image nem található, build indítása...');
    await mockExecAsync('docker build -t rust:latest lib/game-templates/docker/rust');
    console.log('✅ Image sikeresen build-elve');
  }
  
  // 4. Létező container törlése
  console.log('\n[STEP] Létező container törlése (ha van)...');
  try {
    await mockExecAsync('docker rm -f rust-test-srv-001');
    console.log('✅ Régi container törölve');
  } catch {
    console.log('ℹ️  Nincs korábbi container');
  }
  
  // 5. Container indítás
  console.log('\n[STEP] Container indítása...');
  const runCmd = [
    'docker run -d',
    `--name rust-${testParams.serverId}`,
    '--restart unless-stopped',
    `-v ${serverDir}:/rust`,
    `-p ${config.ports.game}:28015/udp`,
    `-p ${config.ports.query}:28016/udp`,
    `-p ${config.ports.rcon}:28017/tcp`,
    'rust:latest',
  ].join(' ');
  
  const containerId = await mockExecAsync(runCmd);
  console.log(`✅ Container elindítva: ${containerId.stdout.substring(0, 12)}`);
  
  // 6. Eredmény
  console.log('\n========================================');
  console.log('✅ Deployment szimuláció SIKERES');
  console.log('========================================\n');
  
  const result = {
    containerId: containerId.stdout,
    containerName: `rust-${testParams.serverId}`,
    image: 'rust:latest',
    dataPath: serverDir,
    configPath: `${serverDir}/config.json`,
    gamePort: config.ports.game,
    queryPort: config.ports.query,
    rconPort: config.ports.rcon,
  };
  
  console.log('📦 Provision eredmény:');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n');
  
  console.log('🎮 Szerver részletek:');
  console.log(`   Név: ${testParams.serverName}`);
  console.log(`   Container: ${result.containerName}`);
  console.log(`   Game port: ${result.gamePort}/udp`);
  console.log(`   Query port: ${result.queryPort}/udp`);
  console.log(`   RCON port: ${result.rconPort}/tcp`);
  console.log(`   Data path: ${result.dataPath}`);
  console.log('\n');
  
  console.log('✅ Teszt befejezve!\n');
}

runTest().catch(console.error);
