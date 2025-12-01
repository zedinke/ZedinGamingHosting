import { prisma } from '@/lib/prisma';
import { ServerStatus } from '@prisma/client';
import { logger } from './logger';

/**
 * Belső szerver művelet végrehajtása (cron job-okhoz és más belső hívásokhoz)
 */
export async function executeServerActionInternal(
  serverId: string,
  action: string,
  server?: any
): Promise<void> {
  // Szerver lekérdezése, ha nincs megadva
  let serverData = server;
  if (!serverData) {
    serverData = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        premiumPackage: {
          include: {
            games: true,
          },
        },
      },
    });
    
    if (!serverData) {
      throw new Error('Szerver nem található');
    }
  }
  
  // Művelet végrehajtása
  switch (action) {
    case 'start':
      await executeStart(serverData);
      break;
      
    case 'stop':
      await executeStop(serverData);
      break;
      
    case 'restart':
      await executeRestart(serverData);
      break;
      
    case 'update':
      await executeUpdate(serverData);
      break;
      
    case 'wipe':
      await executeWipe(serverData);
      break;
      
    case 'backup':
      await executeBackup(serverData);
      break;
      
    case 'cleanup':
      await executeCleanup(serverData);
      break;
      
    case 'save':
      await executeSave(serverData);
      break;
      
    default:
      throw new Error(`Ismeretlen művelet: ${action}`);
  }
}

/**
 * Szerver indítása
 */
async function executeStart(server: any): Promise<void> {
  if (server.status === 'ONLINE' || server.status === 'STARTING') {
    throw new Error('A szerver már fut vagy indítás alatt van');
  }
  
  // Státusz frissítése
  await prisma.server.update({
    where: { id: server.id },
    data: { status: 'STARTING' },
  });
  
  // Task létrehozása
  if (server.agentId) {
    await prisma.task.create({
      data: {
        agentId: server.agentId,
        serverId: server.id,
        type: 'START',
        status: 'PENDING',
        command: {
          action: 'start',
        },
      },
    });
    
    // Task executor hívása
    const { executeTask } = await import('./task-executor');
    // A task executor automatikusan feldolgozza a task-ot
  } else {
    throw new Error('A szerverhez nincs rendelve agent');
  }
}

/**
 * Szerver leállítása
 */
async function executeStop(server: any): Promise<void> {
  if (server.status === 'OFFLINE' || server.status === 'STOPPING') {
    throw new Error('A szerver már le van állítva vagy leállítás alatt van');
  }
  
  // Státusz frissítése
  await prisma.server.update({
    where: { id: server.id },
    data: { status: 'STOPPING' },
  });
  
  // Task létrehozása
  if (server.agentId) {
    await prisma.task.create({
      data: {
        agentId: server.agentId,
        serverId: server.id,
        type: 'STOP',
        status: 'PENDING',
        command: {
          action: 'stop',
        },
      },
    });
    
    const { executeTask } = await import('./task-executor');
    // A task executor automatikusan feldolgozza a task-ot
  } else {
    throw new Error('A szerverhez nincs rendelve agent');
  }
}

/**
 * Szerver újraindítása
 */
async function executeRestart(server: any): Promise<void> {
  if (server.status !== 'ONLINE') {
    throw new Error('Csak online szerver indítható újra');
  }
  
  // Státusz frissítése
  await prisma.server.update({
    where: { id: server.id },
    data: { status: 'RESTARTING' },
  });
  
  // Task létrehozása
  if (server.agentId) {
    await prisma.task.create({
      data: {
        agentId: server.agentId,
        serverId: server.id,
        type: 'RESTART',
        status: 'PENDING',
        command: {
          action: 'restart',
        },
      },
    });
    
    const { executeTask } = await import('./task-executor');
    // A task executor automatikusan feldolgozza a task-ot
  } else {
    throw new Error('A szerverhez nincs rendelve agent');
  }
}

/**
 * Szerver frissítése
 */
async function executeUpdate(server: any): Promise<void> {
  if (!server.agentId) {
    throw new Error('A szerverhez nincs rendelve agent');
  }
  
  // Task létrehozása frissítéshez
  await prisma.task.create({
    data: {
      agentId: server.agentId,
      serverId: server.id,
      type: 'UPDATE',
      status: 'PENDING',
      command: {
        action: 'update',
      },
    },
  });
  
  const { executeTask } = await import('./task-executor');
  // A task executor automatikusan feldolgozza a task-ot
}

/**
 * Teljes wipe (világ/adatok törlése)
 */
async function executeWipe(server: any): Promise<void> {
  if (!server.agentId) {
    throw new Error('A szerverhez nincs rendelve agent');
  }
  
  // Wipe művelet játéktól függően
  // Task létrehozása
  await prisma.task.create({
    data: {
      agentId: server.agentId,
      serverId: server.id,
      type: 'UPDATE', // Wipe is egyfajta update
      status: 'PENDING',
      command: {
        action: 'wipe',
        gameType: server.gameType,
      },
    },
  });
  
  const { executeTask } = await import('./task-executor');
  // A task executor automatikusan feldolgozza a task-ot
}

/**
 * Backup készítése
 */
async function executeBackup(server: any): Promise<void> {
  if (!server.agentId) {
    throw new Error('A szerverhez nincs rendelve agent');
  }
  
  // Backup task létrehozása
  await prisma.task.create({
    data: {
      agentId: server.agentId,
      serverId: server.id,
      type: 'BACKUP',
      status: 'PENDING',
      command: {
        action: 'backup',
      },
    },
  });
  
  const { executeTask } = await import('./task-executor');
  // A task executor automatikusan feldolgozza a task-ot
}

/**
 * Cleanup műveletek (logok, régi fájlok törlése)
 */
async function executeCleanup(server: any): Promise<void> {
  if (!server.agentId) {
    throw new Error('A szerverhez nincs rendelve agent');
  }
  
  // Cleanup task létrehozása
  await prisma.task.create({
    data: {
      agentId: server.agentId,
      serverId: server.id,
      type: 'UPDATE', // Cleanup is egyfajta maintenance művelet
      status: 'PENDING',
      command: {
        action: 'cleanup',
        gameType: server.gameType,
      },
    },
  });
  
  const { executeTask } = await import('./task-executor');
  // A task executor automatikusan feldolgozza a task-ot
}

/**
 * Save mentés (amennyiben a játék támogatja)
 */
async function executeSave(server: any): Promise<void> {
  if (!server.agentId) {
    throw new Error('A szerverhez nincs rendelve agent');
  }
  
  // Save task létrehozása
  await prisma.task.create({
    data: {
      agentId: server.agentId,
      serverId: server.id,
      type: 'UPDATE', // Save is egyfajta maintenance művelet
      status: 'PENDING',
      command: {
        action: 'save',
        gameType: server.gameType,
      },
    },
  });
  
  const { executeTask } = await import('./task-executor');
  // A task executor automatikusan feldolgozza a task-ot
}

