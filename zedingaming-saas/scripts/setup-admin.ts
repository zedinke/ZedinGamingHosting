import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { parseArgs } from 'util';

const prisma = new PrismaClient();

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      password: { type: 'string' },
    },
  });

  if (!values.email || !values.password) {
    console.error('HIBA: Email és jelszó megadása kötelező!');
    console.error('Használat: npm run setup:admin -- --email "admin@example.com" --password "password123"');
    process.exit(1);
  }

  const email = values.email;
  const password = values.password;

  // Ellenőrizzük, hogy létezik-e már admin felhasználó
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`Felhasználó már létezik: ${email}`);
    console.log('Jelszó frissítése...');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    
    console.log('✅ Jelszó frissítve!');
  } else {
    // Jelszó hash-elése
    const hashedPassword = await bcrypt.hash(password, 10);

    // Admin felhasználó létrehozása
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin felhasználó létrehozva!');
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
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

