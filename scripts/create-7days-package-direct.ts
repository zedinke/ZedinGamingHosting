/**
 * Script a 7 Days to Die game package létrehozásához - közvetlen adatbázis írás
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    process.stdout.write('🎮 7 Days to Die game package létrehozása az adatbázisban...\n\n');

    // Ellenőrizzük, hogy már létezik-e
    const existing = await prisma.gamePackage.findFirst({
      where: {
        gameType: 'SEVEN_DAYS_TO_DIE',
        isActive: true,
      },
    });

    if (existing) {
      process.stdout.write('⚠️  Már létezik aktív 7 Days to Die game package:\n');
      process.stdout.write(`   ID: ${existing.id}\n`);
      process.stdout.write(`   Név: ${existing.nameHu || existing.name}\n`);
      process.stdout.write(`   Ár: ${existing.price} ${existing.currency}/${existing.interval}\n`);
      process.stdout.write('\n   Ha új package-et szeretnél, először inaktiváld a régit az admin panelben.\n');
      return;
    }

    // Létrehozás
    const packageData = {
      gameType: 'SEVEN_DAYS_TO_DIE' as const,
      name: '7 Days to Die - Starter',
      nameHu: '7 Days to Die - Starter',
      nameEn: '7 Days to Die - Starter',
      description: 'Tökéletes kezdőknek a 7 Days to Die szerverhez',
      descriptionHu: 'Tökéletes kezdőknek a 7 Days to Die szerverhez. 10 játékos, 2 vCPU, 4GB RAM.',
      descriptionEn: 'Perfect for beginners to 7 Days to Die server. 10 players, 2 vCPU, 4GB RAM.',
      price: 2990,
      currency: 'HUF',
      interval: 'month',
      slot: 10,
      unlimitedSlot: false,
      cpuCores: 2,
      ram: 4,
      unlimitedRam: false,
      discountPrice: null,
      pricePerSlot: 200,
      isActive: true,
      order: 0,
    };

    const gamePackage = await prisma.gamePackage.create({
      data: packageData,
    });

    process.stdout.write('✅ 7 Days to Die game package sikeresen létrehozva az adatbázisban!\n');
    process.stdout.write(`\n   ID: ${gamePackage.id}\n`);
    process.stdout.write(`   Név: ${gamePackage.nameHu}\n`);
    process.stdout.write(`   Ár: ${gamePackage.price} ${gamePackage.currency}/${gamePackage.interval}\n`);
    process.stdout.write(`   Specifikáció: ${gamePackage.slot} slot, ${gamePackage.cpuCores} vCPU, ${gamePackage.ram}GB RAM\n`);
    process.stdout.write(`   Slot bővítés: ${gamePackage.pricePerSlot} ${gamePackage.currency}/slot/hó\n`);
    process.stdout.write('\n📝 Most már látható lesz az admin panelben: /hu/admin/cms/game-packages\n');
  } catch (error: any) {
    process.stderr.write(`\n❌ Hiba: ${error.message}\n`);
    if (error.code) {
      process.stderr.write(`   Error code: ${error.code}\n`);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.stdout.write('\n✨ Kész!\n');
    process.exit(0);
  })
  .catch((e) => {
    process.stderr.write(`Script hiba: ${e}\n`);
    process.exit(1);
  });
