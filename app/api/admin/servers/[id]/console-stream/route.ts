import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';

// GET - Élő game console logok lekérése
export async function GET(
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

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    
    // Game console fájl útvonala (játék típus alapján)
    const consolePaths: Record<string, string> = {
      'ARK_EVOLVED': `${serverPath}/ShooterGame/Saved/Logs/ShooterGame.log`,
      'ARK_ASCENDED': `${serverPath}/ShooterGame/Saved/Logs/ShooterGame.log`,
      'MINECRAFT': `${serverPath}/logs/latest.log`,
      'RUST': `${serverPath}/RustDedicated.log`,
      'VALHEIM': `${serverPath}/valheim_server.log`,
      'SEVEN_DAYS_TO_DIE': `${serverPath}/7DaysToDieServer_Data/output_log.txt`,
      'SATISFACTORY': `${serverPath}/FactoryGame/Saved/Logs/FactoryGame.log`,
    };
    
    const consolePath = consolePaths[server.gameType] || `${serverPath}/logs/console.log`;
    
    // Utolsó N sor lekérdezése
    const logCommand = `tail -n ${lines} "${consolePath}" 2>/dev/null | grep -v "^$" || echo "Console fájl nem található"`;
    
    const sshResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      logCommand
    );

    const logs = sshResult.stdout
      .trim()
      .split('\n')
      .filter((line: string) => line.trim());

    return NextResponse.json({
      success: true,
      logs: logs || [],
      streaming: true,
    });
  } catch (error) {
    console.error('Console stream error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a konzol betöltése során' },
      { status: 500 }
    );
  }
}
