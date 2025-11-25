/**
 * ARK Cluster kezelés
 * A Cluster mappa a weboldal szerverén van, és NFS vagy hasonló módon megosztva
 */

import { prisma } from './prisma';
import { executeSSHCommand } from './ssh-client';
import { logger } from './logger';

// Cluster mappa elérési út a weboldal szerverén
const CLUSTER_BASE_PATH = process.env.ARK_CLUSTER_PATH || '/opt/ark-cluster';
const CLUSTER_NFS_PATH = process.env.ARK_CLUSTER_NFS_PATH || '/mnt/ark-cluster';

/**
 * ARK Cluster mappa létrehozása
 */
export async function createClusterFolder(clusterId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // A weboldal szerverén létrehozzuk a cluster mappát
    // Ez általában a webszerver gépen van
    const clusterPath = `${CLUSTER_BASE_PATH}/${clusterId}`;
    
    // TODO: SSH kapcsolat a webszerverhez (vagy lokális ha ugyanaz a gép)
    // Most feltételezzük, hogy lokális
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
      // TODO: NFS server IP cím a környezeti változókból
      const nfsServer = process.env.ARK_CLUSTER_NFS_SERVER || 'localhost';
      
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `mkdir -p ${mountPoint} && mount -t nfs ${nfsServer}:${CLUSTER_BASE_PATH}/${clusterId} ${mountPoint} || echo "Mount failed, using local path"`
      );
    }

    // GameUserSettings.ini frissítése cluster beállításokkal
    // ARK-nál az instance path-ot használjuk (felhasználó + szervergép kombináció)
    const serverConfig = (server.configuration as any) || {};
    const machineId = serverConfig.machineId || machine.id;
    const instancePath = serverConfig.instancePath || `/opt/ark-shared/${server.userId}-${machineId}/instances/${serverId}`;
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
      `echo "${clusterConfig}" >> ${configPath}`
    );

    // Szerver konfiguráció frissítése az adatbázisban
    const currentConfig = (server.configuration as any) || {};
    await prisma.server.update({
      where: { id: serverId },
      data: {
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
      configuration: {
        path: ['clusterId'],
        equals: clusterId,
      },
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

