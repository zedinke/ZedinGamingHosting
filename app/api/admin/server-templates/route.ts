import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, GameType } from '@prisma/client';

// GET - Szerver sablonok listája
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Alapértelmezett sablonok játék típusonként
    const templates = Object.values(GameType).map((gameType) => ({
      id: `template-${gameType.toLowerCase()}`,
      name: `${gameType} Alapértelmezett`,
      gameType,
      description: `${gameType} szerver alapértelmezett konfigurációja`,
      configuration: getDefaultTemplateConfig(gameType),
      maxPlayers: getDefaultMaxPlayers(gameType),
    }));

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a sablonok lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * Alapértelmezett sablon konfiguráció
 */
function getDefaultTemplateConfig(gameType: GameType): any {
  const configs: Record<GameType, any> = {
    MINECRAFT: {
      difficulty: 'normal',
      gamemode: 'survival',
      viewDistance: 10,
      onlineMode: true,
      pvp: true,
      spawnProtection: 16,
      whitelist: false,
    },
    ARK: {
      difficultyOffset: 0.2,
      harvestAmountMultiplier: 1.0,
      tamingSpeedMultiplier: 1.0,
      xpMultiplier: 1.0,
      pvp: false,
    },
    CSGO: {
      tickrate: 64,
      svRegion: 255,
      svPassword: '',
      rconPassword: '',
    },
    RUST: {
      seed: 0, // Random
      worldSize: 3000,
      saveInterval: 600,
    },
    VALHEIM: {
      world: 'Dedicated',
      password: '',
      public: 1,
    },
    SEVEN_DAYS_TO_DIE: {
      ServerPort: 26900,
      GameDifficulty: 2,
      GameWorld: 'Navezgane',
    },
    OTHER: {},
  };

  return configs[gameType] || {};
}

/**
 * Alapértelmezett max játékosok száma
 */
function getDefaultMaxPlayers(gameType: GameType): number {
  const defaults: Record<GameType, number> = {
    MINECRAFT: 20,
    ARK: 70,
    CSGO: 10,
    RUST: 100,
    VALHEIM: 10,
    SEVEN_DAYS_TO_DIE: 8,
    OTHER: 10,
  };

  return defaults[gameType] || 10;
}

