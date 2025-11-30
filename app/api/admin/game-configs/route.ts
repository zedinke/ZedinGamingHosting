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

    // Először lekérjük az összes aktív GamePackage-t, hogy lássuk, milyen gameType-okhoz van aktív csomag
    const activePackages = await prisma.gamePackage.findMany({
      where: {
        isActive: true,
      },
      select: {
        gameType: true,
      },
      distinct: ['gameType'],
    });

    // Kinyerjük a gameType-okat
    const activeGameTypes = activePackages.map((pkg) => pkg.gameType);

    // Ha nincs aktív csomag, üres listát adunk vissza
    if (activeGameTypes.length === 0) {
      return NextResponse.json({ configs: [] });
    }

    // Lekérjük az összes GameConfig-et, amiknek van aktív GamePackage-je
    // Nem szűrünk isActive-re, mert lehet, hogy a GameConfig inaktív, de van aktív GamePackage
    const configs = await prisma.gameConfig.findMany({
      where: {
        gameType: {
          in: activeGameTypes,
        },
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    // Ha nincs GameConfig valamelyik gameType-hoz, akkor a GamePackage-ekből generáljuk
    const configsByGameType = new Map(configs.map((c) => [c.gameType, c]));
    const missingGameTypes = activeGameTypes.filter((gt) => !configsByGameType.has(gt));

    if (missingGameTypes.length > 0) {
      // Lekérjük a GamePackage-eket a hiányzó gameType-okhoz
      const allPackagesForMissing = await prisma.gamePackage.findMany({
        where: {
          gameType: {
            in: missingGameTypes,
          },
          isActive: true,
        },
        select: {
          gameType: true,
          nameEn: true,
          nameHu: true,
          cpuCores: true,
          ram: true,
        },
        orderBy: {
          gameType: 'asc',
        },
      });

      // Csak az első GamePackage-t használjuk minden gameType-hoz (distinct logika)
      const packagesForMissing = Array.from(
        new Map(allPackagesForMissing.map((pkg) => [pkg.gameType, pkg])).values()
      );

      // Hozzáadjuk a hiányzó GameConfig-eket a GamePackage-ekből
      packagesForMissing.forEach((pkg) => {
        const displayName = pkg.nameEn || pkg.nameHu || pkg.gameType;
        configs.push({
          id: `generated-${pkg.gameType}`,
          gameType: pkg.gameType,
          displayName: displayName,
          isActive: true,
          isVisible: true,
          defaultCpuCores: pkg.cpuCores || 2,
          defaultRamGB: pkg.ram || 4,
          defaultDiskGB: 5,
          // Egyéb mezők null/undefined
          steamAppId: null,
          installScript: null,
          requiresSteamCMD: false,
          requiresJava: false,
          requiresWine: false,
          startCommand: null,
          startCommandWindows: null,
          stopCommand: null,
          configPath: null,
          defaultPort: null,
          queryPort: null,
        } as any);
      });

      // Újra rendezzük a displayName szerint
      configs.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error('Error in /api/admin/game-configs:', error);
    return handleApiError(error);
  }
}

