/**
 * Script a GameServer-1-en futó Rust és Satisfactory szerverek leállításához és törléséhez
 * Közvetlen SSH-n keresztül, adatbázis nélkül
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function stopAndDeleteServersDirect() {
  try {
    console.log('=== GameServer-1 szerverek leállítása és törlése ===\n');

    // GameServer-1 SSH konfiguráció
    const gameServerHost = '95.217.194.148';
    const gameServerUser = 'root';
    const gameServerKey = join(homedir(), '.ssh', 'gameserver1_key');

    console.log(`GameServer-1: ${gameServerHost}`);
    console.log(`SSH Key: ${gameServerKey}\n`);

    // 1. Systemd service-ek listázása (server-* névvel)
    console.log('📋 Systemd service-ek keresése...\n');
    const listServicesCommand = `ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "systemctl list-units --type=service --state=running | grep 'server-' || echo 'NINCS_SERVICE'"`;
    
    const { stdout: servicesOutput } = await execAsync(listServicesCommand);
    
    if (servicesOutput.includes('NINCS_SERVICE')) {
      console.log('ℹ️  Nincs futó server-* systemd service\n');
    } else {
      console.log('Futó service-ek:');
      console.log(servicesOutput);
      
      // Service nevek kinyerése
      const serviceMatches = servicesOutput.match(/server-[\w-]+\.service/g);
      if (serviceMatches) {
        const serviceNames = [...new Set(serviceMatches.map(s => s.replace('.service', '')))];
        
        for (const serviceName of serviceNames) {
          console.log(`\n📌 Service: ${serviceName}`);
          
          // Service leállítása
          console.log(`   🔴 Service leállítása...`);
          try {
            await execAsync(`ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "systemctl stop ${serviceName} 2>/dev/null || true"`);
            console.log(`   ✅ Service leállítva`);
          } catch (error: any) {
            console.log(`   ⚠️  Service leállítási hiba: ${error.message}`);
          }

          // Service disable és törlés
          console.log(`   🗑️  Service disable és törlés...`);
          try {
            await execAsync(`ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "systemctl disable ${serviceName} 2>/dev/null || true && rm -f /etc/systemd/system/${serviceName}.service 2>/dev/null || true"`);
            await execAsync(`ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "systemctl daemon-reload 2>/dev/null || true"`);
            console.log(`   ✅ Service törölve`);
          } catch (error: any) {
            console.log(`   ⚠️  Service törlési hiba: ${error.message}`);
          }
        }
      }
    }

    // 2. Docker container-ek keresése (rust, satisfactory)
    console.log('\n📋 Docker container-ek keresése...\n');
    const listContainersCommand = `ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "docker ps -a --format '{{.Names}}' | grep -E '(rust|satisfactory|satis)' || echo 'NINCS_CONTAINER'"`;
    
    const { stdout: containersOutput } = await execAsync(listContainersCommand);
    
    if (containersOutput.includes('NINCS_CONTAINER')) {
      console.log('ℹ️  Nincs rust vagy satisfactory Docker container\n');
    } else {
      console.log('Docker container-ek:');
      console.log(containersOutput);
      
      const containerNames = containersOutput
        .split('\n')
        .filter(line => line.trim() && !line.includes('NINCS_CONTAINER'))
        .map(line => line.trim());
      
      for (const containerName of containerNames) {
        console.log(`\n📌 Container: ${containerName}`);
        
        // Container leállítása
        console.log(`   🔴 Container leállítása...`);
        try {
          await execAsync(`ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "docker stop ${containerName} 2>/dev/null || true"`);
          console.log(`   ✅ Container leállítva`);
        } catch (error: any) {
          console.log(`   ⚠️  Container leállítási hiba: ${error.message}`);
        }

        // Container törlése
        console.log(`   🗑️  Container törlése...`);
        try {
          await execAsync(`ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "docker rm ${containerName} 2>/dev/null || true"`);
          console.log(`   ✅ Container törölve`);
        } catch (error: any) {
          console.log(`   ⚠️  Container törlési hiba: ${error.message}`);
        }
      }
    }

    // 3. Szerver könyvtárak keresése (/opt/servers/*)
    console.log('\n📋 Szerver könyvtárak keresése...\n');
    const listDirsCommand = `ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "ls -d /opt/servers/* 2>/dev/null | head -20 || echo 'NINCS_DIR'"`;
    
    const { stdout: dirsOutput } = await execAsync(listDirsCommand);
    
    if (dirsOutput.includes('NINCS_DIR')) {
      console.log('ℹ️  Nincs szerver könyvtár /opt/servers/ alatt\n');
    } else {
      console.log('Szerver könyvtárak:');
      console.log(dirsOutput);
      
      const dirPaths = dirsOutput
        .split('\n')
        .filter(line => line.trim() && !line.includes('NINCS_DIR'))
        .map(line => line.trim());
      
      // Rust és Satisfactory szerverek könyvtárainak keresése
      for (const dirPath of dirPaths) {
        console.log(`\n📌 Könyvtár: ${dirPath}`);
        
        // Ellenőrizzük, hogy Rust vagy Satisfactory szerver-e
        const checkCommand = `ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "test -f ${dirPath}/RustDedicated_Data/ServerIdentity/identity.json && echo 'RUST' || (test -d ${dirPath}/FactoryGame && echo 'SATISFACTORY' || echo 'OTHER')"`;
        
        try {
          const { stdout: gameType } = await execAsync(checkCommand);
          const gameTypeStr = gameType.trim();
          
          if (gameTypeStr === 'RUST' || gameTypeStr === 'SATISFACTORY') {
            console.log(`   🎮 Játék típus: ${gameTypeStr}`);
            console.log(`   🗑️  Könyvtár törlése...`);
            
            await execAsync(`ssh -i "${gameServerKey}" -o ConnectTimeout=10 ${gameServerUser}@${gameServerHost} "rm -rf ${dirPath} 2>/dev/null || true"`);
            console.log(`   ✅ Könyvtár törölve`);
          } else {
            console.log(`   ℹ️  Más játék típus, kihagyva`);
          }
        } catch (error: any) {
          console.log(`   ⚠️  Ellenőrzési hiba: ${error.message}`);
        }
      }
    }

    console.log('\n=== Kész! ===\n');
    console.log('✅ Szerverek leállítva és törölve a GameServer-1-en');
    console.log('\n💡 Fontos: Az adatbázisból még manuálisan kell törölni a szervereket!');

  } catch (error: any) {
    console.error('\n❌ Hiba:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

stopAndDeleteServersDirect().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

