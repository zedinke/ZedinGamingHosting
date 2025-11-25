import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Szerver konfiguráció lekérése
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

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        gameType: true,
        configuration: true,
        maxPlayers: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: server.configuration || {},
      defaults: getDefaultConfig(server.gameType, server.maxPlayers),
    });
  } catch (error) {
    console.error('Get server config error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a konfiguráció lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Szerver konfiguráció frissítése
export async function PUT(
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
    const { configuration } = body;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Konfiguráció frissítése
    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        configuration: configuration || server.configuration,
      },
    });

    // TODO: Valós implementációban itt kellene a konfiguráció alkalmazása az agenten keresztül

    return NextResponse.json({
      success: true,
      message: 'Konfiguráció sikeresen frissítve',
      config: updatedServer.configuration,
    });
  } catch (error) {
    console.error('Update server config error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a konfiguráció frissítése során' },
      { status: 500 }
    );
  }
}

/**
 * Alapértelmezett konfiguráció játék típus alapján
 */
function getDefaultConfig(gameType: string, maxPlayers: number): any {
  const defaults: Record<string, any> = {
    MINECRAFT: {
      serverName: 'Minecraft Server',
      difficulty: 'normal',
      gamemode: 'survival',
      maxPlayers: maxPlayers,
      viewDistance: 10,
      onlineMode: true,
      pvp: true,
      spawnProtection: 16,
      whitelist: false,
    },
    ARK_EVOLVED: {
      serverName: 'ARK: Survival Evolved Server',
      maxPlayers: maxPlayers,
      difficultyOffset: 0.2,
      harvestAmountMultiplier: 1.0,
      tamingSpeedMultiplier: 1.0,
      xpMultiplier: 1.0,
      pvp: false,
    },
    ARK_ASCENDED: {
      serverName: 'ARK: Survival Ascended Server',
      maxPlayers: maxPlayers,
      difficultyOffset: 0.2,
      harvestAmountMultiplier: 1.0,
      tamingSpeedMultiplier: 1.0,
      xpMultiplier: 1.0,
      pvp: false,
    },
    CSGO: {
      hostname: 'CS:GO Server',
      maxPlayers: maxPlayers,
      tickrate: 64,
      svRegion: 255, // World
      svPassword: '',
      rconPassword: '',
    },
    RUST: {
      hostname: 'Rust Server',
      maxPlayers: maxPlayers,
      seed: Math.floor(Math.random() * 2147483647),
      worldSize: 3000,
      saveInterval: 600,
    },
    VALHEIM: {
      name: 'Valheim Server',
      world: 'Dedicated',
      password: '',
      public: 1,
    },
    SEVEN_DAYS_TO_DIE: {
      ServerName: '7 Days to Die Server',
      ServerPort: 26900,
      ServerMaxPlayerCount: maxPlayers,
      GameDifficulty: 2,
      GameWorld: 'Navezgane',
    },
  };

  return defaults[gameType] || {};
}

