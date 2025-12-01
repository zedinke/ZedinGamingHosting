import { prisma } from '@/lib/prisma';
import { CronJobAction, CronExecutionStatus } from '@prisma/client';
import { logger } from './logger';
import { parseExpression } from 'cron-parser';

/**
 * Cron kifejezés validálása
 */
export function validateCronExpression(cronExpression: string): { valid: boolean; error?: string } {
  try {
    parseExpression(cronExpression);
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Érvénytelen cron kifejezés',
    };
  }
}

/**
 * Következő végrehajtási idő számítása cron kifejezésből
 */
export function calculateNextRun(cronExpression: string, timezone: string = 'Europe/Budapest'): Date | null {
  try {
    const interval = parseExpression(cronExpression, {
      tz: timezone,
    });
    
    const nextDate = interval.next();
    return nextDate.toDate();
  } catch (error) {
    logger.error('Error calculating next run', error as Error, {
      cronExpression,
      timezone,
    });
    return null;
  }
}

/**
 * Összes aktív cron job lekérdezése, amit végre kell hajtani
 */
export async function getDueCronJobs(): Promise<any[]> {
  const now = new Date();
  
  const cronJobs = await prisma.cronJob.findMany({
    where: {
      isActive: true,
      enabled: true,
      OR: [
        { nextRun: null }, // Ha nincs beállítva következő futás
        { nextRun: { lte: now } }, // Ha elérkezett az idő
      ],
    },
    include: {
      server: {
        include: {
          machine: true,
          agent: true,
        },
      },
      user: true,
    },
    orderBy: {
      nextRun: 'asc',
    },
  });
  
  return cronJobs;
}

/**
 * Cron job végrehajtása
 */
export async function executeCronJob(cronJobId: string): Promise<{
  success: boolean;
  result: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  error?: string;
  duration?: number;
}> {
  const startTime = Date.now();
  
  try {
    const cronJob = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
      include: {
        server: true,
        user: true,
      },
    });
    
    if (!cronJob) {
      return {
        success: false,
        result: 'FAILED',
        error: 'Cron job nem található',
      };
    }
    
    if (!cronJob.isActive || !cronJob.enabled) {
      return {
        success: false,
        result: 'SKIPPED',
        error: 'Cron job inaktív',
      };
    }
    
    // Execution log létrehozása
    const execution = await prisma.cronJobExecution.create({
      data: {
        cronJobId: cronJob.id,
        serverId: cronJob.serverId,
        userId: cronJob.userId,
        action: cronJob.action,
        status: 'RUNNING',
      },
    });
    
    // Művelet végrehajtása
    let result: 'SUCCESS' | 'FAILED' | 'SKIPPED' = 'SUCCESS';
    let errorMessage: string | undefined;
    
    try {
      await executeServerAction(
        cronJob.serverId,
        cronJob.action,
        cronJob.server
      );
      
      result = 'SUCCESS';
    } catch (actionError: any) {
      result = 'FAILED';
      errorMessage = actionError.message || 'Ismeretlen hiba';
      logger.error('Cron job action execution error', actionError, {
        cronJobId: cronJob.id,
        serverId: cronJob.serverId,
        action: cronJob.action,
      });
    }
    
    const duration = Date.now() - startTime;
    
    // Execution log frissítése
    await prisma.cronJobExecution.update({
      where: { id: execution.id },
      data: {
        status: result as CronExecutionStatus,
        completedAt: new Date(),
        duration,
        result,
        error: errorMessage,
      },
    });
    
    // Cron job statisztikák frissítése
    await prisma.cronJob.update({
      where: { id: cronJob.id },
      data: {
        lastRun: new Date(),
        lastResult: result,
        lastError: errorMessage,
        runCount: { increment: 1 },
        successCount: result === 'SUCCESS' ? { increment: 1 } : undefined,
        failureCount: result === 'FAILED' ? { increment: 1 } : undefined,
        nextRun: calculateNextRun(cronJob.cronExpression, cronJob.timezone),
      },
    });
    
    // Email értesítés küldése, ha szükséges
    if (
      (result === 'SUCCESS' && (cronJob.notifyOnSuccess || cronJob.notifyAlways)) ||
      (result === 'FAILED' && (cronJob.notifyOnFailure || cronJob.notifyAlways))
    ) {
      sendCronJobNotification(cronJob, result, errorMessage).catch((emailError) => {
        logger.error('Error sending cron job notification email', emailError as Error, {
          cronJobId: cronJob.id,
        });
      });
    }
    
    return {
      success: result === 'SUCCESS',
      result,
      error: errorMessage,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Cron job execution error', error, {
      cronJobId,
    });
    
    return {
      success: false,
      result: 'FAILED',
      error: error.message || 'Ismeretlen hiba',
      duration,
    };
  }
}

/**
 * Szerver művelet végrehajtása
 */
async function executeServerAction(
  serverId: string,
  action: CronJobAction,
  server: any
): Promise<void> {
  // API endpoint hívása a szerver művelet végrehajtásához
  // Ez használja a meglévő szerver action végrehajtási logikát
  
  const actionMap: Record<CronJobAction, string> = {
    START: 'start',
    STOP: 'stop',
    RESTART: 'restart',
    UPDATE: 'update',
    WIPE: 'wipe',
    BACKUP: 'backup',
    CLEANUP: 'cleanup',
    SAVE: 'save',
  };
  
  const actionString = actionMap[action];
  
  if (!actionString) {
    throw new Error(`Ismeretlen művelet: ${action}`);
  }
  
  // Itt hívjuk meg a szerver action végrehajtási logikát
  // A server action route-ban van implementálva
  // Most egy belső hívást használunk
  
  const { executeServerActionInternal } = await import('./server-action-executor');
  await executeServerActionInternal(serverId, actionString, server);
}

/**
 * Email értesítés küldése cron job végrehajtás után
 */
async function sendCronJobNotification(
  cronJob: any,
  result: 'SUCCESS' | 'FAILED' | 'SKIPPED',
  error?: string
): Promise<void> {
  try {
    const { sendEmail } = await import('./email');
    
    const statusText = result === 'SUCCESS' ? 'sikeresen' : result === 'FAILED' ? 'sikertelenül' : 'kihagyva';
    const statusColor = result === 'SUCCESS' ? 'green' : result === 'FAILED' ? 'red' : 'yellow';
    
    const subject = `Cron Job ${statusText} végrehajtva: ${cronJob.name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Cron Job Végrehajtás</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Cron Job:</strong> ${cronJob.name}</p>
          <p><strong>Szerver:</strong> ${cronJob.server.name}</p>
          <p><strong>Művelet:</strong> ${cronJob.action}</p>
          <p><strong>Eredmény:</strong> <span style="color: ${statusColor};">${statusText}</span></p>
          ${error ? `<p><strong>Hiba:</strong> ${error}</p>` : ''}
          <p><strong>Időpont:</strong> ${new Date().toLocaleString('hu-HU')}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Ez egy automatikus értesítés a cron job végrehajtásáról.
        </p>
      </div>
    `;
    
    await sendEmail({
      to: cronJob.user.email,
      subject,
      html,
    });
    
    // Email küldés jelölés az execution logban
    const latestExecution = await prisma.cronJobExecution.findFirst({
      where: { cronJobId: cronJob.id },
      orderBy: { startedAt: 'desc' },
    });
    
    if (latestExecution) {
      await prisma.cronJobExecution.update({
        where: { id: latestExecution.id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });
    }
  } catch (error) {
    logger.error('Error sending cron job notification email', error as Error, {
      cronJobId: cronJob.id,
    });
    throw error;
  }
}

/**
 * Cron job létrehozása vagy frissítése
 */
export async function createOrUpdateCronJob(data: {
  id?: string;
  serverId: string;
  userId: string;
  name: string;
  description?: string;
  cronExpression: string;
  action: CronJobAction;
  gameType?: string;
  notifyOnSuccess?: boolean;
  notifyOnFailure?: boolean;
  notifyAlways?: boolean;
  timezone?: string;
  isActive?: boolean;
  enabled?: boolean;
}): Promise<{ success: boolean; cronJob?: any; error?: string }> {
  try {
    // Cron kifejezés validálása
    const validation = validateCronExpression(data.cronExpression);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Érvénytelen cron kifejezés',
      };
    }
    
    // Következő futás számítása
    const nextRun = calculateNextRun(data.cronExpression, data.timezone || 'Europe/Budapest');
    
    if (data.id) {
      // Frissítés
      const cronJob = await prisma.cronJob.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          cronExpression: data.cronExpression,
          action: data.action,
          notifyOnSuccess: data.notifyOnSuccess || false,
          notifyOnFailure: data.notifyOnFailure || false,
          notifyAlways: data.notifyAlways || false,
          timezone: data.timezone || 'Europe/Budapest',
          isActive: data.isActive !== undefined ? data.isActive : true,
          enabled: data.enabled !== undefined ? data.enabled : true,
          nextRun,
        },
      });
      
      return { success: true, cronJob };
    } else {
      // Létrehozás
      const cronJob = await prisma.cronJob.create({
        data: {
          serverId: data.serverId,
          userId: data.userId,
          name: data.name,
          description: data.description,
          cronExpression: data.cronExpression,
          action: data.action,
          notifyOnSuccess: data.notifyOnSuccess || false,
          notifyOnFailure: data.notifyOnFailure || false,
          notifyAlways: data.notifyAlways || false,
          timezone: data.timezone || 'Europe/Budapest',
          isActive: data.isActive !== undefined ? data.isActive : true,
          enabled: data.enabled !== undefined ? data.enabled : true,
          nextRun,
        },
      });
      
      return { success: true, cronJob };
    }
  } catch (error: any) {
    logger.error('Error creating/updating cron job', error, {
      serverId: data.serverId,
    });
    return {
      success: false,
      error: error.message || 'Hiba történt a cron job létrehozása/frissítése során',
    };
  }
}

