import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';

// GET - Élő game console logok lekérése (felhasználók)
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const lines = parseInt(searchParams.get('lines') || '200');

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

    const gameTypePath: Record<string, string> = {
      ARK_EVOLVED: 'ShooterGame/Saved/Logs/ShooterGame.log',
      ARK_ASCENDED: 'ShooterGame/Saved/Logs/ShooterGame.log',
      MINECRAFT: 'logs/latest.log',
      RUST: 'server/console.log',
      VALHEIM: 'logs/current.log',
      SATISFACTORY: 'FactoryGame/Saved/Logs/FactoryGame.log',
      CONAN_EXILES: 'ConanSandbox/Saved/Logs/ConanSandbox.log',
    };

    const logPath = gameTypePath[server.gameType as string] || 'console.log';
    const serverPath = `/opt/servers/${server.id}`;

    const result = await executeSSHCommand(
      {
        host: server.agent.machine.ipAddress,
        port: server.agent.machine.sshPort,
        user: server.agent.machine.sshUser,
        keyPath: server.agent.machine.sshKeyPath || undefined,
      },
      `tail -n ${lines} "${serverPath}/${logPath}" 2>/dev/null | grep -v '^$' || echo "Konzol naplózás nem elérhető"`
    );

    const logs = result.stdout
      .split('\n')
      .filter((line: string) => line.trim())
      .slice(-lines);

    return NextResponse.json({
      success: true,
      logs,
      streaming: false,
    });
  } catch (error) {
    console.error('Console stream error:', error);
    return NextResponse.json(
      { error: 'Konzol olvasási hiba' },
      { status: 500 }
    );
  }
}
