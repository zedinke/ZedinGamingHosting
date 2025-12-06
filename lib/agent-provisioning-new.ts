/**
 * ÚJ & LEEGYSZERŰSÍTETT Agent Provisioning
 * Moduláris installert használ az új rendszer alapján
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { GameType } from '@prisma/client';
import { gameInstallerFactory } from './installers/GameInstallerFactory';
import { DebugLogger } from './installers/utils/DebugLogger';

export interface ProvisionConfig {
  gameType: GameType;
  serverName: string;
  port: number;
  adminPassword: string;
  serverPassword?: string;
  maxPlayers: number;
  map?: string;
  ram?: number;
  unlimitedRam?: boolean;
  [key: string]: any;
}

/**
 * Szerver telepítése agent-en keresztül
 * Egyszerűsített flow: Task → Installer → Docker
 */
export async function provisionServerViaAgent(
  agentId: string,
  serverId: string,
  config: ProvisionConfig
): Promise<{ success: boolean; error?: string; message?: string; logs?: string }> {
  const debugLogger = new DebugLogger(`provision:${serverId}`);

  try {
    debugLogger.info(`🚀 Starting provision for ${config.gameType}`, {
      serverId,
      agentId,
      serverName: config.serverName,
    });

    // 1. Agent létezésének ellenőrzése
    debugLogger.debug('1️⃣ Checking agent existence');
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { machine: true },
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    debugLogger.info('✅ Agent found', {
      agentId: agent.id,
      machine: agent.machine.name,
      status: agent.status,
    });

    // 2. Task létrehozása
    debugLogger.debug('2️⃣ Creating provision task');
    const task = await prisma.task.create({
      data: {
        agentId,
        serverId,
        type: 'PROVISION',
        status: 'PENDING',
        command: {
          action: 'provision',
          gameType: config.gameType,
          serverName: config.serverName,
          port: config.port,
          adminPassword: config.adminPassword,
          serverPassword: config.serverPassword || '',
          maxPlayers: config.maxPlayers,
          map: config.map,
          ram: config.ram,
        },
      },
    });

    debugLogger.info('✅ Provision task created', { taskId: task.id });

    // 3. Installer létrehozása
    debugLogger.debug('3️⃣ Creating game installer');
    const installer = gameInstallerFactory.create(config.gameType, agent.machineId);

    // 4. Installation futtatása
    debugLogger.debug('4️⃣ Starting installation');
    const result = await installer.install({
      serverId,
      serverName: config.serverName,
      port: config.port,
      adminPassword: config.adminPassword,
      serverPassword: config.serverPassword,
      maxPlayers: config.maxPlayers,
      map: config.map,
      ram: config.ram,
      unlimitedRam: config.unlimitedRam,
    });

    // 5. Task frissítése
    debugLogger.debug('5️⃣ Updating task status');
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        result: {
          gameType: result.gameType,
          ports: result.ports,
          message: result.message,
        },
        error: result.error,
        completedAt: new Date(),
      },
    });

    // 6. Server frissítése az adatbázisban
    debugLogger.debug('6️⃣ Updating server status');
    if (result.success && result.ports) {
      await prisma.server.update({
        where: { id: serverId },
        data: {
          status: 'ONLINE',
          port: result.ports.port,
          queryPort: result.ports.queryPort,
          beaconPort: result.ports.beaconPort,
          steamPeerPort: result.ports.steamPeerPort,
          configuration: {
            installedAt: new Date().toISOString(),
            ...result.ports,
          },
        },
      });
    } else {
      await prisma.server.update({
        where: { id: serverId },
        data: {
          status: 'ERROR',
        },
      });
    }

    debugLogger.info(`${result.success ? '✅' : '❌'} Provision completed`, {
      success: result.success,
      error: result.error,
    });

    return {
      success: result.success,
      error: result.error,
      message: result.message,
      logs: installer.getLogs(),
    };
  } catch (error: any) {
    debugLogger.error('❌ Provision exception', error);

    // Task státusz frissítése
    try {
      const existingTask = await prisma.task.findFirst({
        where: { serverId, type: 'PROVISION', status: { in: ['PENDING', 'RUNNING'] } },
      });

      if (existingTask) {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            status: 'FAILED',
            error: error.message,
            completedAt: new Date(),
          },
        });
      }
    } catch (e) {
      debugLogger.warn('Could not update task status', e);
    }

    return {
      success: false,
      error: error.message || 'Provision failed',
      logs: debugLogger.getLogsAsString(),
    };
  }
}

/**
 * Szerver leállítása agent-en keresztül
 */
export async function stopServerViaAgent(
  agentId: string,
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const debugLogger = new DebugLogger(`stop:${serverId}`);
    debugLogger.info('Stopping server', { serverId, agentId });

    // Task létrehozása
    const task = await prisma.task.create({
      data: {
        agentId,
        serverId,
        type: 'DOCKER_STOP',
        status: 'PENDING',
        command: {
          action: 'stop',
          serverId,
        },
      },
    });

    // Poll loop - max 30sec
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!completed && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;

      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      if (updatedTask?.status === 'COMPLETED' || updatedTask?.status === 'FAILED') {
        completed = true;
        debugLogger.info(updatedTask.status === 'COMPLETED' ? '✅ Server stopped' : '❌ Stop failed', {
          error: updatedTask.error,
        });
      }
    }

    if (!completed) {
      debugLogger.warn('⚠️ Stop timeout');
    }

    return { success: completed };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Szerver indítása agent-en keresztül
 */
export async function startServerViaAgent(
  agentId: string,
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const debugLogger = new DebugLogger(`start:${serverId}`);
    debugLogger.info('Starting server', { serverId, agentId });

    const task = await prisma.task.create({
      data: {
        agentId,
        serverId,
        type: 'DOCKER_START',
        status: 'PENDING',
        command: {
          action: 'start',
          serverId,
        },
      },
    });

    let completed = false;
    let attempts = 0;

    while (!completed && attempts < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;

      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      if (updatedTask?.status === 'COMPLETED' || updatedTask?.status === 'FAILED') {
        completed = true;
      }
    }

    return { success: completed };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
