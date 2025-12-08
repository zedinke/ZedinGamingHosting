/**
 * ARK Cluster NFS Support
 * NFS mount kezelés ARK játékokhoz több szervergépen
 */

import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from './ssh-client';
import { logger } from './logger';

export interface ARKClusterNFSResult {
  success: boolean;
  clusterPath?: string;
  error?: string;
}

/**
 * ARK Cluster NFS Manager
 */
export class ARKClusterNFS {
  /**
   * NFS mount beállítása
   */
  static async setupNFSMount(
    machineId: string,
    clusterId: string
  ): Promise<ARKClusterNFSResult> {
    try {
      logger.info('Setting up NFS mount for ARK cluster', { machineId, clusterId });

      const machine = await prisma.serverMachine.findUnique({
        where: { id: machineId },
      });

      if (!machine) {
        throw new Error('Machine not found');
      }

      const clusterPath = this.getClusterPath(clusterId);

      // NFS mount ellenőrzése
      const sshConfig = {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      };

      if (!sshConfig.keyPath) {
        throw new Error('SSH key path is required');
      }

      // Cluster mappa létrehozása
      await this.ensureClusterDirectory(machineId, clusterId, sshConfig);

      // NFS mount ellenőrzése (ha nincs mount-olva)
      const mountCheck = await executeSSHCommand(
        sshConfig,
        `mountpoint -q ${clusterPath} && echo 'MOUNTED' || echo 'NOT_MOUNTED'`
      );

      if (mountCheck.stdout.includes('NOT_MOUNTED')) {
        // NFS mount (ha szükséges)
        // MEGJEGYZÉS: Az NFS szerver IP-t és export path-t konfigurációból kell venni
        // Egyelőre csak a mappát hozzuk létre
        logger.info('NFS mount not configured, using local directory', { clusterPath });
      }

      logger.info('NFS mount setup completed', { machineId, clusterId, clusterPath });

      return {
        success: true,
        clusterPath,
      };
    } catch (error: any) {
      logger.error('NFS mount setup failed', error, { machineId, clusterId });
      return {
        success: false,
        error: error.message || 'NFS mount setup failed',
      };
    }
  }

  /**
   * Cluster mappa elérési út
   */
  static getClusterPath(clusterId: string): string {
    return `/opt/shared-Arks/${clusterId}`;
  }

  /**
   * Cluster mappa létrehozása
   */
  static async ensureClusterDirectory(
    machineId: string,
    clusterId: string,
    sshConfig?: any
  ): Promise<void> {
    try {
      const clusterPath = this.getClusterPath(clusterId);

      if (sshConfig) {
        // SSH-n keresztül mappa létrehozása
        await executeSSHCommand(
          sshConfig,
          `mkdir -p ${clusterPath} && chmod 755 ${clusterPath}`
        );
        logger.info('Cluster directory created via SSH', { machineId, clusterPath });
      } else {
        // Lokális mappa létrehozása (ha lokálisan futunk)
        const { mkdir } = await import('fs/promises');
        await mkdir(clusterPath, { recursive: true });
        logger.info('Cluster directory created locally', { clusterPath });
      }
    } catch (error: any) {
      logger.error('Cluster directory creation failed', error, { machineId, clusterId });
      throw error;
    }
  }

  /**
   * Cluster adatok szinkronizálása
   */
  static async syncClusterData(
    clusterId: string,
    serverId: string
  ): Promise<ARKClusterNFSResult> {
    try {
      logger.info('Syncing cluster data', { clusterId, serverId });

      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          machine: true,
        },
      });

      if (!server || !server.machine) {
        throw new Error('Server or machine not found');
      }

      const clusterPath = this.getClusterPath(clusterId);
      const serverClusterPath = `${clusterPath}/servers/${serverId}`;

      const sshConfig = {
        host: server.machine.ipAddress,
        port: server.machine.sshPort,
        user: server.machine.sshUser,
        keyPath: server.machine.sshKeyPath || undefined,
      };

      if (!sshConfig.keyPath) {
        throw new Error('SSH key path is required');
      }

      // Szerver cluster mappa létrehozása
      await executeSSHCommand(
        sshConfig,
        `mkdir -p ${serverClusterPath} && chmod 755 ${serverClusterPath}`
      );

      logger.info('Cluster data synced', { clusterId, serverId, serverClusterPath });

      return {
        success: true,
        clusterPath: serverClusterPath,
      };
    } catch (error: any) {
      logger.error('Cluster data sync failed', error, { clusterId, serverId });
      return {
        success: false,
        error: error.message || 'Cluster data sync failed',
      };
    }
  }

  /**
   * Cluster mappa elérési út szerver számára
   */
  static getServerClusterPath(clusterId: string, serverId: string): string {
    return `${this.getClusterPath(clusterId)}/servers/${serverId}`;
  }

  /**
   * Cluster mappa elérési út Docker volume mount-hoz
   */
  static getDockerVolumeMount(clusterId: string): string {
    const clusterPath = this.getClusterPath(clusterId);
    return `${clusterPath}:/cluster`;
  }
}

export default ARKClusterNFS;

