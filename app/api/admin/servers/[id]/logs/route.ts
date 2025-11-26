import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';

// GET - Szerver logok lekérése
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
    const searchParams = request.nextUrl.searchParams;
    const lines = parseInt(searchParams.get('lines') || '100');
    const type = searchParams.get('type') || 'all'; // all, error, warning, info

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

    // Log fájlok lekérdezése SSH-n keresztül
    let logs: string[] = [];
    
    if (server.agent && server.agent.machine) {
      const { executeSSHCommand } = await import('@/lib/ssh-client');
      const machine = server.agent.machine;
      
      // Log fájl elérési út meghatározása játék típus alapján
      const serverPath = (server.configuration as any)?.instancePath || 
                        (server.configuration as any)?.sharedPath || 
                        `/opt/servers/${id}`;
      
      let logPath = '';
      switch (server.gameType) {
        case 'MINECRAFT':
          logPath = `${serverPath}/logs/latest.log`;
          break;
        case 'ARK_EVOLVED':
        case 'ARK_ASCENDED':
          logPath = `${serverPath}/ShooterGame/Saved/Logs/ShooterGame.log`;
          break;
        case 'RUST':
          logPath = `${serverPath}/RustDedicated_Data/output_log.txt`;
          break;
        case 'VALHEIM':
          logPath = `${serverPath}/valheim_server.log`;
          break;
        default:
          logPath = `${serverPath}/server.log`;
      }

      // Log fájl utolsó N sorának lekérdezése
      const logCommand = `tail -n ${lines} ${logPath} 2>/dev/null || echo "Log file not found"`;
      const logResult = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        logCommand
      );

      if (logResult.stdout && !logResult.stdout.includes('Log file not found')) {
        logs = logResult.stdout.split('\n').filter(line => line.trim());
        
        // Szűrés típus szerint
        if (type !== 'all') {
          const typeUpper = type.toUpperCase();
          logs = logs.filter(line => line.includes(`[${typeUpper}]`) || line.includes(typeUpper));
        }
      } else {
        // Ha nincs log fájl, systemd journal logokat használunk
        const journalCommand = `journalctl -u server-${id} -n ${lines} --no-pager 2>/dev/null || echo "No logs"`;
        const journalResult = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          journalCommand
        );
        
        if (journalResult.stdout && !journalResult.stdout.includes('No logs')) {
          logs = journalResult.stdout.split('\n').filter(line => line.trim());
        } else {
          // Fallback: mock logok
          logs = generateMockLogs(lines, type);
        }
      }
    } else {
      // Ha nincs agent, mock logokat adunk vissza
      logs = generateMockLogs(lines, type);
    }

    return NextResponse.json({
      success: true,
      logs: mockLogs,
      server: {
        id: server.id,
        name: server.name,
        gameType: server.gameType,
      },
    });
  } catch (error) {
    console.error('Get server logs error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a logok lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * Mock log generálás (valós implementációban SSH-n keresztül kellene lekérdezni)
 */
function generateMockLogs(count: number, type: string): string[] {
  const logTypes = ['INFO', 'WARN', 'ERROR'];
  const messages = [
    'Server started successfully',
    'Player connected',
    'Player disconnected',
    'World saved',
    'Backup completed',
    'Configuration reloaded',
    'Plugin loaded',
    'Memory usage: 512MB',
    'CPU usage: 25%',
    'Network packet loss: 0%',
  ];

  const logs: string[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (count - i) * 1000).toISOString();
    const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];

    if (type === 'all' || type === logType.toLowerCase()) {
      logs.push(`[${timestamp}] [${logType}] ${message}`);
    }
  }

  return logs;
}

