/**
 * Script a GameServer-1-en futó Rust és Satisfactory szerverek leállításához és törléséhez
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Környezeti változók betöltése
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  // Próbáljuk meg a parent könyvtárakban is
  const parentEnvPath = resolve(process.cwd(), '..', '.env');
  if (existsSync(parentEnvPath)) {
    config({ path: parentEnvPath });
  } else {
    console.warn('⚠️  .env fájl nem található. Próbáljuk a környezeti változókat használni.');
  }
}

// Prisma import (ez már kezeli a környezeti változókat) - a függvényben történik

async function stopAndDeleteServers() {
  const { prisma } = await import('@/lib/prisma');
  const { logger } = await import('@/lib/logger');
  const { executeSSHCommand } = await import('@/lib/ssh-client');
  
  try {
    console.log('=== GameServer-1 szerverek leállítása és törlése ===\n');

    // GameServer-1 gép keresése
    const gameServer1 = await prisma.serverMachine.findFirst({
      where: {
        OR: [
          { name: 'GameServer-1' },
          { ipAddress: '95.217.194.148' },
        ],
      },
      include: {
        agents: {
          where: { status: 'ONLINE' },
          take: 1,
        },
        servers: {
          where: {
            gameType: {
              in: ['RUST', 'SATISFACTORY'],
            },
          },
          include: {
            agent: true,
          },
        },
      },
    });

    if (!gameServer1) {
      console.log('❌ GameServer-1 nem található az adatbázisban');
      return;
    }

    console.log(`✅ GameServer-1 található: ${gameServer1.name} (${gameServer1.ipAddress})`);
    console.log(`   Szerverek száma: ${gameServer1.servers.length}\n`);

    if (gameServer1.servers.length === 0) {
      console.log('ℹ️  Nincs Rust vagy Satisfactory szerver a GameServer-1-en');
      return;
    }

    // SSH konfiguráció
    const sshConfig = {
      host: gameServer1.ipAddress,
      port: gameServer1.sshPort || 22,
      user: gameServer1.sshUser || 'root',
      keyPath: gameServer1.sshKeyPath || join(homedir(), '.ssh', 'gameserver1_key'),
    };

    // Minden szerver leállítása és törlése
    for (const server of gameServer1.servers) {
      console.log(`\n📌 Szerver: ${server.name} (${server.gameType})`);
      console.log(`   ID: ${server.id}`);
      console.log(`   Státusz: ${server.status}`);

      // 1. Systemd service leállítása
      const serviceName = `server-${server.id}`;
      console.log(`\n   🔴 Systemd service leállítása: ${serviceName}`);
      
      try {
        await executeSSHCommand(
          sshConfig,
          `systemctl stop ${serviceName} 2>/dev/null || true`
        );
        console.log(`   ✅ Service leállítva`);
      } catch (error: any) {
        console.log(`   ⚠️  Service leállítási hiba (nem kritikus): ${error.message}`);
      }

      // 2. Systemd service fájl törlése
      console.log(`   🗑️  Systemd service fájl törlése...`);
      try {
        await executeSSHCommand(
          sshConfig,
          `systemctl disable ${serviceName} 2>/dev/null || true && rm -f /etc/systemd/system/${serviceName}.service 2>/dev/null || true`
        );
        await executeSSHCommand(
          sshConfig,
          `systemctl daemon-reload 2>/dev/null || true`
        );
        console.log(`   ✅ Service fájl törölve`);
      } catch (error: any) {
        console.log(`   ⚠️  Service fájl törlési hiba (nem kritikus): ${error.message}`);
      }

      // 3. Szerver könyvtár törlése
      const serverPath = `/opt/servers/${server.id}`;
      console.log(`   🗑️  Szerver könyvtár törlése: ${serverPath}`);
      try {
        await executeSSHCommand(
          sshConfig,
          `rm -rf ${serverPath} 2>/dev/null || true`
        );
        console.log(`   ✅ Szerver könyvtár törölve`);
      } catch (error: any) {
        console.log(`   ⚠️  Könyvtár törlési hiba (nem kritikus): ${error.message}`);
      }

      // 4. Port allokáció törlése
      console.log(`   🗑️  Port allokáció törlése...`);
      try {
        await prisma.portAllocation.deleteMany({
          where: { serverId: server.id },
        });
        console.log(`   ✅ Port allokáció törölve`);
      } catch (error: any) {
        console.log(`   ⚠️  Port allokáció törlési hiba (nem kritikus): ${error.message}`);
      }

      // 5. Task-ok törlése
      console.log(`   🗑️  Task-ok törlése...`);
      try {
        await prisma.task.deleteMany({
          where: { serverId: server.id },
        });
        console.log(`   ✅ Task-ok törölve`);
      } catch (error: any) {
        console.log(`   ⚠️  Task törlési hiba (nem kritikus): ${error.message}`);
      }

      // 6. Szerver törlése az adatbázisból
      console.log(`   🗑️  Szerver törlése az adatbázisból...`);
      try {
        await prisma.server.delete({
          where: { id: server.id },
        });
        console.log(`   ✅ Szerver törölve az adatbázisból`);
      } catch (error: any) {
        console.log(`   ❌ Szerver törlési hiba: ${error.message}`);
        throw error;
      }
    }

    console.log('\n=== Kész! ===\n');
    console.log(`✅ ${gameServer1.servers.length} szerver sikeresen leállítva és törölve`);

  } catch (error: any) {
    console.error('\n❌ Hiba:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  }
}

stopAndDeleteServers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

