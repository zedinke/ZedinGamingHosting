import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';

// POST - Parancs küldése a game konzolnak (felhasználók)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs autentikáció' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Parancs szükséges' },
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

    // Szerzői jog ellenőrzés - csak a szerver tulajdonosa
    if (server.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    const serverPath = `/opt/servers/${server.id}`;
    const config = (server.configuration as any) || {};
    const queryPort = config.queryPort || (config.port ? config.port + 1 : 27015);

    let sshCommand = '';

    // Játék típusa szerinti parancs végrehajtás
    switch (server.gameType) {
      case 'ARK_EVOLVED':
      case 'ARK_ASCENDED':
        // RCON-nal ARK konzolnak
        sshCommand = `echo "${command}" | nc -w 1 localhost ${queryPort} 2>/dev/null || echo "RCON hiba"`;
        break;
      case 'MINECRAFT':
        // RCON-nal Minecraft-nak
        const rconPort = config.rconPort || 25575;
        const rconPassword = config.rconPassword || '';
        sshCommand = `echo "${command}" | mcrcon -c -p ${rconPassword} -P ${rconPort} 2>/dev/null || echo "RCON hiba"`;
        break;
      default:
        // Általános syslog-ba írás
        sshCommand = `logger "Game Command: ${command}"`;
    }

    const result = await executeSSHCommand(
      {
        host: server.agent.machine.ipAddress,
        port: server.agent.machine.sshPort,
        user: server.agent.machine.sshUser,
        keyPath: server.agent.machine.sshKeyPath || undefined,
      },
      sshCommand
    );

    return NextResponse.json({
      success: true,
      message: 'Parancs elküldve',
      output: result.stdout,
    });
  } catch (error) {
    console.error('Console command error:', error);
    return NextResponse.json(
      { error: 'Parancs küldési hiba' },
      { status: 500 }
    );
  }
}
