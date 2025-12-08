import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Admin felhasználó létrehozása...');

  const adminEmail = 'geleako@gmail.com';
  const adminPassword = 'Gele007ta...';
  const adminName = 'Zedin';

  // Jelszó hash-elése
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Admin felhasználó létrehozása vagy frissítése
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Admin felhasználó sikeresen létrehozva/frissítve!');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Név: ${admin.name}`);
  console.log(`   Szerepkör: ${admin.role}`);
  console.log(`   ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Hiba történt:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

