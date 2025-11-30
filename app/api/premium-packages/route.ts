import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/error-handler';

// GET - Aktív premium csomagok listázása (nyilvános)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'hu';

    const packages = await prisma.premiumPackage.findMany({
      where: {
        isActive: true,
      },
      include: {
        games: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Hozzáadjuk a játékok konfigurációit és képeit
    const packagesWithGameDetails = await Promise.all(
      packages.map(async (pkg) => {
        const gameDetails = await Promise.all(
          pkg.games.map(async (game) => {
            const gameConfig = await prisma.gameConfig.findUnique({
              where: { gameType: game.gameType },
            });

            // Keresünk egy GamePackage-et is a játékhoz (a kép miatt)
            const gamePackage = await prisma.gamePackage.findFirst({
              where: {
                gameType: game.gameType,
                isActive: true,
              },
              orderBy: {
                order: 'asc',
              },
            });

            return {
              gameType: game.gameType,
              order: game.order,
              displayName: gameConfig?.displayName || game.gameType,
              image: gamePackage?.image || gameConfig?.image || null,
              videoUrl: gamePackage?.videoUrl || null,
              description: gameConfig?.description || null,
            };
          })
        );

        return {
          ...pkg,
          games: gameDetails,
        };
      })
    );

    return NextResponse.json({ packages: packagesWithGameDetails });
  } catch (error: any) {
    return handleApiError(error);
  }
}

