import { startCronExecutor } from './cron-executor';
import { startAutoDeleteExecutor } from './auto-delete-executor';
import { logger } from './logger';

let initialized = false;

/**
 * Cron executor inicializálása
 * Ezt a fájlt importálni kell az alkalmazás indításakor
 */
export function initializeCronExecutor(): void {
  if (initialized) {
    logger.warn('Cron executor már inicializálva van', {});
    return;
  }

  // Csak production környezetben indítjuk el automatikusan
  // Development-ben manuálisan lehet triggerelni API-n keresztül
  if (process.env.NODE_ENV === 'production') {
    // Cron executor indítása 1 perces intervallummal
    startCronExecutor(1);
    
    // Automatikus törlési executor indítása 5 perces intervallummal
    startAutoDeleteExecutor(5);
    
    initialized = true;
    logger.info('Cron executor és auto delete executor inicializálva (production mode)', {});
  } else {
    logger.info('Cron executor nem indult el automatikusan (development mode). API-n keresztül lehet triggerelni.', {});
    initialized = true;
  }
}

// Automatikus inicializálás, ha a modul importálva van
if (typeof window === 'undefined') {
  // Csak server-side
  initializeCronExecutor();
}

