import { PrismaClient } from '@prisma/client';
import { validateAndLogEnvironment } from './env-validation';

// Környezeti változók validálása az első importáláskor
if (typeof window === 'undefined') {
  // Csak szerver oldalon
  try {
    validateAndLogEnvironment();
  } catch (error) {
    console.error('Környezeti változók validálási hiba:', error);
    // Production-ben dobjuk a hibát, development-ben csak figyelmeztetünk
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

