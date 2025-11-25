import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { MonitoringDashboard } from '@/components/admin/MonitoringDashboard';

export default async function AdminMonitoringPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/login`);
  }

  // Statisztikák lekérése
  const [
    totalMachines,
    onlineMachines,
    totalAgents,
    onlineAgents,
    totalServers,
    onlineServers,
    pendingTasks,
    runningTasks,
    recentTasks,
  ] = await Promise.all([
    prisma.serverMachine.count(),
    prisma.serverMachine.count({ where: { status: 'ONLINE' } }),
    prisma.agent.count(),
    prisma.agent.count({ where: { status: 'ONLINE' } }),
    prisma.server.count(),
    prisma.server.count({ where: { status: 'ONLINE' } }),
    prisma.task.count({ where: { status: 'PENDING' } }),
    prisma.task.count({ where: { status: 'RUNNING' } }),
    prisma.task.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          include: {
            machine: {
              select: {
                id: true,
                name: true,
                ipAddress: true,
              },
            },
          },
        },
        server: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const machines = await prisma.serverMachine.findMany({
    include: {
      agents: {
        select: {
          id: true,
          agentId: true,
          status: true,
          lastHeartbeat: true,
        },
      },
      _count: {
        select: {
          servers: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const stats = {
    machines: {
      total: totalMachines,
      online: onlineMachines,
      offline: totalMachines - onlineMachines,
    },
    agents: {
      total: totalAgents,
      online: onlineAgents,
      offline: totalAgents - onlineAgents,
    },
    servers: {
      total: totalServers,
      online: onlineServers,
      offline: totalServers - onlineServers,
    },
    tasks: {
      pending: pendingTasks,
      running: runningTasks,
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Valós idejű áttekintés a szerver gépekről, agentekről és szerverekről
        </p>
      </div>

      <MonitoringDashboard
        stats={stats}
        machines={machines as any}
        recentTasks={recentTasks as any}
        locale={locale}
      />
    </div>
  );
}

