import { prisma } from '@/lib/prisma';
import { executeTask } from './task-executor';

/**
 * Automatikus backup ütemezés ellenőrzése és létrehozása
 */
export async function scheduleAutomaticBackups(): Promise<void> {
  try {
    // Összes aktív szervert lekérdezzük
    const servers = await prisma.server.findMany({
      where: {
        status: 'ONLINE',
      },
      include: {
        subscription: true,
      },
    });

    for (const server of servers) {
      // Ellenőrizzük, hogy van-e már ütemezett backup a mai napra
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingBackup = await prisma.task.findFirst({
        where: {
          serverId: server.id,
          type: 'BACKUP',
          status: {
            in: ['PENDING', 'RUNNING'],
          },
          createdAt: {
            gte: today,
          },
        },
      });

      // Ha nincs backup a mai napra, és a szerver online, akkor létrehozzuk
      if (!existingBackup && server.agentId) {
        await prisma.task.create({
          data: {
            agentId: server.agentId,
            serverId: server.id,
            type: 'BACKUP',
            status: 'PENDING',
            command: {
              action: 'backup',
              type: 'automatic',
              schedule: 'daily',
            },
          },
        });

        console.log(`Automatic backup scheduled for server ${server.id}`);
      }
    }
  } catch (error) {
    console.error('Schedule automatic backups error:', error);
  }
}

/**
 * Régi backupok törlése (30 napnál régebbiek)
 */
export async function cleanupOldBackups(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // TODO: Valós implementációban itt kellene a backup fájlok törlése is
    // Jelenleg csak a task rekordokat töröljük
    const deletedTasks = await prisma.task.deleteMany({
      where: {
        type: 'BACKUP',
        status: 'COMPLETED',
        completedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`Cleaned up ${deletedTasks.count} old backup tasks`);
  } catch (error) {
    console.error('Cleanup old backups error:', error);
  }
}

