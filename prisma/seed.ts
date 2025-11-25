import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin felhasználó létrehozása
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@zedingaming.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Alapvető árazási csomagok
  const pricingPlans = [
    {
      name: 'Starter',
      description: 'Tökéletes kezdőknek',
      price: 2990,
      currency: 'HUF',
      interval: 'month',
      features: ['2GB RAM', '10GB Storage', '10 Players', 'Basic Support'],
      order: 1,
    },
    {
      name: 'Pro',
      description: 'Népszerű választás',
      price: 5990,
      currency: 'HUF',
      interval: 'month',
      features: ['4GB RAM', '25GB Storage', '25 Players', 'Priority Support'],
      order: 2,
    },
    {
      name: 'Enterprise',
      description: 'Legnagyobb szerverekhez',
      price: 9990,
      currency: 'HUF',
      interval: 'month',
      features: ['8GB RAM', '50GB Storage', '50 Players', '24/7 Support'],
      order: 3,
    },
  ];

  for (const plan of pricingPlans) {
    const existing = await prisma.pricingPlan.findFirst({
      where: { name: plan.name },
    });

    if (existing) {
      await prisma.pricingPlan.update({
        where: { id: existing.id },
        data: plan,
      });
    } else {
      await prisma.pricingPlan.create({
        data: plan,
      });
    }
  }

  console.log('✅ Pricing plans created');

  // Alapvető FAQ bejegyzések
  const faqs = [
    {
      question: 'Hogyan rendelhetek szervert?',
      answer: 'Regisztrálj egy fiókot, válassz egy csomagot, és fizess online. A szerver automatikusan létrejön pár perc alatt.',
      locale: 'hu',
      order: 1,
    },
    {
      question: 'Milyen játékokat támogattok?',
      answer: 'Jelenleg ARK, Minecraft, CS:GO, Rust, Valheim és Seven Days to Die szervereket kínálunk. További játékok hamarosan!',
      locale: 'hu',
      order: 2,
    },
    {
      question: 'How do I order a server?',
      answer: 'Register an account, choose a plan, and pay online. The server will be automatically created within a few minutes.',
      locale: 'en',
      order: 1,
    },
    {
      question: 'What games do you support?',
      answer: 'We currently offer ARK, Minecraft, CS:GO, Rust, Valheim and Seven Days to Die servers. More games coming soon!',
      locale: 'en',
      order: 2,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({
      data: faq,
    });
  }

  console.log('✅ FAQs created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

