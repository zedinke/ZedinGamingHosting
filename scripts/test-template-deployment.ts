/**
 * Template Deployment Teszt Script
 * Template letöltés, kibontás és container indítás tesztelése
 */

// .env fájl betöltése
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import { TemplateDeployer } from '@/lib/game-templates/services/template-deployer';
import { getTemplate } from '@/lib/game-templates/models/templates';
import { GameTemplateType } from '@/lib/game-templates/types';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

async function testTemplateDeployment() {
  console.log('=== Template Deployment Teszt ===\n');

  try {
    // 1. Teszt gép és agent keresése
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

    // 2. Template információ ellenőrzés
    console.log('📌 1. Template információ ellenőrzés...');
    const template = getTemplate(GameTemplateType.SEVEN_DAYS_TO_DIE);
    
    if (!template) {
      throw new Error('7 Days to Die template nem található');
    }

    console.log(`✅ Template található: ${template.name} v${template.version}`);
    console.log(`   Docker Image: ${template.dockerImage}`);
    console.log(`   Google Drive File ID: ${template.gdrive.fileId || 'NINCS BEÁLLÍTVA'}`);
    console.log(`   File Name: ${template.gdrive.fileName}\n`);

    if (!template.gdrive.fileId) {
      console.log('⚠️  FIGYELMEZTETÉS: Google Drive fileId nincs beállítva!');
      console.log('   A template letöltés nem fog működni.\n');
      console.log('   Következő lépések:');
      console.log('   1. Build a Docker image-t: scripts/build-7days-template.sh');
      console.log('   2. Töltsd fel a template-t Google Drive-ra');
      console.log('   3. Állítsd be a fileId-t a lib/game-templates/models/templates.ts-ben\n');
      return;
    }

    // 3. Teszt szerver létrehozása (ha nincs)
    console.log('📌 2. Teszt szerver létrehozása...');
    const testServerId = `test-7dtd-${Date.now()}`;
    
    // Ellenőrizzük, hogy van-e már teszt szerver
    const existingServer = await prisma.server.findUnique({
      where: { id: testServerId },
    });

    if (existingServer) {
      console.log(`⚠️  Teszt szerver már létezik: ${testServerId}`);
      console.log('   Törlés...');
      await prisma.server.delete({
        where: { id: testServerId },
      });
    }

    // Teszt szerver létrehozása
    const testServer = await prisma.server.create({
      data: {
        id: testServerId,
        name: '7DTD Test Server',
        gameType: 'SEVEN_DAYS_TO_DIE',
        status: 'PROVISIONING',
        machineId: testMachine.id,
        agentId: testMachine.agents[0].id,
        userId: (await prisma.user.findFirst())?.id || '',
      },
    });

    console.log(`✅ Teszt szerver létrehozva: ${testServerId}\n`);

    // 4. Template deployment teszt
    console.log('📌 3. Template deployment teszt...');
    console.log('   Ez az agent API-n keresztül fog futni.');
    console.log('   A deployment folyamat:');
    console.log('   1. Template letöltés Google Drive-ról');
    console.log('   2. Template kibontás');
    console.log('   3. Port allokáció');
    console.log('   4. Konfiguráció generálás');
    console.log('   5. Docker container indítás\n');

    try {
      const result = await TemplateDeployer.deployTemplate({
        serverId: testServerId,
        templateId: GameTemplateType.SEVEN_DAYS_TO_DIE,
        machineId: testMachine.id,
        agentId: testMachine.agents[0].id,
        serverName: '7DTD Test Server',
        maxPlayers: 8,
        config: {
          worldGeneration: 'RandomGen',
          difficulty: 'Normal',
          gameMode: 'Survival',
        },
      });

      if (result.success) {
        console.log('✅ Template deployment sikeres!');
        console.log(`   Container ID: ${result.containerId}`);
        console.log(`   Ports:`, result.ports);
      } else {
        console.log(`❌ Template deployment sikertelen: ${result.error}`);
      }
    } catch (error: any) {
      console.log(`❌ Template deployment hiba: ${error.message}`);
      console.log('   Stack:', error.stack);
    }

    // 5. Cleanup (opcionális)
    console.log('\n📌 4. Cleanup...');
    console.log('   A teszt szerver törlése opcionális.');
    console.log('   Ha szeretnéd megtartani, hagyd ki ezt a lépést.\n');

    console.log('=== Template Deployment Teszt Kész ===');
  } catch (error: any) {
    console.error('❌ Template deployment teszt hiba:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Script futtatása
testTemplateDeployment().catch(console.error);

