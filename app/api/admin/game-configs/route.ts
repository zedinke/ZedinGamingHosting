import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, createUnauthorizedError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createUnauthorizedError('Admin jogosultság szükséges');
    }

    // Csak azokat a játékokat adjuk vissza, amiknek van aktív GamePackage-je
    const configs = await prisma.gameConfig.findMany({
      where: {
        isActive: true,
        isVisible: true,
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    // Ellenőrizzük, hogy van-e aktív GamePackage minden játékhoz
    const configsWithActivePackages = await Promise.all(
      configs.map(async (config) => {
        const activePackage = await prisma.gamePackage.findFirst({
          where: {
            gameType: config.gameType,
            isActive: true,
          },
        });
        return activePackage ? config : null;
      })
    );

    // Csak azokat a játékokat adjuk vissza, amiknek van aktív csomagja
    const filteredConfigs = configsWithActivePackages.filter((config): config is typeof configs[0] => config !== null);

    return NextResponse.json({ configs: filteredConfigs });
  } catch (error: any) {
    return handleApiError(error);
  }
}

