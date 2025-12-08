/**
 * Port Manager Teszt Script
 * Port allokáció és felszabadítás tesztelése
 */

// .env fájl betöltése
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import { PortManager } from '@/lib/port-manager';
import { prisma } from '@/lib/prisma';
import { GameType, ServerStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

async function testPortManager() {
  console.log('=== Port Manager Teszt ===\n');

  try {
    // 1. Teszt gép keresése (GameServer-1)
    const testMachine = await prisma.serverMachine.findFirst({
      where: {
        name: {
          contains: 'GameServer',
        },
      },
      include: {
        agents: {
          where: { status: 'ONLINE' },
          take: 1,
        },
      },
    });

    if (!testMachine) {
      throw new Error('Nincs teszt gép (GameServer) az adatbázisban');
    }

    if (testMachine.agents.length === 0) {
      throw new Error('Nincs online agent a teszt gépen');
    }

    console.log(`✅ Teszt gép található: ${testMachine.name} (${testMachine.ipAddress})`);
    console.log(`   Agent: ${testMachine.agents[0].agentId}\n`);

    // Felhasználó lekérése (egyszer, a függvény elején)
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      throw new Error('Nincs felhasználó az adatbázisban');
    }

    // 2. Teszt szerver létrehozása (ha nincs)
    console.log('📌 1. Teszt szerver létrehozása...');
    const testServerId = `test-${Date.now()}`;
    
    // Ellenőrizzük, hogy van-e már teszt szerver
    const existingServer = await prisma.server.findUnique({
      where: { id: testServerId },
    });

    if (!existingServer) {
      // Teszt szerver létrehozása

      await prisma.server.create({
        data: {
          id: testServerId,
          name: 'Test Server',
          gameType: GameType.SEVEN_DAYS_TO_DIE,
          status: ServerStatus.PROVISIONING,
          machineId: testMachine.id,
          agentId: testMachine.agents[0].id,
          userId: firstUser.id,
        },
      });
      console.log(`✅ Teszt szerver létrehozva: ${testServerId}\n`);
    } else {
      console.log(`⚠️  Teszt szerver már létezik: ${testServerId}\n`);
    }

    // 3. Port allokáció teszt (7 Days to Die)
    console.log('📌 2. Port allokáció teszt (7 Days to Die)...');
    
    const allocatedPorts = await PortManager.allocatePorts(
      testMachine.id,
      GameType.SEVEN_DAYS_TO_DIE,
      testServerId
    );

    console.log('✅ Portok allokálva:');
    console.log(`   Game Port: ${allocatedPorts.port}`);
    console.log(`   Telnet Port: ${allocatedPorts.telnetPort}`);
    console.log(`   WebMap Port: ${allocatedPorts.webMapPort}\n`);

    // 4. Port elérhetőség ellenőrzés
    console.log('📌 3. Port elérhetőség ellenőrzés...');
    const availability = await PortManager.checkPortAvailability(
      testMachine.id,
      allocatedPorts.port
    );

    if (availability.available) {
      console.log(`✅ Port ${allocatedPorts.port} elérhető a gépen\n`);
    } else {
      console.log(`⚠️  Port ${allocatedPorts.port} foglalt: ${availability.reason}\n`);
    }

    // 5. Port felszabadítás teszt
    console.log('📌 4. Port felszabadítás teszt...');
    await PortManager.deallocatePorts(testServerId);
    console.log('✅ Portok felszabadítva\n');

    // 6. Konfliktus teszt (ugyanaz a port újra)
    console.log('📌 5. Konfliktus teszt (ugyanaz a port újra)...');
      const testServerId2 = `test-${Date.now()}-2`;
      
      // Teszt szerver 2 létrehozása
      await prisma.server.create({
        data: {
          id: testServerId2,
          name: 'Test Server 2',
          gameType: GameType.SEVEN_DAYS_TO_DIE,
          status: ServerStatus.PROVISIONING,
          machineId: testMachine.id,
          agentId: testMachine.agents[0].id,
          userId: firstUser.id,
        },
      });
      
      try {
        // Próbáljuk ugyanazt a portot allokálni
        await PortManager.allocatePorts(
          testMachine.id,
          GameType.SEVEN_DAYS_TO_DIE,
          testServerId2,
          allocatedPorts.port
        );
      
      // Ellenőrizzük, hogy valóban ugyanaz a port lett-e
      const allocation = await prisma.portAllocation.findUnique({
        where: { serverId: testServerId2 },
      });

      if (allocation && allocation.port === allocatedPorts.port) {
        console.log(`✅ Port ${allocatedPorts.port} újra allokálva (felszabadítás után)\n`);
      } else {
        console.log(`⚠️  Port változott: ${allocation?.port} (helyett ${allocatedPorts.port})\n`);
      }

      // Felszabadítás
      await PortManager.deallocatePorts(testServerId2);
    } catch (error: any) {
      console.log(`❌ Konfliktus teszt hiba: ${error.message}\n`);
    }

    // 7. Több port allokáció teszt
    console.log('📌 6. Több port allokáció teszt...');
    const testServers: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const testServerId = `test-${Date.now()}-${i}`;
      testServers.push(testServerId);
      
      // Teszt szerver létrehozása
      await prisma.server.create({
        data: {
          id: testServerId,
          name: `Test Server ${i + 1}`,
          gameType: GameType.SEVEN_DAYS_TO_DIE,
          status: ServerStatus.PROVISIONING,
          machineId: testMachine.id,
          agentId: testMachine.agents[0].id,
          userId: firstUser.id,
        },
      });
      
      const ports = await PortManager.allocatePorts(
        testMachine.id,
        GameType.SEVEN_DAYS_TO_DIE,
        testServerId
      );
      
      console.log(`   Szerver ${i + 1}: Port ${ports.port}`);
    }

    console.log('✅ Több port allokáció sikeres\n');

    // Felszabadítás és szerver törlés
    for (const serverId of testServers) {
      await PortManager.deallocatePorts(serverId);
      // Teszt szerver törlése
      try {
        await prisma.server.delete({ where: { id: serverId } });
      } catch (error) {
        // Ignoráljuk, ha már törölve van
      }
    }
    console.log('✅ Teszt portok felszabadítva\n');

    console.log('=== Port Manager Teszt Sikeres ===');
  } catch (error: any) {
    console.error('❌ Port Manager teszt hiba:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Script futtatása
testPortManager().catch(console.error);

