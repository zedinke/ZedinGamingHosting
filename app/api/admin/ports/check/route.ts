import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Port elérhetőség ellenőrzése
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const port = parseInt(searchParams.get('port') || '0');
    const gameType = searchParams.get('gameType') || '';

    if (!port || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: 'Érvénytelen port szám' },
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy a port foglalt-e
    const existingServer = await prisma.server.findFirst({
      where: {
        port,
        status: {
          not: 'OFFLINE',
        },
        ...(gameType ? { gameType } : {}),
      },
    });

    return NextResponse.json({
      available: !existingServer,
      port,
      inUse: existingServer
        ? {
            serverId: existingServer.id,
            serverName: existingServer.name,
            status: existingServer.status,
          }
        : null,
    });
  } catch (error) {
    console.error('Check port error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a port ellenőrzése során' },
      { status: 500 }
    );
  }
}

