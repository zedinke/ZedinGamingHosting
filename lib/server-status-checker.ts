/**
 * Szerver állapot ellenőrzése - valós idejű státusz szinkronizálás
 * SSH-n keresztül ellenőrzi, hogy a szerver ténylegesen fut-e
 */

import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from './ssh-client';
import { logger } from './logger';
import { ServerStatus } from '@prisma/client';

/**
 * Ellenőrzi, hogy a szerver ténylegesen fut-e a gépen
 */
export async function checkServerStatus(serverId: string): Promise<{
  isRunning: boolean;
  actualStatus: ServerStatus;
  details?: string;
}> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent || !server.agent.machine) {
      return {
        isRunning: false,
        actualStatus: 'OFFLINE',
        details: 'Szerver, agent vagy gép nem található',
      };
    }

    const machine = server.agent.machine;
    const serviceName = `server-${serverId}`;

    // 1. Systemd service státusz ellenőrzése
    const systemctlResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `systemctl is-active ${serviceName} 2>&1 || echo "inactive"`
    );

    const isActive = systemctlResult.stdout.trim() === 'active';

    // 2. Process ellenőrzése (ha systemd nem elérhető)
    let processRunning = false;
    if (!isActive) {
      // Próbáljuk meg process-szel ellenőrizni
      const processCheck = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `ps aux | grep -E "server-${serverId}|${serverId}" | grep -v grep | wc -l`
      );

      const processCount = parseInt(processCheck.stdout.trim()) || 0;
      processRunning = processCount > 0;
    }

    // 3. Port ellenőrzése (ha van port beállítva)
    let portOpen = false;
    if (server.port) {
      const portCheck = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `netstat -tuln 2>/dev/null | grep ":${server.port} " || ss -tuln 2>/dev/null | grep ":${server.port} " || echo "closed"`
      );

      portOpen = !portCheck.stdout.includes('closed') && portCheck.stdout.trim().length > 0;
    }

    // Ha systemd active VAGY process fut VAGY port nyitva, akkor fut
    const isRunning = isActive || processRunning || portOpen;

    let actualStatus: ServerStatus = isRunning ? 'ONLINE' : 'OFFLINE';
    let details = '';

    if (isActive) {
      details = 'Systemd service aktív';
    } else if (processRunning) {
      details = 'Process fut, de systemd service nem aktív';
    } else if (portOpen) {
      details = 'Port nyitva, de process/systemd nem található';
    } else {
      details = 'Szerver nem fut';
    }

    return {
      isRunning,
      actualStatus,
      details,
    };
  } catch (error: any) {
    logger.error('Server status check error', error as Error, {
      serverId,
    });

    return {
      isRunning: false,
      actualStatus: 'ERROR',
      details: error.message || 'Hiba az állapot ellenőrzése során',
    };
  }
}

/**
 * Szinkronizálja a szerver státuszát a tényleges állapottal
 */
export async function syncServerStatus(serverId: string): Promise<{
  success: boolean;
  oldStatus: ServerStatus;
  newStatus: ServerStatus;
  details?: string;
}> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return {
        success: false,
        oldStatus: server?.status || 'OFFLINE',
        newStatus: 'OFFLINE',
        details: 'Szerver nem található',
      };
    }

    const oldStatus = server.status;
    const statusCheck = await checkServerStatus(serverId);

    // Csak akkor frissítjük, ha eltér a jelenlegi státusztól
    if (statusCheck.actualStatus !== oldStatus) {
      await prisma.server.update({
        where: { id: serverId },
        data: {
          status: statusCheck.actualStatus,
        },
      });

      logger.info('Server status synced', {
        serverId,
        oldStatus,
        newStatus: statusCheck.actualStatus,
        details: statusCheck.details,
      });

      // Értesítés küldése, ha státusz változott
      if (server.userId) {
        const { createNotification } = await import('./notifications');
        const statusLabels: Record<ServerStatus, string> = {
          ONLINE: 'Online',
          OFFLINE: 'Offline',
          STARTING: 'Indítás alatt',
          STOPPING: 'Leállítás alatt',
          RESTARTING: 'Újraindítás alatt',
          ERROR: 'Hiba',
        };

        await createNotification(
          server.userId,
          'SERVER_STATUS_CHANGE',
          'Szerver státusz változott',
          `A(z) "${server.name}" szerver státusza ${statusLabels[oldStatus]} → ${statusLabels[statusCheck.actualStatus]} lett. ${statusCheck.details || ''}`,
          statusCheck.actualStatus === 'ERROR' ? 'high' : 'medium',
          {
            serverId: server.id,
            oldStatus,
            newStatus: statusCheck.actualStatus,
          }
        ).catch(console.error);
      }
    }

    return {
      success: true,
      oldStatus,
      newStatus: statusCheck.actualStatus,
      details: statusCheck.details,
    };
  } catch (error: any) {
    logger.error('Server status sync error', error as Error, {
      serverId,
    });

    return {
      success: false,
      oldStatus: 'OFFLINE',
      newStatus: 'ERROR',
      details: error.message || 'Hiba a státusz szinkronizálása során',
    };
  }
}

/**
 * Összes szerver státuszának szinkronizálása
 */
export async function syncAllServerStatuses(): Promise<{
  synced: number;
  errors: number;
}> {
  try {
    const servers = await prisma.server.findMany({
      where: {
        status: {
          in: ['ONLINE', 'STARTING', 'RESTARTING'],
        },
        agentId: {
          not: null,
        },
      },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    let synced = 0;
    let errors = 0;

    for (const server of servers) {
      if (!server.agent || !server.agent.machine) continue;

      try {
        const result = await syncServerStatus(server.id);
        if (result.success && result.oldStatus !== result.newStatus) {
          synced++;
        }
      } catch (error) {
        errors++;
        logger.error('Sync server status error', error as Error, {
          serverId: server.id,
        });
      }
    }

    logger.info('All server statuses synced', {
      total: servers.length,
      synced,
      errors,
    });

    return { synced, errors };
  } catch (error) {
    logger.error('Sync all server statuses error', error as Error);
    return { synced: 0, errors: 0 };
  }
}

