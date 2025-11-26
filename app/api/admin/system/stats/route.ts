import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Force dynamic rendering (mert session és headers használata miatt dinamikus)
export const dynamic = 'force-dynamic';

// GET - Részletes rendszer statisztikák
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalServers,
      onlineServers,
      totalMachines,
      onlineMachines,
      totalAgents,
      onlineAgents,
      pendingTasks,
      runningTasks,
      failedTasks,
      totalRevenue,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.server.count(),
      prisma.server.count({ where: { status: 'ONLINE' } }),
      prisma.serverMachine.count(),
      prisma.serverMachine.count({ where: { status: 'ONLINE' } }),
      prisma.agent.count(),
      prisma.agent.count({ where: { status: 'ONLINE' } }),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'RUNNING' } }),
      prisma.task.count({ where: { status: 'FAILED' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Játék típus szerinti statisztikák
    const serversByGame = await prisma.server.groupBy({
      by: ['gameType'],
      _count: {
        id: true,
      },
    });

    // Státusz szerinti statisztikák
    const serversByStatus = await prisma.server.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
      },
      servers: {
        total: totalServers,
        online: onlineServers,
        offline: totalServers - onlineServers,
        byGame: serversByGame,
        byStatus: serversByStatus,
      },
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
      tasks: {
        pending: pendingTasks,
        running: runningTasks,
        failed: failedTasks,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a statisztikák lekérdezése során' },
      { status: 500 }
    );
  }
}

