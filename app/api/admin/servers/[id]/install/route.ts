import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { installGameServer } from '@/lib/game-server-installer';

// POST - Game szerver telepítése
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
    const { ram, world, password } = body;

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

    // Game szerver telepítése
    const result = await installGameServer(id, server.gameType, {
      maxPlayers: server.maxPlayers,
      ram: ram || 2048,
      port: server.port || 25565,
      name: server.name,
      world,
      password,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a telepítés során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Game szerver sikeresen telepítve',
    });
  } catch (error: any) {
    console.error('Install game server error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a telepítés során' },
      { status: 500 }
    );
  }
}

