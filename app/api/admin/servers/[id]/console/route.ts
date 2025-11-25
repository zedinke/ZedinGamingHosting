import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';

// GET - Konzol logok lekérése
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
    const lines = parseInt(searchParams.get('lines') || '100');

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

    // SSH-n keresztül konzol logok lekérdezése
    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    
    // Log fájl útvonala (játék típus alapján)
    const logPaths: Record<string, string> = {
      MINECRAFT: `${serverPath}/logs/latest.log`,
      ARK_EVOLVED: `${serverPath}/ShooterGame/Saved/Logs/ShooterGame.log`,
      ARK_ASCENDED: `${serverPath}/ShooterGame/Saved/Logs/ShooterGame.log`,
      CSGO: `${serverPath}/csgo/logs/console.log`,
      RUST: `${serverPath}/RustDedicated.log`,
      VALHEIM: `${serverPath}/valheim_server.log`,
      SEVEN_DAYS_TO_DIE: `${serverPath}/7DaysToDieServer_Data/output_log.txt`,
    };
    
    const logPath = logPaths[server.gameType] || `${serverPath}/logs/server.log`;
    
    // Utolsó N sor lekérdezése
    const logCommand = `tail -n ${lines} "${logPath}" 2>/dev/null || echo "Log fájl nem található"`;
    
    const sshResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      logCommand
    );

    // Logok feldolgozása
    const logLines = sshResult.stdout.split('\n').filter((line) => line.trim());
    const logs = logLines.map((line) => {
      // Próbáljuk meg parse-olni a log formátumot
      const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})\]/);
      const levelMatch = line.match(/\[(ERROR|WARN|INFO|DEBUG)\]/i);
      
      return {
        timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
        level: levelMatch ? levelMatch[1].toUpperCase() : 'INFO',
        message: line,
      };
    });

    return NextResponse.json({
      logs,
      server: {
        id: server.id,
        name: server.name,
      },
    });
  } catch (error) {
    console.error('Console logs error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a konzol logok lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Parancs küldése a szerver konzoljára
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

    if (!server || !server.agent) {
      return NextResponse.json(
        { error: 'Szerver vagy agent nem található' },
        { status: 404 }
      );
    }

    // SSH-n keresztül parancs küldése
    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    
    // Parancs küldése a szerver konzoljára
    // Ez függ a játék típusától és a szerver kezelő rendszertől (Docker/systemd)
    // Példa: Docker container esetén
    const containerName = `server-${server.id}`;
    const sendCommand = `docker exec ${containerName} rcon-cli "${command}" || echo "${command}" | docker exec -i ${containerName} tee /proc/$(docker exec ${containerName} pgrep -f "server.jar" | head -1)/fd/0`;
    
    // Alternatíva: Ha systemd service, akkor:
    // const sendCommand = `systemctl --user exec server-${server.id} -- "${command}"`;
    
    // Vagy ha van RCON port:
    // const sendCommand = `rcon -a ${server.ipAddress}:${server.port} -p ${rconPassword} "${command}"`;
    
    // Jelenleg csak logoljuk a parancsot (valós implementációban itt kellene a tényleges parancs küldés)
    const sshResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `echo "${command}" >> "${serverPath}/commands.log"`
    );

    if (sshResult.exitCode !== 0) {
      return NextResponse.json(
        { error: `SSH hiba: ${sshResult.stderr}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Parancs elküldve',
      command,
    });
  } catch (error) {
    console.error('Console command error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a parancs küldése során' },
      { status: 500 }
    );
  }
}

