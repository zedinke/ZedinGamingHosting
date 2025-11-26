import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';

// GET - Szerver indítási logok lekérése (systemd service logok)
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
    const lines = parseInt(searchParams.get('lines') || '200');
    const filter = searchParams.get('filter') || 'all'; // all, error, warning

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

    let logs: string[] = [];
    let serviceStatus = 'unknown';
    let serviceActive = false;

    if (server.agent && server.agent.machine) {
      const machine = server.agent.machine;
      const serviceName = `server-${id}`;

      // Systemd service státusz lekérdezése
      try {
        const statusCommand = `systemctl is-active ${serviceName} 2>&1 || echo "inactive"`;
        const statusResult = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          statusCommand
        );
        serviceStatus = statusResult.stdout?.trim() || 'unknown';
        serviceActive = serviceStatus === 'active';
      } catch (error) {
        console.error('Service status check error:', error);
      }

      // Systemd service logok lekérdezése (journalctl)
      try {
        let journalCommand = `journalctl -u ${serviceName} -n ${lines} --no-pager -o cat 2>/dev/null || echo "No logs"`;
        
        // Ha csak hibákat szeretnénk látni
        if (filter === 'error') {
          journalCommand = `journalctl -u ${serviceName} -n ${lines} --no-pager -p err -o cat 2>/dev/null || echo "No logs"`;
        } else if (filter === 'warning') {
          journalCommand = `journalctl -u ${serviceName} -n ${lines} --no-pager -p warning -o cat 2>/dev/null || echo "No logs"`;
        }

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
          // Ha nincs log, próbáljuk meg a service státusz információkat
          try {
            const statusInfoCommand = `systemctl status ${serviceName} --no-pager -l 2>&1 || echo "Service not found"`;
            const statusInfoResult = await executeSSHCommand(
              {
                host: machine.ipAddress,
                port: machine.sshPort,
                user: machine.sshUser,
                keyPath: machine.sshKeyPath || undefined,
              },
              statusInfoCommand
            );
            
            if (statusInfoResult.stdout && !statusInfoResult.stdout.includes('Service not found')) {
              logs = statusInfoResult.stdout.split('\n').filter(line => line.trim());
            }
          } catch (error) {
            console.error('Service status info error:', error);
          }
        }
      } catch (error) {
        console.error('Journalctl error:', error);
        logs = [`Hiba történt a logok lekérdezése során: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`];
      }

      // Ha üres a log, adjunk vissza egy információs üzenetet
      if (logs.length === 0) {
        logs = [
          `Service: ${serviceName}`,
          `Státusz: ${serviceStatus}`,
          'Nincs elérhető log. A service lehet, hogy még nem indult el, vagy nincs jogosultság a logok olvasásához.',
        ];
      }
    } else {
      logs = ['Szerver nincs hozzárendelve egy agent-hez'];
    }

    return NextResponse.json({
      success: true,
      logs: logs,
      serviceStatus: serviceStatus,
      serviceActive: serviceActive,
      server: {
        id: server.id,
        name: server.name,
        gameType: server.gameType,
      },
    });
  } catch (error) {
    console.error('Get startup logs error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az indítási logok lekérdezése során' },
      { status: 500 }
    );
  }
}

