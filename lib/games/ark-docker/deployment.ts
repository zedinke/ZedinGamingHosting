/**
 * ARK Docker Deployment Automation
 * Automated scripts for server creation and management
 */

import { ArkDockerInstaller, ArkServerConfig } from './installer';
import { ArkClusterManager, ClusterNode } from './cluster';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { GameType } from '@prisma/client';

/**
 * Deploy a single ARK server to Docker
 */
export async function deployArkServer(
  serverId: string,
  config: ArkServerConfig
): Promise<{ success: boolean; containerId?: string; error?: string }> {
  try {
    logger.info('[ArkDeploy] Deploying server:', serverId);

    const installer = new ArkDockerInstaller();
    await installer.initialize();

    // Validate configuration
    try {
      installer['validateConfig'](config);
    } catch (error: any) {
      throw new Error(`Invalid configuration: ${error.message}`);
    }

    // Install server
    const result = await installer.install(config);

    if (result.success) {
      // Update database
      await prisma.gameServer.update({
        where: { id: serverId },
        data: {
          status: 'RUNNING',
          containerId: result.containerId,
          deploymentMethod: 'DOCKER',
        },
      });

      logger.info('[ArkDeploy] Server deployed successfully:', serverId);
      return result;
    } else {
      throw new Error(result.error || 'Unknown deployment error');
    }
  } catch (error: any) {
    logger.error('[ArkDeploy] Deployment failed:', error as Error);

    // Update database with error
    await prisma.gameServer.update({
      where: { id: serverId },
      data: {
        status: 'ERROR',
        lastError: error.message,
      },
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deploy a multi-server cluster
 */
export async function deployArkCluster(
  clusterId: string,
  configs: ArkServerConfig[]
): Promise<{
  success: boolean;
  deployedServers: string[];
  failedServers: string[];
  error?: string;
}> {
  const deployedServers: string[] = [];
  const failedServers: string[] = [];

  try {
    logger.info('[ArkDeploy] Deploying cluster:', clusterId);

    if (configs.length < 2) {
      throw new Error('Cluster must contain at least 2 servers');
    }

    const installer = new ArkDockerInstaller();
    await installer.initialize();

    // Deploy each server in sequence
    for (const config of configs) {
      try {
        logger.info(`[ArkDeploy] Deploying cluster member: ${config.serverId}`);

        const result = await installer.install(config);

        if (result.success) {
          deployedServers.push(config.serverId);

          // Update database
          await prisma.gameServer.update({
            where: { id: config.serverId },
            data: {
              status: 'RUNNING',
              containerId: result.containerId,
              deploymentMethod: 'DOCKER',
              clusterId: clusterId,
            },
          });
        } else {
          failedServers.push(config.serverId);
        }
      } catch (error: any) {
        logger.error(
          `[ArkDeploy] Failed to deploy ${config.serverId}:`,
          error as Error
        );
        failedServers.push(config.serverId);
      }
    }

    // Initialize cluster manager
    if (deployedServers.length >= 2) {
      const clusterManager = new ArkClusterManager('/opt/ark-docker/cluster', clusterId);
      await clusterManager.initialize();

      for (const serverId of deployedServers) {
        const config = configs.find((c) => c.serverId === serverId);
        if (config) {
          await clusterManager.addNode({
            serverId: config.serverId,
            gameType: config.gameType,
            mapName: config.mapName,
            ipAddress: 'localhost',
            port: config.serverPort,
            status: 'online',
          });
        }
      }

      // Sync cluster data
      await clusterManager.syncClusterData();

      logger.info('[ArkDeploy] Cluster sync completed');
    }

    return {
      success: failedServers.length === 0,
      deployedServers,
      failedServers,
    };
  } catch (error: any) {
    logger.error('[ArkDeploy] Cluster deployment failed:', error as Error);
    return {
      success: false,
      deployedServers,
      failedServers,
      error: error.message,
    };
  }
}

/**
 * Stop and delete an ARK server
 */
export async function deleteArkServer(serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('[ArkDeploy] Deleting server:', serverId);

    const installer = new ArkDockerInstaller();
    const result = await installer.delete(serverId);

    if (result.success) {
      // Update database
      await prisma.gameServer.update({
        where: { id: serverId },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
        },
      });

      logger.info('[ArkDeploy] Server deleted successfully:', serverId);
      return { success: true };
    } else {
      throw new Error(result.error || 'Unknown deletion error');
    }
  } catch (error: any) {
    logger.error('[ArkDeploy] Failed to delete server:', error as Error);
    return { success: false, error: error.message };
  }
}

/**
 * Start a stopped server
 */
export async function startArkServer(serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('[ArkDeploy] Starting server:', serverId);

    const installer = new ArkDockerInstaller();
    const result = await installer.start(serverId);

    if (result.success) {
      await prisma.gameServer.update({
        where: { id: serverId },
        data: { status: 'RUNNING' },
      });

      logger.info('[ArkDeploy] Server started:', serverId);
      return { success: true };
    } else {
      throw new Error(result.error || 'Unknown start error');
    }
  } catch (error: any) {
    logger.error('[ArkDeploy] Failed to start server:', error as Error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop a running server
 */
export async function stopArkServer(serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('[ArkDeploy] Stopping server:', serverId);

    const installer = new ArkDockerInstaller();
    const result = await installer.stop(serverId);

    if (result.success) {
      await prisma.gameServer.update({
        where: { id: serverId },
        data: { status: 'STOPPED' },
      });

      logger.info('[ArkDeploy] Server stopped:', serverId);
      return { success: true };
    } else {
      throw new Error(result.error || 'Unknown stop error');
    }
  } catch (error: any) {
    logger.error('[ArkDeploy] Failed to stop server:', error as Error);
    return { success: false, error: error.message };
  }
}

/**
 * Restart a running server
 */
export async function restartArkServer(serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('[ArkDeploy] Restarting server:', serverId);

    const installer = new ArkDockerInstaller();
    const result = await installer.restart(serverId);

    if (result.success) {
      await prisma.gameServer.update({
        where: { id: serverId },
        data: { status: 'RUNNING' },
      });

      logger.info('[ArkDeploy] Server restarted:', serverId);
      return { success: true };
    } else {
      throw new Error(result.error || 'Unknown restart error');
    }
  } catch (error: any) {
    logger.error('[ArkDeploy] Failed to restart server:', error as Error);
    return { success: false, error: error.message };
  }
}

/**
 * Get server status with metrics
 */
export async function getArkServerStatus(serverId: string) {
  try {
    const installer = new ArkDockerInstaller();
    const status = await installer.getStatus(serverId);

    const logs = await installer.getLogs(serverId, 50);

    return {
      ...status,
      recentLogs: logs.success ? logs.logs : null,
    };
  } catch (error: any) {
    logger.error('[ArkDeploy] Failed to get server status:', error as Error);
    return {
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Sync cluster data
 */
export async function syncArkCluster(clusterId: string): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('[ArkDeploy] Syncing cluster:', clusterId);

    const clusterManager = new ArkClusterManager('/opt/ark-docker/cluster', clusterId);
    const result = await clusterManager.syncClusterData();

    if (result.success) {
      logger.info('[ArkDeploy] Cluster sync completed:', clusterId);
    }

    return result;
  } catch (error: any) {
    logger.error('[ArkDeploy] Cluster sync failed:', error as Error);
    return { success: false, error: error.message };
  }
}

/**
 * Migrate player character between cluster servers
 */
export async function migrateCharacterBetweenServers(
  characterId: string,
  fromServerId: string,
  toServerId: string,
  clusterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('[ArkDeploy] Migrating character:', characterId);

    const clusterManager = new ArkClusterManager('/opt/ark-docker/cluster', clusterId);
    const result = await clusterManager.migrateCharacter(characterId, fromServerId, toServerId);

    if (result.success) {
      logger.info('[ArkDeploy] Character migration completed:', characterId);
    }

    return result;
  } catch (error: any) {
    logger.error('[ArkDeploy] Character migration failed:', error as Error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch deploy multiple servers
 */
export async function batchDeployArkServers(
  configs: ArkServerConfig[]
): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: Array<{ serverId: string; success: boolean; error?: string }>;
}> {
  const results = [];
  let successful = 0;
  let failed = 0;

  for (const config of configs) {
    try {
      const result = await deployArkServer(config.serverId, config);
      results.push({
        serverId: config.serverId,
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    } catch (error: any) {
      results.push({
        serverId: config.serverId,
        success: false,
        error: error.message,
      });
      failed++;
    }
  }

  return {
    total: configs.length,
    successful,
    failed,
    results,
  };
}

/**
 * Health check all running servers
 */
export async function healthCheckArkServers(): Promise<{
  total: number;
  healthy: number;
  unhealthy: number;
  servers: Array<{ serverId: string; status: string }>;
}> {
  const servers = await prisma.gameServer.findMany({
    where: {
      gameType: GameType.ARK_ASCENDED || GameType.ARK_EVOLVED,
      status: 'RUNNING',
    },
  });

  const results = [];
  let healthy = 0;
  let unhealthy = 0;

  for (const server of servers) {
    try {
      const installer = new ArkDockerInstaller();
      const status = await installer.getStatus(server.id);

      if (status.status === 'running') {
        healthy++;
        results.push({ serverId: server.id, status: 'healthy' });
      } else {
        unhealthy++;
        results.push({ serverId: server.id, status: 'unhealthy' });
      }
    } catch (error: any) {
      unhealthy++;
      results.push({ serverId: server.id, status: 'error' });
    }
  }

  return {
    total: servers.length,
    healthy,
    unhealthy,
    servers: results,
  };
}
