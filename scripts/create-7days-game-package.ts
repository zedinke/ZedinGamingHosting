/**
 * Script a 7 Days to Die game package létrehozásához
 * Futtatás: npx tsx scripts/create-7days-game-package.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function create7DaysGamePackage() {
  try {
    console.log('🎮 7 Days to Die game package létrehozása...');

    // Ellenőrizzük, hogy már létezik-e 7 Days to Die package
    const existingPackage = await prisma.gamePackage.findFirst({
      where: {
        gameType: 'SEVEN_DAYS_TO_DIE',
        isActive: true,
      },
    });

    if (existingPackage) {
      console.log('⚠️  Már létezik aktív 7 Days to Die game package:');
      console.log(`   ID: ${existingPackage.id}`);
      console.log(`   Név: ${existingPackage.nameHu || existingPackage.name}`);
      console.log('   Ha új package-et szeretnél létrehozni, először inaktiváld a régit az admin panelben.');
      return;
    }

    // Alapértelmezett értékek a 7 Days to Die-hoz
    // A server-provisioning.ts-ben: SEVEN_DAYS_TO_DIE: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 }
    // Ez azt jelenti: 2 CPU, 4GB RAM, 10GB Disk
    const gamePackage = await prisma.gamePackage.create({
      data: {
        gameType: 'SEVEN_DAYS_TO_DIE',
        name: '7 Days to Die - Starter', // Backward compatibility
        nameHu: '7 Days to Die - Starter',
        nameEn: '7 Days to Die - Starter',
        description: 'Tökéletes kezdőknek a 7 Days to Die szerverhez', // Backward compatibility
        descriptionHu: 'Tökéletes kezdőknek a 7 Days to Die szerverhez. 10 játékos, 2 vCPU, 4GB RAM.',
        descriptionEn: 'Perfect for beginners to 7 Days to Die server. 10 players, 2 vCPU, 4GB RAM.',
        price: 2990, // 2990 HUF/hó
        currency: 'HUF',
        interval: 'month',
        slot: 10, // 10 játékos
        unlimitedSlot: false,
        cpuCores: 2, // 2 vCPU
        ram: 4, // 4GB RAM
        unlimitedRam: false,
        discountPrice: null, // Nincs akció
        pricePerSlot: 200, // 200 HUF/slot/hó bővítés
        isActive: true,
        order: 0,
      },
    });

    console.log('✅ 7 Days to Die game package sikeresen létrehozva!');
    console.log(`   ID: ${gamePackage.id}`);
    console.log(`   Név: ${gamePackage.nameHu}`);
    console.log(`   Ár: ${gamePackage.price} ${gamePackage.currency}/${gamePackage.interval}`);
    console.log(`   Specifikáció: ${gamePackage.slot} slot, ${gamePackage.cpuCores} vCPU, ${gamePackage.ram}GB RAM`);
    console.log(`   Slot bővítés: ${gamePackage.pricePerSlot} ${gamePackage.currency}/slot/hó`);
    console.log('\n📝 Most már látható lesz az admin panelben a game packages oldalon!');
  } catch (error: any) {
    console.error('❌ Hiba történt a game package létrehozása során:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

create7DaysGamePackage()
  .then(() => {
    console.log('\n✨ Kész!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script hiba:', error);
    process.exit(1);
  });
