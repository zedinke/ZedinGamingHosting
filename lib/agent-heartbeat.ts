import { prisma } from '@/lib/prisma';

/**
 * Agent heartbeat kezelése - frissíti az agent és gép státuszát
 */
export async function handleAgentHeartbeat(
  agentId: string,
  data: {
    status?: string;
    resources?: any;
    capabilities?: any;
  }
): Promise<void> {
  try {
    const agent = await prisma.agent.findUnique({
      where: { agentId },
      include: {
        machine: true,
      },
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Agent frissítése
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: data.status || 'ONLINE',
        lastHeartbeat: new Date(),
        capabilities: data.capabilities || agent.capabilities,
      },
    });

    // Machine frissítése
    if (data.resources) {
      await prisma.serverMachine.update({
        where: { id: agent.machineId },
        data: {
          status: 'ONLINE',
          lastHeartbeat: new Date(),
          resources: data.resources,
          agentVersion: '1.0.0', // TODO: Valós verzió az agenttől
        },
      });
    }

    // Szerverek erőforrás használatának frissítése
    const servers = await prisma.server.findMany({
      where: {
        agentId: agent.id,
        status: {
          in: ['ONLINE', 'STARTING', 'RESTARTING'],
        },
      },
    });

    // TODO: Valós implementációban itt kellene lekérdezni az egyes szerverek erőforrás használatát
    // Jelenleg csak frissítjük a timestamp-et
    for (const server of servers) {
      await prisma.server.update({
        where: { id: server.id },
        data: {
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Agent heartbeat error:', error);
    throw error;
  }
}

/**
 * Offline agentek ellenőrzése - ha nincs heartbeat 5 percnél régebben, OFFLINE-re állítjuk
 */
export async function checkOfflineAgents(): Promise<void> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const offlineAgents = await prisma.agent.findMany({
      where: {
        status: 'ONLINE',
        lastHeartbeat: {
          lt: fiveMinutesAgo,
        },
      },
      include: {
        machine: true,
      },
    });

    for (const agent of offlineAgents) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { status: 'OFFLINE' },
      });

      // Ha a gépnek nincs más online agentje, akkor a gépet is offline-ra állítjuk
      const otherOnlineAgents = await prisma.agent.findFirst({
        where: {
          machineId: agent.machineId,
          id: { not: agent.id },
          status: 'ONLINE',
          lastHeartbeat: {
            gte: fiveMinutesAgo,
          },
        },
      });

      if (!otherOnlineAgents) {
        await prisma.serverMachine.update({
          where: { id: agent.machineId },
          data: { status: 'OFFLINE' },
        });
      }
    }
  } catch (error) {
    console.error('Check offline agents error:', error);
  }
}

