import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, GameType } from '@prisma/client';
import { handleApiError, createUnauthorizedError, createValidationError } from '@/lib/error-handler';

// GET - Premium csomagok listázása
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createUnauthorizedError('Admin jogosultság szükséges');
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const packages = await prisma.premiumPackage.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        games: {
          include: {
            premiumPackage: false,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            servers: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ packages });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// POST - Új premium csomag létrehozása
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createUnauthorizedError('Admin jogosultság szükséges');
    }

    const body = await request.json();
    const {
      nameHu,
      nameEn,
      descriptionHu,
      descriptionEn,
      price,
      currency = 'HUF',
      interval = 'month',
      discountPrice,
      isActive = true,
      order = 0,
      image,
      videoUrl,
      gameTypes, // Array of GameType
    } = body;

    // Validáció
    if (!nameHu || !nameEn) {
      throw createValidationError('form', 'A csomag neve kötelező (HU és EN)');
    }

    if (!price || price <= 0) {
      throw createValidationError('form', 'Az ár megadása kötelező és pozitív számnak kell lennie');
    }

    if (!gameTypes || !Array.isArray(gameTypes) || gameTypes.length === 0) {
      throw createValidationError('form', 'Legalább egy játékot ki kell választani');
    }

    // Ellenőrizzük, hogy a játékok léteznek-e
    const gameConfigs = await prisma.gameConfig.findMany({
      where: {
        gameType: {
          in: gameTypes as GameType[],
        },
      },
    });

    // Ha nincs GameConfig valamelyik játékhoz, akkor a GamePackage-ekből kinyerjük az adatokat
    const foundGameTypes = new Set(gameConfigs.map((gc) => gc.gameType));
    const missingGameTypes = gameTypes.filter((gt) => !foundGameTypes.has(gt));

    if (missingGameTypes.length > 0) {
      // Lekérjük a GamePackage-eket a hiányzó játékokhoz
      const allGamePackages = await prisma.gamePackage.findMany({
        where: {
          gameType: {
            in: missingGameTypes,
          },
          isActive: true,
        },
        select: {
          gameType: true,
          cpuCores: true,
          ram: true,
        },
      });

      // Csak az első GamePackage-t használjuk minden gameType-hoz (distinct logika)
      const gamePackages = Array.from(
        new Map(allGamePackages.map((pkg) => [pkg.gameType, pkg])).values()
      );

      // Hozzáadjuk a hiányzó GameConfig-eket a GamePackage-ekből
      gamePackages.forEach((pkg) => {
        gameConfigs.push({
          gameType: pkg.gameType,
          defaultCpuCores: pkg.cpuCores || 2,
          defaultRamGB: pkg.ram || 4,
        } as any);
      });

      // Ha még mindig hiányoznak játékok, akkor hiba
      const allFoundGameTypes = new Set(gameConfigs.map((gc) => gc.gameType));
      const stillMissing = gameTypes.filter((gt) => !allFoundGameTypes.has(gt));
      if (stillMissing.length > 0) {
        throw createValidationError('form', `Egy vagy több játék nem található: ${stillMissing.join(', ')}`);
      }
    }

    // Számoljuk ki az erőforrás limiteket (legnagyobb gépigényű játék alapján)
    let maxCpuCores = 0;
    let maxRamGB = 0;

    for (const gameType of gameTypes) {
      const gameConfig = gameConfigs.find((gc) => gc.gameType === gameType);
      if (gameConfig) {
        maxCpuCores = Math.max(maxCpuCores, gameConfig.defaultCpuCores);
        maxRamGB = Math.max(maxRamGB, gameConfig.defaultRamGB);
      }
    }

    // Ha nincs megadva, akkor minimum értékeket használunk
    if (maxCpuCores === 0) maxCpuCores = 2;
    if (maxRamGB === 0) maxRamGB = 4;

    // Létrehozzuk a premium csomagot
    const premiumPackage = await prisma.premiumPackage.create({
      data: {
        nameHu,
        nameEn,
        descriptionHu,
        descriptionEn,
        price,
        currency,
        interval,
        discountPrice,
        isActive,
        order,
        image,
        videoUrl,
        cpuCores: maxCpuCores,
        ram: maxRamGB,
        games: {
          create: gameTypes.map((gameType: GameType, index: number) => ({
            gameType,
            order: index,
          })),
        },
      },
      include: {
        games: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ package: premiumPackage }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

