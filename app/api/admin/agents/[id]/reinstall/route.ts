import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { installAgentViaSSH } from '@/lib/agent-installer';

// POST - Agent újratelepítése
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Agent és machine adatok lekérése
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            sshPort: true,
            sshUser: true,
            sshKeyPath: true,
            sshPassword: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent nem található' },
        { status: 404 }
      );
    }

    if (!agent.machine) {
      return NextResponse.json(
        { error: 'Agent nincs hozzárendelve egy géphez' },
        { status: 400 }
      );
    }

    const machine = agent.machine;
    const managerUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Agent újratelepítése
    const result = await installAgentViaSSH(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
        password: machine.sshPassword || undefined,
      },
      managerUrl
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Agent újratelepítése sikertelen',
          logs: result.logs,
        },
        { status: 500 }
      );
    }

    // Agent státusz frissítése
    await prisma.agent.update({
      where: { id },
      data: {
        status: 'ONLINE',
        lastHeartbeat: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Agent sikeresen újratelepítve',
      agentId: result.agentId,
      logs: result.logs,
    });
  } catch (error) {
    console.error('Agent reinstall error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az agent újratelepítése során' },
      { status: 500 }
    );
  }
}

