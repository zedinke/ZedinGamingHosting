import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// POST - Agent telepítése egy szerver gépre
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

    const machine = await prisma.serverMachine.findUnique({
      where: { id },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    // TODO: Itt kellene SSH-n keresztül telepíteni az agentet
    // Jelenleg csak egy task-ot hozunk létre
    const task = await prisma.task.create({
      data: {
        type: 'INSTALL_AGENT',
        status: 'PENDING',
        command: {
          machineId: machine.id,
          ipAddress: machine.ipAddress,
          sshUser: machine.sshUser,
          sshPort: machine.sshPort,
        },
      },
    });

    // TODO: Valós implementációban itt kellene SSH-n keresztül telepíteni az agentet
    // await installAgentViaSSH(machine);

    return NextResponse.json({
      success: true,
      taskId: task.id,
      message: 'Agent telepítési feladat létrehozva',
    });
  } catch (error) {
    console.error('Agent install error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az agent telepítése során' },
      { status: 500 }
    );
  }
}

