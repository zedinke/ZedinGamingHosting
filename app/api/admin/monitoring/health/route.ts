import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Rendszer egészség statisztikák
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
      totalMachines,
      onlineMachines,
      totalAgents,
      onlineAgents,
      totalServers,
      onlineServers,
      pendingTasks,
      runningTasks,
    ] = await Promise.all([
      prisma.serverMachine.count(),
      prisma.serverMachine.count({ where: { status: 'ONLINE' } }),
      prisma.agent.count(),
      prisma.agent.count({ where: { status: 'ONLINE' } }),
      prisma.server.count(),
      prisma.server.count({ where: { status: 'ONLINE' } }),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'RUNNING' } }),
    ]);

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az egészség ellenőrzése során' },
      { status: 500 }
    );
  }
}

