import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET - Egy szerver adatainak lekérése
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = (session.user as any).id;

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            invoices: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
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

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      server: {
        id: server.id,
        name: server.name,
        gameType: server.gameType,
        status: server.status,
        ipAddress: server.ipAddress,
        port: server.port, // Ez a ténylegesen kiosztott port az adatbázisból
        maxPlayers: server.maxPlayers,
        configuration: server.configuration,
        resourceUsage: server.resourceUsage,
        createdAt: server.createdAt,
        subscription: server.subscription,
      },
    });
  } catch (error) {
    logger.error('Get server error', error as Error, {
      serverId: params.id,
    });
    return NextResponse.json(
      { error: 'Hiba történt a szerver lekérdezése során' },
      { status: 500 }
    );
  }
}

