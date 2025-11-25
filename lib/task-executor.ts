import { prisma } from '@/lib/prisma';
import { TaskStatus, TaskType, ServerStatus } from '@prisma/client';
import { generateServerPort } from './server-provisioning';

/**
 * Feladat végrehajtása
 */
export async function executeTask(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      agent: {
        include: {
          machine: true,
        },
      },
      server: true,
    },
  });

  if (!task) {
    throw new Error('Feladat nem található');
  }

  if (task.status !== 'PENDING') {
    throw new Error('Csak PENDING státuszú feladat hajtható végre');
  }

  // Task státusz frissítése RUNNING-re
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    let result: any = {};

    switch (task.type) {
      case 'PROVISION':
        result = await executeProvisionTask(task);
        break;
      case 'START':
        result = await executeStartTask(task);
        break;
      case 'STOP':
        result = await executeStopTask(task);
        break;
      case 'RESTART':
        result = await executeRestartTask(task);
        break;
      case 'UPDATE':
        result = await executeUpdateTask(task);
        break;
      case 'BACKUP':
        result = await executeBackupTask(task);
        break;
      case 'DELETE':
        result = await executeDeleteTask(task);
        break;
      case 'INSTALL_AGENT':
        // Agent telepítés már a route-ban van kezelve
        result = { message: 'Agent telepítés folyamatban' };
        break;
      default:
        throw new Error(`Ismeretlen feladat típus: ${task.type}`);
    }

    // Task sikeresen befejezve
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result,
      },
    });
  } catch (error: any) {
    // Task hibával befejezve
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error.message,
      },
    });

    // Ha szerver művelet volt, állítsuk be ERROR státuszt
    if (task.serverId && ['START', 'STOP', 'RESTART'].includes(task.type)) {
      await prisma.server.update({
        where: { id: task.serverId },
        data: { status: 'ERROR' },
      });
    }

    // Email értesítés küldése
    const { sendTaskCompletionNotification } = await import('./email-notifications');
    sendTaskCompletionNotification(taskId).catch(console.error);

    throw error;
  }
}

/**
 * Provision task végrehajtása - új szerver telepítése
 */
async function executeProvisionTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a provisioning-hoz');
  }

  const server = task.server;
  const agent = task.agent;

  // Szerver státusz frissítése STARTING-re
  await prisma.server.update({
    where: { id: task.serverId },
    data: { status: 'STARTING' },
  });

  // Port generálása, ha nincs
  if (!server.port) {
    const port = await generateServerPort(server.gameType);
    await prisma.server.update({
      where: { id: task.serverId },
      data: { port },
    });
  }

  // IP cím beállítása, ha nincs
  if (!server.ipAddress && agent.machine) {
    await prisma.server.update({
      where: { id: task.serverId },
      data: { ipAddress: agent.machine.ipAddress },
    });
  }

  // TODO: Valós implementációban itt kellene:
  // 1. Docker container létrehozása az agent gépen
  // 2. Game szerver telepítése
  // 3. Konfiguráció beállítása
  // 4. Portok nyitása
  // 5. Szerver indítása

  // Szimuláció
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Szerver státusz frissítése ONLINE-ra
  await prisma.server.update({
    where: { id: task.serverId },
    data: { status: 'ONLINE' },
  });

  return {
    message: 'Szerver sikeresen telepítve és elindítva',
    ipAddress: agent.machine?.ipAddress,
    port: server.port,
  };
}

/**
 * Start task végrehajtása - szerver indítása
 */
async function executeStartTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges az indításhoz');
  }

  const server = task.server;

  // Szerver státusz frissítése STARTING-re
  await prisma.server.update({
    where: { id: task.serverId },
    data: { status: 'STARTING' },
  });

  // TODO: Valós implementációban itt kellene:
  // 1. SSH kapcsolat az agent géppel
  // 2. Docker container indítása vagy systemd service start
  // 3. Szerver állapot ellenőrzése

  // Szimuláció
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Szerver státusz frissítése ONLINE-ra
  await prisma.server.update({
    where: { id: task.serverId },
    data: { status: 'ONLINE' },
  });

  return {
    message: 'Szerver sikeresen elindítva',
    status: 'ONLINE',
  };
}

/**
 * Stop task végrehajtása - szerver leállítása
 */
async function executeStopTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a leállításhoz');
  }

  const server = task.server;

  // Szerver státusz frissítése STOPPING-re
  await prisma.server.update({
    where: { id: task.serverId },
    data: { status: 'STOPPING' },
  });

  // TODO: Valós implementációban itt kellene:
  // 1. SSH kapcsolat az agent géppel
  // 2. Docker container leállítása vagy systemd service stop
  // 3. Szerver állapot ellenőrzése

  // Szimuláció
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Szerver státusz frissítése OFFLINE-ra
  await prisma.server.update({
    where: { id: task.serverId },
    data: { status: 'OFFLINE' },
  });

  return {
    message: 'Szerver sikeresen leállítva',
    status: 'OFFLINE',
  };
}

/**
 * Restart task végrehajtása - szerver újraindítása
 */
async function executeRestartTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges az újraindításhoz');
  }

  // Először leállítás
  await executeStopTask(task);

  // Várás
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Aztán indítás
  await executeStartTask(task);

  return {
    message: 'Szerver sikeresen újraindítva',
    status: 'ONLINE',
  };
}

/**
 * Update task végrehajtása - szerver frissítése
 */
async function executeUpdateTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a frissítéshez');
  }

  // TODO: Valós implementációban itt kellene:
  // 1. Szerver leállítása
  // 2. Frissítés letöltése
  // 3. Szerver frissítése
  // 4. Szerver indítása

  await new Promise((resolve) => setTimeout(resolve, 5000));

  return {
    message: 'Szerver sikeresen frissítve',
  };
}

/**
 * Backup task végrehajtása - szerver backup készítése
 */
async function executeBackupTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a backup-hoz');
  }

  // Valós backup készítése SSH-n keresztül
  const { createServerBackup } = await import('./backup-storage');
  const backupName = task.command?.name || `backup-${Date.now()}`;
  const backupResult = await createServerBackup(task.serverId, backupName);

  if (!backupResult.success) {
    throw new Error(backupResult.error || 'Backup készítési hiba');
  }

  return {
    message: 'Backup sikeresen létrehozva',
    backupPath: backupResult.backupPath,
  };
}

/**
 * Delete task végrehajtása - szerver törlése
 */
async function executeDeleteTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a törléshez');
  }

  // Szerver leállítása először
  await executeStopTask(task);

  // TODO: Valós implementációban itt kellene:
  // 1. Docker container törlése
  // 2. Fájlok törlése
  // 3. Portok felszabadítása

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Szerver törlése az adatbázisból (cascade miatt automatikusan törlődnek a kapcsolatok)
  // Ezt a route-ban kell kezelni, mert itt már nincs task.server

  return {
    message: 'Szerver sikeresen törölve',
  };
}

/**
 * Várakozó feladatok feldolgozása
 */
export async function processPendingTasks(): Promise<void> {
  const pendingTasks = await prisma.task.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      agent: true,
      server: true,
    },
    take: 10, // Egyszerre maximum 10 feladat
    orderBy: { createdAt: 'asc' },
  });

  for (const task of pendingTasks) {
    try {
      await executeTask(task.id);
    } catch (error) {
      console.error(`Task ${task.id} végrehajtási hiba:`, error);
    }
  }
}
