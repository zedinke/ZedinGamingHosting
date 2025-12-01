import { cleanupUnpaidServers } from './auto-delete-service';
import { logger } from './logger';

let autoDeleteInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Automatikus törlési executor indítása - 5 percenként ellenőrzi a nem fizetett szervereket
 */
export function startAutoDeleteExecutor(intervalMinutes: number = 5): void {
  if (autoDeleteInterval) {
    logger.warn('Auto delete executor már fut', {});
    return;
  }

  logger.info('Auto delete executor indítva', {
    intervalMinutes,
  });

  // Azonnal futtatunk egy ellenőrzést
  processAutoDelete().catch((error) => {
    logger.error('Error in initial auto delete check', error);
  });

  // Utána rendszeres időközönként ellenőrizzük
  autoDeleteInterval = setInterval(() => {
    processAutoDelete().catch((error) => {
      logger.error('Error in scheduled auto delete check', error);
    });
  }, intervalMinutes * 60 * 1000); // milliszekundumban
}

/**
 * Automatikus törlési executor leállítása
 */
export function stopAutoDeleteExecutor(): void {
  if (autoDeleteInterval) {
    clearInterval(autoDeleteInterval);
    autoDeleteInterval = null;
    logger.info('Auto delete executor leállítva', {});
  }
}

/**
 * Automatikus törlés feldolgozása
 */
async function processAutoDelete(): Promise<void> {
  if (isRunning) {
    logger.debug('Auto delete executor already running, skipping', {});
    return;
  }

  isRunning = true;

  try {
    logger.debug('Processing automatic server deletion', {});

    const result = await cleanupUnpaidServers();

    if (result.deletedCount > 0) {
      logger.info(`Auto delete completed: ${result.deletedCount} server(s) deleted`, {
        deletedCount: result.deletedCount,
        error: result.error,
      });
    } else {
      logger.debug('Auto delete completed: no servers to delete', {});
    }
  } catch (error) {
    logger.error('Error processing auto delete', error as Error);
  } finally {
    isRunning = false;
  }
}

/**
 * Manuális automatikus törlés trigger (API-ból hívható)
 */
export async function triggerAutoDelete(): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    return await cleanupUnpaidServers();
  } catch (error: any) {
    logger.error('Error in manual auto delete trigger', error);
    return {
      success: false,
      deletedCount: 0,
      error: error.message || 'Ismeretlen hiba',
    };
  }
}

/**
 * Automatikus törlési executor státusz lekérdezése
 */
export function getAutoDeleteExecutorStatus(): {
  running: boolean;
  intervalMinutes: number | null;
} {
  return {
    running: autoDeleteInterval !== null,
    intervalMinutes: autoDeleteInterval ? 5 : null, // Alapértelmezett 5 perc
  };
}

