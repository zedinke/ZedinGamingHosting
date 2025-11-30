import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, GameType } from '@prisma/client';
import { handleApiError, createUnauthorizedError, createValidationError } from '@/lib/error-handler';

// GET - Egy premium csomag lekérése
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createUnauthorizedError('Admin jogosultság szükséges');
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const package_ = await prisma.premiumPackage.findUnique({
      where: { id },
      include: {
        games: {
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
    });

    if (!package_) {
      return NextResponse.json(
        { error: 'Premium csomag nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json({ package: package_ });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// PUT - Premium csomag frissítése
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createUnauthorizedError('Admin jogosultság szükséges');
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const body = await request.json();
    const {
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
      gameTypes, // Array of GameType - ha megadva, akkor frissítjük a játékokat
    } = body;

    // Ellenőrizzük, hogy a csomag létezik-e
    const existingPackage = await prisma.premiumPackage.findUnique({
      where: { id },
      include: {
        games: true,
      },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Premium csomag nem található' },
        { status: 404 }
      );
    }

    // Ha gameTypes meg van adva, akkor frissítjük a játékokat
    if (gameTypes && Array.isArray(gameTypes)) {
      // Ellenőrizzük, hogy a játékok léteznek-e
      const gameConfigs = await prisma.gameConfig.findMany({
        where: {
          gameType: {
            in: gameTypes as GameType[],
          },
        },
      });

      if (gameConfigs.length !== gameTypes.length) {
        throw createValidationError('form', 'Egy vagy több játék nem található');
      }

      // Számoljuk ki az erőforrás limiteket
      let maxCpuCores = 0;
      let maxRamGB = 0;

      for (const gameType of gameTypes) {
        const gameConfig = gameConfigs.find((gc) => gc.gameType === gameType);
        if (gameConfig) {
          maxCpuCores = Math.max(maxCpuCores, gameConfig.defaultCpuCores);
          maxRamGB = Math.max(maxRamGB, gameConfig.defaultRamGB);
        }
      }

      // Töröljük a régi játékokat és létrehozzuk az újat
      await prisma.premiumPackageGame.deleteMany({
        where: { premiumPackageId: id },
      });

      await prisma.premiumPackageGame.createMany({
        data: gameTypes.map((gameType: GameType, index: number) => ({
          premiumPackageId: id,
          gameType,
          order: index,
        })),
      });

      // Frissítjük az erőforrás limiteket
      body.cpuCores = maxCpuCores;
      body.ram = maxRamGB;
    }

    // Frissítjük a csomagot
    const updatedPackage = await prisma.premiumPackage.update({
      where: { id },
      data: {
        ...(nameHu !== undefined && { nameHu }),
        ...(nameEn !== undefined && { nameEn }),
        ...(descriptionHu !== undefined && { descriptionHu }),
        ...(descriptionEn !== undefined && { descriptionEn }),
        ...(price !== undefined && { price }),
        ...(currency !== undefined && { currency }),
        ...(interval !== undefined && { interval }),
        ...(discountPrice !== undefined && { discountPrice }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
        ...(image !== undefined && { image }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(body.cpuCores !== undefined && { cpuCores: body.cpuCores }),
        ...(body.ram !== undefined && { ram: body.ram }),
      },
      include: {
        games: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ package: updatedPackage });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// DELETE - Premium csomag törlése
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createUnauthorizedError('Admin jogosultság szükséges');
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    // Ellenőrizzük, hogy van-e aktív szerver ezzel a csomaggal
    const serversCount = await prisma.server.count({
      where: { premiumPackageId: id },
    });

    if (serversCount > 0) {
      return NextResponse.json(
        { error: 'Nem lehet törölni a csomagot, mert van hozzá tartozó szerver' },
        { status: 400 }
      );
    }

    await prisma.premiumPackage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error);
  }
}

