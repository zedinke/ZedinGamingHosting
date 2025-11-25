import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, GameType } from '@prisma/client';

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
    const gameTypeParam = searchParams.get('gameType') || '';

    if (!port || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: 'Érvénytelen port szám' },
        { status: 400 }
      );
    }

    // Validáljuk és konvertáljuk a gameType-ot enum-ra
    let gameTypeFilter: GameType | undefined = undefined;
    if (gameTypeParam) {
      // Ellenőrizzük, hogy érvényes GameType érték-e
      if (Object.values(GameType).includes(gameTypeParam as GameType)) {
        gameTypeFilter = gameTypeParam as GameType;
      } else {
        console.warn(`Invalid gameType: ${gameTypeParam}`);
      }
    }

    // Ellenőrizzük, hogy a port foglalt-e
    const existingServer = await prisma.server.findFirst({
      where: {
        port,
        status: {
          not: 'OFFLINE',
        },
        ...(gameTypeFilter ? { gameType: gameTypeFilter } : {}),
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

