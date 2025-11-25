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
  const arkConfig: any = {
    difficultyOffset: 0.2,
    harvestAmountMultiplier: 1.0,
    tamingSpeedMultiplier: 1.0,
    xpMultiplier: 1.0,
    pvp: false,
  };

  const configs: Record<string, any> = {
    MINECRAFT: {
      difficulty: 'normal',
      gamemode: 'survival',
      viewDistance: 10,
      onlineMode: true,
      pvp: true,
      spawnProtection: 16,
      whitelist: false,
    },
    ARK_EVOLVED: arkConfig,
    ARK_ASCENDED: arkConfig,
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
    CONAN_EXILES: {},
    DAYZ: {},
    PROJECT_ZOMBOID: {},
    PALWORLD: {},
    ENSHROUDED: {},
    SONS_OF_THE_FOREST: {},
    THE_FOREST: {},
    GROUNDED: {},
    V_RISING: {},
    DONT_STARVE_TOGETHER: {},
    OTHER: {},
  };

  return configs[gameType] || {};
}

/**
 * Alapértelmezett max játékosok száma
 */
function getDefaultMaxPlayers(gameType: GameType): number {
  const defaults: Record<string, number> = {
    MINECRAFT: 20,
    ARK_EVOLVED: 70,
    ARK_ASCENDED: 70,
    RUST: 100,
    VALHEIM: 10,
    SEVEN_DAYS_TO_DIE: 8,
    CONAN_EXILES: 40,
    DAYZ: 60,
    PROJECT_ZOMBOID: 32,
    PALWORLD: 32,
    ENSHROUDED: 16,
    SONS_OF_THE_FOREST: 8,
    THE_FOREST: 8,
    GROUNDED: 4,
    V_RISING: 40,
    DONT_STARVE_TOGETHER: 6,
    OTHER: 10,
  };

  return defaults[gameType] || 10;
}

