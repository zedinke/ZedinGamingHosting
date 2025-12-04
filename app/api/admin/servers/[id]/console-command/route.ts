import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';

// POST - Parancs küldése a game konzolra
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
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== 'string' || !command.trim()) {
      return NextResponse.json(
        { error: 'Érvénytelen parancs' },
        { status: 400 }
      );
    }

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    
    // Parancs küldése a game-nek (játék típus alapján)
    let sendCommand = '';
    const config = server.configuration as any || {};
    
    switch (server.gameType) {
      case 'ARK_EVOLVED':
      case 'ARK_ASCENDED':
        // Ark RCON parancs
        sendCommand = `echo "${command.replace(/"/g, '\\"')}" | nc -w 1 localhost ${config.queryPort || 27015} 2>/dev/null || echo "Parancs elküldve"`;
        break;
      case 'MINECRAFT':
        // Minecraft RCON parancs (ha van rcon)
        const rconPassword = config.rconPassword;
        if (rconPassword) {
          sendCommand = `echo "${command.replace(/"/g, '\\"')}" | mcrcon -H localhost -P ${config.rconPort || 25575} -p "${rconPassword}" 2>/dev/null || echo "Parancs elküldve"`;
        } else {
          sendCommand = `echo "${command.replace(/"/g, '\\"')}" > /tmp/minecraft_cmd.txt`;
        }
        break;
      default:
        // Általános konzol parancs
        sendCommand = `echo "${command.replace(/"/g, '\\"')}" >> ${serverPath}/console_input.log`;
    }
    
    const sshResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      sendCommand
    );

    return NextResponse.json({
      success: true,
      message: 'Parancs elküldve',
    });
  } catch (error) {
    console.error('Console command error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a parancs küldése során' },
      { status: 500 }
    );
  }
}
