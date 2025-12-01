import { getDueCronJobs, executeCronJob } from './cron-job-manager';
import { logger } from './logger';

let cronExecutorInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Cron executor indítása - rendszeres időközönként ellenőrzi a due cron job-okat
 */
export function startCronExecutor(intervalMinutes: number = 1): void {
  if (cronExecutorInterval) {
    logger.warn('Cron executor már fut', {});
    return;
  }

  logger.info('Cron executor indítva', {
    intervalMinutes,
  });

  // Azonnal futtatunk egy ellenőrzést
  processDueCronJobs().catch((error) => {
    logger.error('Error in initial cron job check', error);
  });

  // Utána rendszeres időközönként ellenőrizzük
  cronExecutorInterval = setInterval(() => {
    processDueCronJobs().catch((error) => {
      logger.error('Error in scheduled cron job check', error);
    });
  }, intervalMinutes * 60 * 1000); // milliszekundumban
}

/**
 * Cron executor leállítása
 */
export function stopCronExecutor(): void {
  if (cronExecutorInterval) {
    clearInterval(cronExecutorInterval);
    cronExecutorInterval = null;
    logger.info('Cron executor leállítva', {});
  }
}

/**
 * Due cron job-ok feldolgozása
 */
async function processDueCronJobs(): Promise<void> {
  if (isRunning) {
    logger.debug('Cron executor already running, skipping', {});
    return;
  }

  isRunning = true;

  try {
    const dueCronJobs = await getDueCronJobs();

    if (dueCronJobs.length === 0) {
      logger.debug('No due cron jobs found', {});
      return;
    }

    logger.info(`Processing ${dueCronJobs.length} due cron job(s)`, {
      count: dueCronJobs.length,
    });

    // Párhuzamosan futtatjuk a cron job-okat
    const executionPromises = dueCronJobs.map(async (cronJob) => {
      try {
        logger.info(`Executing cron job: ${cronJob.name}`, {
          cronJobId: cronJob.id,
          serverId: cronJob.serverId,
          action: cronJob.action,
        });

        const result = await executeCronJob(cronJob.id);

        logger.info(`Cron job execution completed: ${cronJob.name}`, {
          cronJobId: cronJob.id,
          result: result.result,
          success: result.success,
        });
      } catch (error) {
        logger.error(`Error executing cron job: ${cronJob.name}`, error as Error, {
          cronJobId: cronJob.id,
          serverId: cronJob.serverId,
        });
      }
    });

    await Promise.allSettled(executionPromises);

    logger.info('All due cron jobs processed', {
      count: dueCronJobs.length,
    });
  } catch (error) {
    logger.error('Error processing due cron jobs', error as Error);
  } finally {
    isRunning = false;
  }
}

/**
 * Manuális cron job feldolgozás trigger (API-ból hívható)
 */
export async function triggerCronJobCheck(): Promise<{
  success: boolean;
  processedCount: number;
  error?: string;
}> {
  try {
    const dueCronJobs = await getDueCronJobs();
    const count = dueCronJobs.length;

    if (count === 0) {
      return { success: true, processedCount: 0 };
    }

    // Futtatjuk a due job-okat
    await processDueCronJobs();

    return { success: true, processedCount: count };
  } catch (error: any) {
    logger.error('Error in manual cron job check trigger', error);
    return {
      success: false,
      processedCount: 0,
      error: error.message || 'Ismeretlen hiba',
    };
  }
}

/**
 * Cron executor státusz lekérdezése
 */
export function getCronExecutorStatus(): {
  running: boolean;
  intervalMinutes: number | null;
} {
  return {
    running: cronExecutorInterval !== null,
    intervalMinutes: cronExecutorInterval ? 1 : null, // Alapértelmezett 1 perc
  };
}

