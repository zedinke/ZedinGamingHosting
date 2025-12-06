/**
 * ARK Server Auto-Restart Scheduler
 * Uses Bull/BullMQ for task scheduling
 */

import Queue, { Queue as BullQueue } from 'bull';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface ServerRestartConfig {
  serverId: string;
  schedule: string; // Cron expression (e.g., "0 0 * * *" = daily at midnight)
  preWarningMinutes?: number; // Minutes before restart to warn players
  gracefulShutdownSeconds?: number; // Seconds for graceful shutdown
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// Initialize Bull queue for server restarts
const restartQueue: BullQueue = new Queue('ark-server-restarts', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

/**
 * Register restart job processor
 */
restartQueue.process(async (job) => {
  const { serverId } = job.data as { serverId: string };

  try {
    logger.info('Starting ARK server restart', { serverId, jobId: job.id });

    // Get server details
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { agent: { include: { machine: true } } },
    });

    if (!server) {
      throw new Error('Server not found');
    }

    // Pre-restart warning broadcast
    const config = server.configuration as any;
    if (config?.rconPort) {
      try {
        logger.info('Sending restart warning broadcast', { serverId });
        // TODO: Implement RCON broadcast warning
        // await arkRconManager.broadcast(
        //   `Server restarting in ${config.preWarningMinutes || 5} minutes!`
        // );
      } catch (err) {
        logger.error('Broadcast warning failed', err as Error, { serverId });
        // Continue anyway
      }
    }

    // Wait for pre-warning period
    const preWarningMs = ((config?.preWarningMinutes || 5) * 60 * 1000);
    await new Promise((resolve) => setTimeout(resolve, preWarningMs));

    // Graceful shutdown
    try {
      logger.info('Executing graceful shutdown', {
        serverId,
        seconds: config?.gracefulShutdownSeconds || 30,
      });
      // TODO: Implement graceful shutdown via RCON
      // await arkRconManager.gracefulShutdown(
      //   config?.gracefulShutdownSeconds || 30
      // );
    } catch (err) {
      logger.error('Graceful shutdown failed', err as Error, { serverId });
      // Force stop if graceful fails
    }

    // Wait for shutdown
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Restart server
    logger.info('Restarting server', { serverId });
    // TODO: Implement actual restart command via SSH/Docker

    // Update last run
    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          lastRestart: new Date(),
        },
      },
    });

    logger.info('Server restart completed successfully', { serverId });
    return { success: true, serverId };
  } catch (error: any) {
    logger.error('Server restart failed', error, { serverId });
    throw error;
  }
});

/**
 * Schedule a server restart
 */
export async function scheduleServerRestart(config: ServerRestartConfig) {
  try {
    // Remove existing job if any
    const existingJobs = await restartQueue.getRepeatableJobs();
    for (const job of existingJobs) {
      if ((job as any).data?.serverId === config.serverId) {
        await restartQueue.removeRepeatableByKey(job.key);
      }
    }

    if (!config.enabled) {
      logger.info('Server restart schedule disabled', {
        serverId: config.serverId,
      });
      return { success: true, message: 'Schedule disabled' };
    }

    // Add repeating job with cron schedule
    const job = await restartQueue.add(
      { serverId: config.serverId },
      {
        repeat: {
          cron: config.schedule,
        },
        jobId: `restart-${config.serverId}`,
      }
    );

    logger.info('Server restart scheduled', {
      serverId: config.serverId,
      schedule: config.schedule,
      jobId: job.id,
    });

    return { success: true, jobId: job.id };
  } catch (error: any) {
    logger.error('Failed to schedule restart', error, {
      serverId: config.serverId,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Get restart schedule for server
 */
export async function getServerRestartSchedule(serverId: string) {
  try {
    const jobs = await restartQueue.getRepeatableJobs();
    const job = jobs.find((j) => (j as any).data?.serverId === serverId);

    if (!job) {
      return { success: true, scheduled: false };
    }

    return {
      success: true,
      scheduled: true,
      schedule: job.cron,
      lastRun: job.every ? null : job.tz,
    };
  } catch (error: any) {
    logger.error('Failed to get restart schedule', error, { serverId });
    return { success: false, error: error.message };
  }
}

/**
 * Cancel restart schedule for server
 */
export async function cancelServerRestart(serverId: string) {
  try {
    const jobs = await restartQueue.getRepeatableJobs();
    for (const job of jobs) {
      if ((job as any).data?.serverId === serverId) {
        await restartQueue.removeRepeatableByKey(job.key);
      }
    }

    logger.info('Server restart schedule cancelled', { serverId });
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to cancel restart', error, { serverId });
    return { success: false, error: error.message };
  }
}

/**
 * Manual restart trigger
 */
export async function triggerServerRestart(serverId: string) {
  try {
    const job = await restartQueue.add(
      { serverId },
      {
        priority: 10, // High priority
        delay: 1000, // Start immediately
      }
    );

    logger.info('Manual server restart triggered', { serverId, jobId: job.id });
    return { success: true, jobId: job.id };
  } catch (error: any) {
    logger.error('Failed to trigger restart', error, { serverId });
    return { success: false, error: error.message };
  }
}

export { restartQueue };
