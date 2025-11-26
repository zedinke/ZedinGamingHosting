import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { installAgentViaSSH } from '@/lib/agent-installer';

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

    // Manager URL meghatározása
    const managerUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Task létrehozása
    const task = await prisma.task.create({
      data: {
        type: 'INSTALL_AGENT',
        status: 'PENDING',
        command: {
          machineId: machine.id,
          ipAddress: machine.ipAddress,
          sshUser: machine.sshUser,
          sshPort: machine.sshPort,
          managerUrl,
        },
      },
    });

    // Agent telepítés háttérben (async)
    // Ne várjuk meg a befejezését, azonnal visszatérünk
    installAgentViaSSH(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      managerUrl
    )
      .then(async (result) => {
        console.log('Agent telepítés eredmény:', result);
        
        if (result.success && result.agentId) {
          try {
            // Agent létrehozása az adatbázisban
            await prisma.agent.create({
              data: {
                machineId: machine.id,
                agentId: result.agentId,
                version: '1.0.0',
                status: 'ONLINE',
                lastHeartbeat: new Date(),
              },
            });

            // Task frissítése
            await prisma.task.update({
              where: { id: task.id },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                result: { agentId: result.agentId, logs: result.logs },
              },
            });

            // Machine státusz frissítése
            await prisma.serverMachine.update({
              where: { id: machine.id },
              data: { status: 'ONLINE' },
            });

            console.log('Agent sikeresen létrehozva:', result.agentId);
          } catch (dbError: any) {
            console.error('Adatbázis hiba agent létrehozásakor:', dbError);
          }
        } else {
          // Task hibával frissítése
          console.error('Agent telepítés sikertelen:', result.error);
          await prisma.task.update({
            where: { id: task.id },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
              error: result.error || 'Ismeretlen hiba',
              result: { logs: result.logs },
            },
          });
        }
      })
      .catch(async (error) => {
        console.error('Agent telepítés kivétel:', error);
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            error: error.message || 'Ismeretlen hiba',
          },
        });
      });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      message: 'Agent telepítési feladat elindítva',
    });
  } catch (error: any) {
    console.error('Agent install error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az agent telepítése során' },
      { status: 500 }
    );
  }
}

