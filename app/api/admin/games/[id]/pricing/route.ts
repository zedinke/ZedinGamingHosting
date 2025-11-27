import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, createForbiddenError, createNotFoundError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

// GET - Árazási konfiguráció lekérése
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
        pricingConfig: gameConfig.pricingConfig,
        gameType: gameConfig.gameType,
      });
    } catch (error) {
      logger.error('Get pricing config error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/admin/games/[id]/pricing',
  'GET'
);

// PUT - Árazási konfiguráció frissítése vagy létrehozása
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
        include: {
          pricingConfig: true,
        },
      });

      if (!gameConfig) {
        throw createNotFoundError('GameConfig', id);
      }

      const pricingData = {
        gameType: gameConfig.gameType,
        basePrice: body.basePrice ? parseFloat(body.basePrice) : 0,
        currency: body.currency || 'HUF',
        pricePerSlot: body.pricePerSlot ? parseFloat(body.pricePerSlot) : 0,
        pricePerVCpu: body.pricePerVCpu ? parseFloat(body.pricePerVCpu) : 0,
        pricePerRamGB: body.pricePerRamGB ? parseFloat(body.pricePerRamGB) : 0,
        minSlots: body.minSlots ? parseInt(body.minSlots) : 1,
        minVCpu: body.minVCpu ? parseInt(body.minVCpu) : 1,
        minRamGB: body.minRamGB ? parseInt(body.minRamGB) : 1,
        maxSlots: body.maxSlots ? parseInt(body.maxSlots) : 100,
        maxVCpu: body.maxVCpu ? parseInt(body.maxVCpu) : 16,
        maxRamGB: body.maxRamGB ? parseInt(body.maxRamGB) : 64,
        slotStep: body.slotStep ? parseInt(body.slotStep) : 1,
        vCpuStep: body.vCpuStep ? parseInt(body.vCpuStep) : 1,
        ramStep: body.ramStep ? parseInt(body.ramStep) : 1,
        dynamicPricingEnabled: body.dynamicPricingEnabled !== undefined ? body.dynamicPricingEnabled : false,
      };

      let pricingConfig;
      if (gameConfig.pricingConfig) {
        // Frissítés
        pricingConfig = await prisma.gamePricingConfig.update({
          where: { id: gameConfig.pricingConfig.id },
          data: pricingData,
        });
      } else {
        // Létrehozás
        pricingConfig = await prisma.gamePricingConfig.create({
          data: pricingData,
        });
      }

      logger.info('Pricing config updated', {
        gameConfigId: id,
        pricingConfigId: pricingConfig.id,
        adminId: (session.user as any).id,
      });

      return NextResponse.json({
        success: true,
        pricingConfig,
      });
    } catch (error) {
      logger.error('Update pricing config error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/admin/games/[id]/pricing',
  'PUT'
);

