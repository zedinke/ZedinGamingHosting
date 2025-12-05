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
    // Input validálás
    if (!machine || !machine.ipAddress || !machine.sshPort || !machine.sshUser) {
      return {
        success: false,
        error: 'Szerver gép adatai hiányosak (ipAddress, sshPort, sshUser szükséges)',
      };
    }

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
    const nfsServer = process.env.ARK_CLUSTER_NFS_SERVER;
    
    logger.info('Adding server to cluster', {
      serverId,
      clusterId,
      machineId: machine.id,
      mountPoint,
      hasNFS: !!nfsServer
    });
    
    const sshConfig = {
      host: machine.ipAddress,
      port: machine.sshPort || 22,
      user: machine.sshUser || 'root',
      keyPath: machine.sshKeyPath || undefined,
    };

    // Ellenőrizzük, hogy már mount-olva van-e
    try {
      const checkMount = await executeSSHCommand(
        sshConfig,
        `mountpoint -q "${mountPoint}" && echo "mounted" || echo "not_mounted"`
      );

      if (!checkMount.stdout?.includes('mounted') && nfsServer) {
        logger.info('Mounting NFS cluster directory', { clusterId, mountPoint });
        
        const clusterPath = getARKClusterPath(clusterId);
        
        // NFS mount attempt
        try {
          await executeSSHCommand(
            sshConfig,
            `mkdir -p "${mountPoint}" && sudo mount -t nfs -o rw,sync,no_subtree_check "${nfsServer}:${clusterPath}" "${mountPoint}"`
          );
          logger.info('NFS mount successful', { clusterId, mountPoint });
        } catch (mountError) {
          logger.warn('NFS mount failed, will use local path', { 
            clusterId,
            error: mountError instanceof Error ? mountError.message : String(mountError)
          });
        }
      }
    } catch (checkError) {
      logger.warn('Error checking mount point', { 
        mountPoint, 
        error: checkError instanceof Error ? checkError.message : String(checkError)
      });
    }

    // GameUserSettings.ini frissítése cluster beállításokkal
    const currentConfig = (server.configuration as any) || {};
    const machineId = currentConfig.machineId || machine.id;
    const instancePath = currentConfig.instancePath || 
      getARKSharedPath(server.userId, machineId) + `/instances/${serverId}`;
    const configPath = `${instancePath}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini`;
    
    // Cluster beállítások létrehozása
    const clusterConfig = `[ServerSettings]
ClusterDirOverride=${mountPoint}
ClusterId=${clusterId}
`;

    // Konfigurációs könyvtár létrehozása és frissítése
    try {
      await executeSSHCommand(
        sshConfig,
        `mkdir -p "$(dirname "${configPath}")" && echo '${clusterConfig.replace(/'/g, "'\\''")}' >> "${configPath}"`
      );
      logger.info('Cluster config added to server', { serverId, clusterId });
    } catch (configError) {
      logger.error('Error adding cluster config to server', configError as Error, { 
        serverId, 
        clusterId,
        configPath 
      });
      return {
        success: false,
        error: `Konfiguráció frissítés sikertelen: ${configError instanceof Error ? configError.message : 'Unknown error'}`,
      };
    }

    // Szerver konfiguráció frissítése az adatbázisban
    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...currentConfig,
          clusterId,
          clusterPath: mountPoint,
          machineId,
          instancePath,
        },
      },
    });

    logger.info('Server successfully added to ARK cluster', {
      serverId,
      clusterId,
      machineId: machine.id,
      mountPoint,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Failed to add server to ARK cluster', error as Error, {
      serverId,
      clusterId,
    });
    return {
      success: false,
      error: error.message || 'Cluster-hez való hozzáadás sikertelen',
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
  const servers = await prisma.server.findMany({
    where: {
      gameType: {
        in: ['ARK_EVOLVED', 'ARK_ASCENDED'],
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

  // Filter by clusterId from configuration JSON
  return servers.filter((server) => {
    const config = server.configuration as any;
    return config?.clusterId === clusterId;
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
  
  // ARK Ascended: Windows bináris Wine-nal futtatódik
  const checkCommand = gameType === 'ARK_ASCENDED'
    ? `test -f "${sharedPath}/ShooterGame/Binaries/Win64/ArkAscendedServer.exe" && echo "installed" || echo "not_installed"`
    : `test -d "${sharedPath}" && echo "installed" || echo "not_installed"`;
  
  logger.debug(`Checking ARK shared installation: ${checkCommand} on machine ${machine.ipAddress}`);
  try {
    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort || 22,
        user: machine.sshUser || 'root',
        keyPath: machine.sshKeyPath || undefined,
      },
      checkCommand
    );
    const installed = result.stdout?.trim() === 'installed';
    logger.info('ARK installation check result', { 
      userId, 
      machineId, 
      gameType, 
      installed,
      sharedPath 
    });
    return installed;
  } catch (error: any) {
    logger.error('Error checking ARK shared installation', error as Error, { 
      userId, 
      machineId, 
      sharedPath,
      error: error.message 
    });
    return false;
  }
}

/**
 * Cluster szinkronizálási status ellenőrzése
 * KRITIKUS: Timeout és error handling szükséges NFS megosztásoknál
 */
export async function checkClusterSync(
  clusterId: string,
  machine: any
): Promise<{ synced: boolean; error?: string; lastSync?: Date }> {
  try {
    const clusterPath = getARKClusterPath(clusterId);
    const touchFile = `${clusterPath}/.sync-check-${Date.now()}`;
    
    // Cluster szinkronizálási ellenőrzés: nyírási és olvasási test
    const checkCommand = `
      set -e
      mkdir -p "${clusterPath}" || exit 1
      
      # Írási test
      touch "${touchFile}" 2>/dev/null || exit 2
      
      # Olvasási test
      test -f "${touchFile}" || exit 3
      
      # Cleanup
      rm -f "${touchFile}" 2>/dev/null || true
      
      echo "synced"
    `;

    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort || 22,
        user: machine.sshUser || 'root',
        keyPath: machine.sshKeyPath || undefined,
      },
      checkCommand
    );

    if (result.stdout?.includes('synced')) {
      logger.info('Cluster sync check successful', { clusterId, clusterPath });
      return { 
        synced: true, 
        lastSync: new Date() 
      };
    } else {
      return {
        synced: false,
        error: `Cluster szinkronizálás sikertelen: ${result.stderr || 'Unknown error'}`,
      };
    }
  } catch (error: any) {
    logger.error('Error checking cluster sync', error as Error, { clusterId });
    return {
      synced: false,
      error: error.message || 'Cluster sync check failed',
    };
  }
}
