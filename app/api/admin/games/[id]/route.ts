import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, createForbiddenError, createNotFoundError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

// GET - Játék konfiguráció lekérése
export const GET = withPerformanceMonitoring(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createForbiddenError('Nincs jogosultság');
      }

      const resolvedParams = params instanceof Promise ? await params : params;
      const { id } = resolvedParams;

      const gameConfig = await prisma.gameConfig.findUnique({
        where: { id },
        include: {
          pricingConfig: true,
        },
      });

      if (!gameConfig) {
        throw createNotFoundError('GameConfig', id);
      }

      return NextResponse.json({
        success: true,
        gameConfig,
      });
    } catch (error) {
      logger.error('Get game config error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/admin/games/[id]',
  'GET'
);

// PUT - Játék konfiguráció frissítése
export const PUT = withPerformanceMonitoring(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createForbiddenError('Nincs jogosultság');
      }

      const resolvedParams = params instanceof Promise ? await params : params;
      const { id } = resolvedParams;
      const body = await request.json();

      const gameConfig = await prisma.gameConfig.findUnique({
        where: { id },
      });

      if (!gameConfig) {
        throw createNotFoundError('GameConfig', id);
      }

      // Csak a megadott mezőket frissítjük
      const updateData: any = {};
      
      if (body.displayName !== undefined) updateData.displayName = body.displayName;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.isVisible !== undefined) updateData.isVisible = body.isVisible;
      if (body.steamAppId !== undefined) updateData.steamAppId = body.steamAppId ? parseInt(body.steamAppId) : null;
      if (body.installScript !== undefined) updateData.installScript = body.installScript;
      if (body.requiresSteamCMD !== undefined) updateData.requiresSteamCMD = body.requiresSteamCMD;
      if (body.requiresJava !== undefined) updateData.requiresJava = body.requiresJava;
      if (body.requiresWine !== undefined) updateData.requiresWine = body.requiresWine;
      if (body.startCommand !== undefined) updateData.startCommand = body.startCommand;
      if (body.startCommandWindows !== undefined) updateData.startCommandWindows = body.startCommandWindows;
      if (body.stopCommand !== undefined) updateData.stopCommand = body.stopCommand;
      if (body.configPath !== undefined) updateData.configPath = body.configPath;
      if (body.defaultPort !== undefined) updateData.defaultPort = body.defaultPort ? parseInt(body.defaultPort) : null;
      if (body.queryPort !== undefined) updateData.queryPort = body.queryPort ? parseInt(body.queryPort) : null;
      if (body.defaultCpuCores !== undefined) updateData.defaultCpuCores = parseInt(body.defaultCpuCores);
      if (body.defaultRamGB !== undefined) updateData.defaultRamGB = parseInt(body.defaultRamGB);
      if (body.defaultDiskGB !== undefined) updateData.defaultDiskGB = parseInt(body.defaultDiskGB);
      if (body.description !== undefined) updateData.description = body.description;
      if (body.image !== undefined) updateData.image = body.image;
      if (body.order !== undefined) updateData.order = parseInt(body.order);

      const updatedConfig = await prisma.gameConfig.update({
        where: { id },
        data: updateData,
        include: {
          pricingConfig: true,
        },
      });

      logger.info('Game config updated', {
        gameConfigId: id,
        adminId: (session.user as any).id,
      });

      return NextResponse.json({
        success: true,
        gameConfig: updatedConfig,
      });
    } catch (error) {
      logger.error('Update game config error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/admin/games/[id]',
  'PUT'
);

// DELETE - Játék konfiguráció törlése
export const DELETE = withPerformanceMonitoring(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createForbiddenError('Nincs jogosultság');
      }

      const resolvedParams = params instanceof Promise ? await params : params;
      const { id } = resolvedParams;

      const gameConfig = await prisma.gameConfig.findUnique({
        where: { id },
      });

      if (!gameConfig) {
        throw createNotFoundError('GameConfig', id);
      }

      await prisma.gameConfig.delete({
        where: { id },
      });

      logger.info('Game config deleted', {
        gameConfigId: id,
        adminId: (session.user as any).id,
      });

      return NextResponse.json({
        success: true,
        message: 'Játék konfiguráció törölve',
      });
    } catch (error) {
      logger.error('Delete game config error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/admin/games/[id]',
  'DELETE'
);

