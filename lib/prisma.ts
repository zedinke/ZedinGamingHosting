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
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Kapcsolat ellenőrzés és újracsatlakozás helper függvény
export async function ensureConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    // Ha a kapcsolat megszakadt, próbáljuk újracsatlakozni
    try {
      await prisma.$disconnect();
      await prisma.$connect();
    } catch (reconnectError) {
      console.error('Failed to reconnect to database:', reconnectError);
      throw reconnectError;
    }
  }
}

// Retry wrapper Prisma műveletekhez
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ellenőrizzük a kapcsolatot minden próbálkozás előtt
      await ensureConnection();
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Ha a kapcsolat megszakadt, próbáljuk újracsatlakozni
      if (error.code === 'P1001' || error.message?.includes('closed the connection')) {
        console.warn(`Database connection error (attempt ${attempt}/${maxRetries}), retrying...`);
        
        if (attempt < maxRetries) {
          // Várunk egy kicsit az újrapróbálkozás előtt
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
      }
      
      // Ha nem kapcsolati hiba, vagy elérte a max retry-t, dobjuk a hibát
      throw error;
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

