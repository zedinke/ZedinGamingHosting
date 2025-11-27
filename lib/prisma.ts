import { PrismaClient } from '@prisma/client';
import { validateAndLogEnvironment } from './env-validation';

// Környezeti változók validálása az első importáláskor
if (typeof window === 'undefined') {
  // Csak szerver oldalon
  // Build időben ne futtassuk a validációt
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-development-build';
  
  if (!isBuildTime) {
    try {
      validateAndLogEnvironment();
    } catch (error) {
      console.error('Környezeti változók validálási hiba:', error);
      // Csak runtime-ban, production-ben dobjuk a hibát
      // Build időben ne, mert akkor még nincs minden környezeti változó beállítva
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
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

