/**
 * Szerver migráció - szerver áttelepítése másik gépre
 * Minden fájllal, backup-pal, konfigurációval együtt
 */

import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from './ssh-client';
import { logger } from './logger';

interface MigrationOptions {
  serverId: string;
  targetMachineId: string;
  targetAgentId: string;
}

/**
 * Szerver migráció végrehajtása
 */
export async function migrateServer(
  options: MigrationOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Starting server migration', {
      serverId: options.serverId,
      targetMachineId: options.targetMachineId,
      targetAgentId: options.targetAgentId,
    });

    // Szerver adatok lekérdezése
    const server = await prisma.server.findUnique({
      where: { id: options.serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
        machine: true,
        user: true,
      },
    });

    if (!server) {
      return {
        success: false,
        error: 'Szerver nem található',
      };
    }

    if (!server.machine || !server.agent) {
      return {
        success: false,
        error: 'Szerver nincs hozzárendelve géphez vagy agenhez',
      };
    }

    // Cél gép és agent lekérdezése
    const targetMachine = await prisma.serverMachine.findUnique({
      where: { id: options.targetMachineId },
      include: {
        agents: {
          where: { id: options.targetAgentId },
        },
      },
    });

    if (!targetMachine || targetMachine.agents.length === 0) {
      return {
        success: false,
        error: 'Cél gép vagy agent nem található',
      };
    }

    const targetAgent = targetMachine.agents[0];

    // Ellenőrizzük, hogy a cél gép elérhető-e
    if (targetMachine.status !== 'ONLINE' || targetAgent.status !== 'ONLINE') {
      return {
        success: false,
        error: 'Cél gép vagy agent nem ONLINE',
      };
    }

    // Szerver leállítása (ha fut)
    if (server.status === 'ONLINE' || server.status === 'STARTING') {
      logger.info('Stopping server before migration', { serverId: options.serverId });
      
      // Task létrehozása a leállításhoz
      await prisma.task.create({
        data: {
          agentId: server.agentId,
          serverId: server.id,
          type: 'STOP',
          status: 'PENDING',
          command: {
            action: 'stop',
            serverId: server.id,
          },
        },
      });

      // Várunk, hogy a szerver leálljon
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Szerver fájlok útvonalának meghatározása
    const isARK = server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED';
    let sourceServerPath: string;
    let targetServerPath: string;

    if (isARK) {
      const { getARKSharedPath, createARKSharedFolder } = await import('./ark-cluster');
      const sourceSharedPath = getARKSharedPath(server.userId, server.machineId!);
      const targetSharedPath = getARKSharedPath(server.userId, targetMachine.id);
      sourceServerPath = `${sourceSharedPath}/instances/${server.id}`;
      targetServerPath = `${targetSharedPath}/instances/${server.id}`;
      
      // Cél gépen shared mappa létrehozása
      const createResult = await createARKSharedFolder(server.userId, targetMachine.id, {
        ipAddress: targetMachine.ipAddress,
        sshPort: targetMachine.sshPort,
        sshUser: targetMachine.sshUser,
        sshKeyPath: targetMachine.sshKeyPath || undefined,
      });
      
      if (!createResult.success) {
        logger.warn('Failed to create ARK shared folder, continuing anyway', { error: createResult.error });
      }
    } else {
      sourceServerPath = `/opt/servers/${server.id}`;
      targetServerPath = `/opt/servers/${server.id}`;
    }

    // Forrás gép SSH konfiguráció
    const sourceSSHConfig = {
      host: server.machine.ipAddress,
      port: server.machine.sshPort,
      user: server.machine.sshUser,
      keyPath: server.machine.sshKeyPath || undefined,
    };

    // Cél gép SSH konfiguráció
    const targetSSHConfig = {
      host: targetMachine.ipAddress,
      port: targetMachine.sshPort,
      user: targetMachine.sshUser,
      keyPath: targetMachine.sshKeyPath || undefined,
    };

    logger.info('Copying server files', {
      sourcePath: sourceServerPath,
      targetPath: targetServerPath,
    });

    // 1. Backup készítése a forrás gépen (biztonsági okokból)
    const backupPath = `/tmp/server-${server.id}-migration-${Date.now()}.tar.gz`;
    await executeSSHCommand(
      sourceSSHConfig,
      `cd "${sourceServerPath}" && tar -czf "${backupPath}" . 2>&1 || echo "Backup failed"`
    );

    // 2. Cél gépen könyvtár létrehozása
    await executeSSHCommand(
      targetSSHConfig,
      `mkdir -p "${targetServerPath}"`
    );

    // 3. Fájlok másolása forrásról célra
    // Először próbáljuk az rsync-et (gyorsabb és megbízhatóbb)
    if (sourceSSHConfig.keyPath) {
      // Rsync használata SSH kulccsal
      const rsyncCommand = `rsync -avz --progress -e "ssh -i ${sourceSSHConfig.keyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${targetSSHConfig.port}" "${sourceServerPath}/" ${targetSSHConfig.user}@${targetSSHConfig.host}:${targetServerPath}/`;
      const rsyncResult = await executeSSHCommand(sourceSSHConfig, rsyncCommand, 600000); // 10 perc timeout
      
      if (rsyncResult.exitCode !== 0) {
        logger.warn('Rsync failed, trying tar+ssh method', { error: rsyncResult.stderr });
        
        // Alternatív módszer: tar+ssh kombináció
        const tarCommand = `cd "${sourceServerPath}" && tar czf - . | ssh -i ${sourceSSHConfig.keyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${targetSSHConfig.port} ${targetSSHConfig.user}@${targetSSHConfig.host} "mkdir -p '${targetServerPath}' && cd '${targetServerPath}' && tar xzf -"`;
        const tarResult = await executeSSHCommand(sourceSSHConfig, tarCommand, 600000);
        
        if (tarResult.exitCode !== 0) {
          return {
            success: false,
            error: `Fájlok másolása sikertelen: ${tarResult.stderr || rsyncResult.stderr}`,
          };
        }
      } else {
        logger.info('Files copied successfully using rsync');
      }
    } else {
      return {
        success: false,
        error: 'SSH kulcs szükséges a migrációhoz',
      };
    }

    // 4. Backup-ok másolása (ha vannak)
    const backupDir = `/opt/backups/${server.id}`;
    const targetBackupDir = `/opt/backups/${server.id}`;
    
    // Ellenőrizzük, hogy vannak-e backup-ok
    const backupCheck = await executeSSHCommand(
      sourceSSHConfig,
      `test -d "${backupDir}" && echo "exists" || echo "not_exists"`
    );

    if (backupCheck.stdout.includes('exists')) {
      logger.info('Copying backups', { backupDir, targetBackupDir });
      
      await executeSSHCommand(
        targetSSHConfig,
        `mkdir -p "${targetBackupDir}"`
      );

      // Backup-ok másolása rsync-cel
      const backupRsyncCommand = `rsync -avz -e "ssh -i ${sourceSSHConfig.keyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${targetSSHConfig.port}" "${backupDir}/" ${targetSSHConfig.user}@${targetSSHConfig.host}:${targetBackupDir}/`;
      const backupResult = await executeSSHCommand(sourceSSHConfig, backupRsyncCommand, 300000);
      
      if (backupResult.exitCode !== 0) {
        logger.warn('Backup copy failed, trying tar method', { error: backupResult.stderr });
        // Alternatív módszer
        const backupCopyCommand = `cd "${backupDir}" && tar czf - . | ssh -i ${sourceSSHConfig.keyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${targetSSHConfig.port} ${targetSSHConfig.user}@${targetSSHConfig.host} "mkdir -p '${targetBackupDir}' && cd '${targetBackupDir}' && tar xzf -"`;
        await executeSSHCommand(sourceSSHConfig, backupCopyCommand, 300000);
      }
    }

    // 5. Szerver adatbázis rekord frissítése
    await prisma.server.update({
      where: { id: options.serverId },
      data: {
        machineId: options.targetMachineId,
        agentId: options.targetAgentId,
        ipAddress: targetMachine.ipAddress,
        status: 'OFFLINE', // Migráció után offline, majd újra kell indítani
      },
    });


    logger.info('Server migration completed successfully', {
      serverId: options.serverId,
      fromMachine: server.machine.name,
      toMachine: targetMachine.name,
    });

    // 7. Értesítés küldése a felhasználónak
    if (server.userId) {
      const { createNotification } = await import('./notifications');
      await createNotification(
        server.userId,
        'SERVER_MIGRATED',
        'Szerver áttelepítve',
        `A(z) "${server.name}" szervered sikeresen át lett telepítve a ${targetMachine.name} gépre.`,
        'medium',
        {
          serverId: server.id,
          oldMachine: server.machine.name,
          newMachine: targetMachine.name,
        }
      ).catch(console.error);
    }

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error('Server migration error', error as Error, {
      serverId: options.serverId,
      targetMachineId: options.targetMachineId,
    });

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a migráció során',
    };
  }
}

/**
 * Migráció előkészítése - ellenőrzi, hogy lehetséges-e a migráció
 */
export async function prepareMigration(
  serverId: string,
  targetMachineId: string
): Promise<{ canMigrate: boolean; error?: string; estimatedSize?: number }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        machine: true,
        agent: true,
      },
    });

    if (!server || !server.machine || !server.agent) {
      return {
        canMigrate: false,
        error: 'Szerver, gép vagy agent nem található',
      };
    }

    const targetMachine = await prisma.serverMachine.findUnique({
      where: { id: targetMachineId },
      include: {
        agents: {
          where: { status: 'ONLINE' },
        },
      },
    });

    if (!targetMachine) {
      return {
        canMigrate: false,
        error: 'Cél gép nem található',
      };
    }

    if (targetMachine.agents.length === 0) {
      return {
        canMigrate: false,
        error: 'Cél gépen nincs ONLINE agent',
      };
    }

    if (targetMachine.id === server.machineId) {
      return {
        canMigrate: false,
        error: 'A szerver már ezen a gépen van',
      };
    }

    // Ellenőrizzük a cél gép erőforrásait
    const resources = targetMachine.resources as any;
    if (resources) {
      const totalRam = resources.ram?.total || 0;
      const usedRam = resources.ram?.used || 0;
      const totalDisk = resources.disk?.total || 0;
      const usedDisk = resources.disk?.used || 0;

      // Becsüljük meg a szerver méretét (kb. 5-20 GB játék típustól függően)
      const estimatedSize = 10 * 1024 * 1024 * 1024; // 10 GB becslés
      const availableDisk = totalDisk - usedDisk;

      if (availableDisk < estimatedSize) {
        return {
          canMigrate: false,
          error: `Nincs elég tárhely a cél gépen. Szükséges: ~${Math.round(estimatedSize / 1024 / 1024 / 1024)}GB, Elérhető: ${Math.round(availableDisk / 1024 / 1024 / 1024)}GB`,
        };
      }
    }

    return {
      canMigrate: true,
      estimatedSize: 10 * 1024 * 1024 * 1024, // 10 GB becslés
    };
  } catch (error: any) {
    return {
      canMigrate: false,
      error: error.message || 'Hiba az előkészítés során',
    };
  }
}

