import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, GameType } from '@prisma/client';
import { handleApiError, createForbiddenError, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

// GET - Játék konfigurációk listája
export const GET = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createForbiddenError('Nincs jogosultság');
      }

      const gameConfigs = await prisma.gameConfig.findMany({
        include: {
          pricingConfig: true,
        },
        orderBy: [
          { order: 'asc' },
          { displayName: 'asc' },
        ],
      });

      return NextResponse.json({
        success: true,
        gameConfigs,
      });
    } catch (error) {
      logger.error('Get game configs error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/admin/games',
  'GET'
);

// POST - Új játék konfiguráció létrehozása
export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createForbiddenError('Nincs jogosultság');
      }

      const body = await request.json();
      const {
        gameType,
        displayName,
        isActive,
        isVisible,
        steamAppId,
        installScript,
        requiresSteamCMD,
        requiresJava,
        requiresWine,
        startCommand,
        startCommandWindows,
        stopCommand,
        configPath,
        defaultPort,
        queryPort,
        defaultCpuCores,
        defaultRamGB,
        defaultDiskGB,
        description,
        image,
        order,
      } = body;

      if (!gameType || !displayName) {
        throw createValidationError('form', 'Játék típus és megjelenített név megadása kötelező');
      }

      // Ellenőrizzük, hogy létezik-e már konfiguráció ehhez a játék típushoz
      const existing = await prisma.gameConfig.findUnique({
        where: { gameType: gameType as GameType },
      });

      if (existing) {
        throw createValidationError('form', 'Ehhez a játék típushoz már létezik konfiguráció');
      }

      const gameConfig = await prisma.gameConfig.create({
        data: {
          gameType: gameType as GameType,
          displayName,
          isActive: isActive !== undefined ? isActive : true,
          isVisible: isVisible !== undefined ? isVisible : true,
          steamAppId: steamAppId ? parseInt(steamAppId) : null,
          installScript: installScript || null,
          requiresSteamCMD: requiresSteamCMD || false,
          requiresJava: requiresJava || false,
          requiresWine: requiresWine || false,
          startCommand: startCommand || null,
          startCommandWindows: startCommandWindows || null,
          stopCommand: stopCommand || null,
          configPath: configPath || null,
          defaultPort: defaultPort ? parseInt(defaultPort) : null,
          queryPort: queryPort ? parseInt(queryPort) : null,
          defaultCpuCores: defaultCpuCores ? parseInt(defaultCpuCores) : 1,
          defaultRamGB: defaultRamGB ? parseInt(defaultRamGB) : 2,
          defaultDiskGB: defaultDiskGB ? parseInt(defaultDiskGB) : 5,
          description: description || null,
          image: image || null,
          order: order ? parseInt(order) : 0,
        },
      });

      logger.info('Game config created', {
        gameConfigId: gameConfig.id,
        gameType: gameConfig.gameType,
        adminId: (session.user as any).id,
      });

      return NextResponse.json({
        success: true,
        gameConfig,
      });
    } catch (error) {
      logger.error('Create game config error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/admin/games',
  'POST'
);

