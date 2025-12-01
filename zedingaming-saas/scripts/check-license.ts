import { PrismaClient } from '@prisma/client';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  const license = await prisma.systemLicense.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!license) {
    console.log('❌ Nincs aktív license!');
    process.exit(1);
  }

  const now = new Date();
  const endDate = new Date(license.endDate);
  const remainingDays = differenceInDays(endDate, now);

  console.log('License információk:');
  console.log(`License Key: ${license.licenseKey}`);
  console.log(`Típus: ${license.licenseType}`);
  console.log(`Aktív: ${license.isActive ? 'Igen' : 'Nem'}`);
  console.log(`Érvényesség: ${license.startDate.toISOString()} - ${license.endDate.toISOString()}`);
  console.log(`Hátralévő napok: ${remainingDays}`);

  if (remainingDays < 0) {
    console.log('❌ A license lejárt!');
    process.exit(1);
  } else if (remainingDays <= 7) {
    console.log('⚠️  A license hamarosan lejár!');
  } else {
    console.log('✅ A license aktív!');
  }
}

main()
  .catch((e) => {
    console.error('HIBA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

