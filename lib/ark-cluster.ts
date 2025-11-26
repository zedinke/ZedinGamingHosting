/**
 * ARK Cluster kezelés
 * A Cluster mappa a weboldal szerverén van, és NFS vagy hasonló módon megosztva
 */

import { prisma } from './prisma';
import { executeSSHCommand } from './ssh-client';
import { logger } from './logger';
import { GameType } from '@prisma/client';

// Cluster mappa elérési út a weboldal szerverén
const BASE_ARK_SHARED_PATH = '/opt/ark-shared';
const BASE_ARK_CLUSTER_PATH = process.env.ARK_CLUSTER_PATH || '/opt/ark-cluster';
const CLUSTER_NFS_PATH = process.env.ARK_CLUSTER_NFS_PATH || '/mnt/ark-cluster';

/**
 * Generálja az ARK shared mappa elérési útját felhasználó és gép alapján.
 * Ez a mappa tartalmazza a játékfájlokat.
 */
export function getARKSharedPath(userId: string, machineId: string): string {
  return `${BASE_ARK_SHARED_PATH}/${userId}-${machineId}`;
}

/**
 * Generálja az ARK cluster mappa elérési útját.
 * Ez a mappa tartalmazza a cluster mentéseket.
 */
export function getARKClusterPath(clusterId: string): string {
  return `${BASE_ARK_CLUSTER_PATH}/${clusterId}`;
}

/**
 * Létrehozza a shared ARK játékfájl mappát egy adott gépen.
 */
export async function createARKSharedFolder(
  userId: string,
  machineId: string,
  machine: any
): Promise<{ success: boolean; error?: string }> {
  const sharedPath = getARKSharedPath(userId, machineId);
  logger.info(`Creating ARK shared folder: ${sharedPath} on machine ${machine.ipAddress}`);
  try {
    await executeSSHCommand(machine, `mkdir -p ${sharedPath}`);
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to create ARK shared folder', error as Error, { userId, machineId, sharedPath });
    return { success: false, error: error.message };
  }
}

/**
 * ARK Cluster mappa létrehozása
 */
export async function createClusterFolder(clusterId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // A weboldal szerverén létrehozzuk a cluster mappát
    // Ez általában a webszerver gépen van
    const clusterPath = getARKClusterPath(clusterId);
    
    // Lokális vagy SSH-n keresztül (ha külön szerver)
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    await execAsync(`mkdir -p ${clusterPath}`);
    await execAsync(`chmod 755 ${clusterPath}`);
    
    logger.info('ARK Cluster folder created', { clusterId, clusterPath });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to create ARK cluster folder', error as Error, { clusterId });
    return {
      success: false,
      error: error.message || 'Failed to create cluster folder',
    };
  }
}

/**
 * ARK szerver hozzáadása cluster-hez
 */
export async function addServerToCluster(
  serverId: string,
  clusterId: string,
  machine: any,
  serverConfig?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return {
        success: false,
        error: 'Szerver nem található',
      };
    }

    // Cluster mappa mount-olása a szerver gépen (ha NFS-t használunk)
    const mountPoint = `${CLUSTER_NFS_PATH}/${clusterId}`;
    
    // Ellenőrizzük, hogy már mount-olva van-e
    const checkMount = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `mountpoint -q ${mountPoint} && echo "mounted" || echo "not_mounted"`
    );

    if (!checkMount.stdout?.includes('mounted')) {
      // Mount-olás (ha NFS-t használunk)
      const nfsServer = process.env.ARK_CLUSTER_NFS_SERVER;
      
      if (nfsServer) {
        const clusterPath = getARKClusterPath(clusterId);
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `mkdir -p ${mountPoint} && mount -t nfs ${nfsServer}:${clusterPath} ${mountPoint} || echo "Mount failed, using local path"`
        );
      } else {
        // Ha nincs NFS, lokális path-ot használunk (ugyanaz a gép)
        logger.warn('NFS server not configured, using local path', { clusterId });
      }
    }

    // GameUserSettings.ini frissítése cluster beállításokkal
    const currentConfig = (server.configuration as any) || {};
    const machineId = currentConfig.machineId || machine.id;
    const instancePath = currentConfig.instancePath || getARKSharedPath(server.userId, machineId) + `/instances/${serverId}`;
    const configPath = `${instancePath}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini`;
    
    const clusterConfig = `
[ServerSettings]
ClusterDirOverride=${mountPoint}
ClusterId=${clusterId}
    `.trim();

    // Hozzáadjuk a cluster beállításokat a konfigurációhoz
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `mkdir -p $(dirname ${configPath}) && echo "${clusterConfig}" >> ${configPath}`
    );

    // Szerver konfiguráció frissítése az adatbázisban
    await prisma.server.update({
      where: { id: serverId },
      data: {
        arkClusterId: clusterId,
        configuration: {
          ...currentConfig,
          clusterId,
          clusterPath: mountPoint,
        },
      },
    });

    logger.info('Server added to ARK cluster', {
      serverId,
      clusterId,
      machineId: machine.id,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Failed to add server to ARK cluster', error as Error, {
      serverId,
      clusterId,
    });
    return {
      success: false,
      error: error.message || 'Failed to add server to cluster',
    };
  }
}

/**
 * ARK szerver eltávolítása cluster-ből
 */
export async function removeServerFromCluster(
  serverId: string,
  machine: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return {
        success: false,
        error: 'Szerver nem található',
      };
    }

    const config = (server.configuration as any) || {};
    const clusterPath = config.clusterPath;

    if (clusterPath) {
      // Unmount (ha mount-olva van)
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `umount ${clusterPath} 2>/dev/null || true`
      );
    }

    // Konfiguráció frissítése
    const { clusterId, clusterPath: _, ...restConfig } = config;
    await prisma.server.update({
      where: { id: serverId },
      data: {
        arkClusterId: null,
        configuration: restConfig,
      },
    });

    logger.info('Server removed from ARK cluster', { serverId });

    return { success: true };
  } catch (error: any) {
    logger.error('Failed to remove server from ARK cluster', error as Error, {
      serverId,
    });
    return {
      success: false,
      error: error.message || 'Failed to remove server from cluster',
    };
  }
}

/**
 * Cluster szerverek listázása
 */
export async function getClusterServers(clusterId: string) {
  return await prisma.server.findMany({
    where: {
      gameType: {
        in: ['ARK_EVOLVED', 'ARK_ASCENDED'],
      },
      arkClusterId: clusterId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      machine: {
        select: {
          id: true,
          name: true,
          ipAddress: true,
        },
      },
    },
  });
}

/**
 * Ellenőrzi, hogy az ARK shared fájlok telepítve vannak-e egy adott gépen egy adott felhasználóhoz.
 */
export async function checkARKSharedInstallation(
  userId: string,
  machineId: string,
  gameType: GameType,
  machine: any
): Promise<boolean> {
  const sharedPath = getARKSharedPath(userId, machineId);
  
  const checkCommand = gameType === 'ARK_EVOLVED'
    ? `test -f ${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer && echo "installed" || echo "not_installed"`
    : gameType === 'ARK_ASCENDED'
    ? `test -f ${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer && echo "installed" || echo "not_installed"`
    : `test -d ${sharedPath} && echo "installed" || echo "not_installed"`;
  
  logger.debug(`Checking ARK shared installation: ${checkCommand} on machine ${machine.ipAddress}`);
  try {
    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      checkCommand
    );
    return result.stdout.trim() === 'installed';
  } catch (error: any) {
    logger.error('Error checking ARK shared installation', error as Error, { userId, machineId, sharedPath });
    return false;
  }
}
