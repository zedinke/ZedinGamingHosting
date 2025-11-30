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

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error('Error in /api/admin/game-configs:', error);
    return handleApiError(error);
  }
}

