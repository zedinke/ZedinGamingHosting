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

    // TODO: Valós implementációban itt kellene SSH-n keresztül lekérdezni a log fájlokat
    // Jelenleg mock adatokat adunk vissza
    const mockLogs = generateMockLogs(lines, type);

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

