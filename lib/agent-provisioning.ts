/**
 * Agent-alapú szervertelepítés
 * Game server agent-en keresztüli Docker provisioning
 */

import { prisma } from './prisma';
import { logger } from './logger';

interface ProvisionConfig {
  gameType: 'ARK_ASCENDED' | 'ARK_EVOLVED';
  serverName: string;
  port: number;
  adminPassword: string;
  serverPassword?: string;
  maxPlayers: number;
  mapName: string;
}

/**
 * Szerver telepítése az agent-en keresztül
 * Az agent daemon egyenlő időközönként lekérdez új feladatokat az adatbázisból
 */
export async function provisionServerViaAgent(
  agentId: string,
  serverId: string,
  config: ProvisionConfig
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    logger.info('Creating provision task for agent', {
      agentId,
      serverId,
      gameType: config.gameType,
    });

    // 1. Agent megkeresése az ID alapján
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // 2. Task létrehozása az adatbázisban
    const task = await prisma.task.create({
      data: {
        agentId,
        serverId,
        type: 'PROVISION',
        status: 'PENDING',
        command: {
          gameType: config.gameType,
          serverName: config.serverName,
          port: config.port,
          adminPassword: config.adminPassword,
          serverPassword: config.serverPassword || '',
          maxPlayers: config.maxPlayers,
          mapName: config.mapName,
        },
      },
    });

    logger.info('Agent task created successfully', {
      taskId: task.id,
      agentId,
      serverId,
    });

    // 3. Timeout-val várunk az agent reagálására (max 30 másodperc)
    const maxWaitTime = 30000; // 30 másodperc
    const startTime = Date.now();
    let lastStatus = 'PENDING';

    // Poll task státuszt
    while (Date.now() - startTime < maxWaitTime) {
      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      if (!updatedTask) {
        throw new Error('Task not found');
      }

      lastStatus = updatedTask.status;

      // Ha az agent feldolgozta
      if (updatedTask.status === 'COMPLETED') {
        logger.info('Agent task completed successfully', {
          taskId: task.id,
          result: updatedTask.result,
        });

        return {
          success: true,
          message: 'Server provisioned successfully by agent',
        };
      }

      // Ha hiba történt
      if (updatedTask.status === 'FAILED') {
        const errorMsg = updatedTask.error || 'Unknown error';
        logger.error('Agent task failed', undefined, {
          task_id: task.id,
          error: errorMsg,
        });

        return {
          success: false,
          error: `Agent provisioning failed: ${errorMsg}`,
        };
      }

      // Várakozás az agent válaszára (2 másodperc intervallum)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Timeout: az agent nem válaszolt időben
    logger.warn('Agent task timeout', {
      taskId: task.id,
      agentId,
      lastStatus,
      elapsedTime: Date.now() - startTime,
    });

    return {
      success: false,
      error: `Agent did not respond within ${maxWaitTime / 1000} seconds. Task created but may still be processing.`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to provision server via agent', undefined, {
      agentId,
      serverId,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Szerver leállítása az agent-en keresztül
 */
export async function stopServerViaAgent(
  agentId: string,
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const task = await prisma.task.create({
      data: {
        agentId,
        serverId,
        type: 'DOCKER_STOP',
        status: 'PENDING',
        command: {},
      },
    });

    logger.info('Stop task created for agent', { taskId: task.id, serverId });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to stop server via agent', undefined, { agentId, serverId, error: errorMsg });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Szerver indítása az agent-en keresztül
 */
export async function startServerViaAgent(
  agentId: string,
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const task = await prisma.task.create({
      data: {
        agentId,
        serverId,
        type: 'DOCKER_START',
        status: 'PENDING',
        command: {},
      },
    });

    logger.info('Start task created for agent', { taskId: task.id, serverId });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start server via agent', undefined, { agentId, serverId, error: errorMsg });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Szerver törlése az agent-en keresztül
 */
export async function deleteServerViaAgent(
  agentId: string,
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const task = await prisma.task.create({
      data: {
        agentId,
        serverId,
        type: 'DOCKER_DELETE',
        status: 'PENDING',
        command: {},
      },
    });

    logger.info('Delete task created for agent', { taskId: task.id, serverId });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete server via agent', undefined, { agentId, serverId, error: errorMsg });

    return {
      success: false,
      error: errorMsg,
    };
  }
}
