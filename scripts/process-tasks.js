#!/usr/bin/env node

/**
 * Cron job script a várakozó feladatok feldolgozásához
 * Futtatás: node scripts/process-tasks.js
 * Cron: */5 * * * * node /path/to/scripts/process-tasks.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function processPendingTasks() {
  try {
    console.log(`[${new Date().toISOString()}] Task feldolgozás indítása...`);

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

    console.log(`${pendingTasks.length} várakozó feladat található`);

    for (const task of pendingTasks) {
      try {
        console.log(`Task ${task.id} feldolgozása (${task.type})...`);

        // Task státusz frissítése RUNNING-re
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'RUNNING',
            startedAt: new Date(),
          },
        });

        // TODO: Itt kellene a tényleges task végrehajtás
        // Jelenleg csak szimuláljuk
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Task sikeresen befejezve
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            result: { message: 'Task sikeresen végrehajtva' },
          },
        });

        console.log(`Task ${task.id} sikeresen befejezve`);
      } catch (error) {
        console.error(`Task ${task.id} hiba:`, error);
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            error: error.message,
          },
        });
      }
    }

    console.log(`[${new Date().toISOString()}] Task feldolgozás befejezve`);
  } catch (error) {
    console.error('Task feldolgozási hiba:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Offline agentek ellenőrzése
async function checkOfflineAgents() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const offlineAgents = await prisma.agent.findMany({
      where: {
        status: 'ONLINE',
        lastHeartbeat: {
          lt: fiveMinutesAgo,
        },
      },
    });

    for (const agent of offlineAgents) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { status: 'OFFLINE' },
      });
      console.log(`Agent ${agent.agentId} offline-ra állítva`);
    }
  } catch (error) {
    console.error('Offline agentek ellenőrzési hiba:', error);
  }
}

// Fő folyamat
async function main() {
  await processPendingTasks();
  await checkOfflineAgents();
  process.exit(0);
}

main();

