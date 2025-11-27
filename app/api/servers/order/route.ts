import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GameType } from '@prisma/client';
import { handleApiError, AppError, ErrorCodes, createUnauthorizedError, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session) {
        throw createUnauthorizedError('Bejelentkezés szükséges');
      }

      const body = await request.json();
      const { name, gameType, planId, maxPlayers, gamePackageId } = body;

      // Validáció
      if (!name || !gameType) {
        throw createValidationError('form', 'Név és játék típus megadása kötelező');
      }

      // Game package vagy pricing plan ellenőrzése
      let gamePackage = null;
      let plan = null;
      let finalMaxPlayers = maxPlayers;
      let finalPrice = 0;
      let finalCurrency = 'HUF';

      if (gamePackageId) {
        // Game package használata
        gamePackage = await prisma.gamePackage.findUnique({
          where: { id: gamePackageId },
        });

        if (!gamePackage || !gamePackage.isActive) {
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR,
            'Érvénytelen vagy inaktív játék csomag',
            400
          );
        }

        finalMaxPlayers = gamePackage.slot;
        finalPrice = gamePackage.discountPrice || gamePackage.price;
        finalCurrency = gamePackage.currency;
      } else if (planId) {
        // Pricing plan használata (régi módszer)
        plan = await prisma.pricingPlan.findUnique({
          where: { id: planId },
        });

        if (!plan || !plan.isActive) {
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR,
            'Érvénytelen vagy inaktív csomag',
            400
          );
        }

        if (!maxPlayers) {
          throw createValidationError('form', 'Max játékosok száma megadása kötelező');
        }

        finalMaxPlayers = parseInt(maxPlayers);
        finalPrice = plan.price;
        finalCurrency = plan.currency;
      } else {
        throw createValidationError('form', 'Csomag vagy játék csomag megadása kötelező');
      }

      logger.info('Server order request', {
        userId: (session.user as any).id,
        gameType,
        planId,
        gamePackageId,
        maxPlayers: finalMaxPlayers,
      });

    // Port generálása
    const { generateServerPort } = await import('@/lib/server-provisioning');
    const port = await generateServerPort(gameType as GameType);

    // Szerver létrehozása
    const server = await prisma.server.create({
      data: {
        userId: (session.user as any).id,
        name,
        gameType: gameType as GameType,
        maxPlayers: finalMaxPlayers,
        status: 'OFFLINE',
        port,
        // Game package specifikációk mentése a konfigurációba
        configuration: gamePackage ? {
          slot: gamePackage.slot,
          cpuCores: gamePackage.cpuCores,
          ram: gamePackage.ram,
          gamePackageId: gamePackage.id,
        } : undefined,
      },
    });

    // Szerver provisioning háttérben
    const { provisionServer } = await import('@/lib/server-provisioning');
    provisionServer(server.id, {
      gameType: gameType as GameType,
      maxPlayers: finalMaxPlayers,
      planId: planId || undefined,
      }).catch((error) => {
        logger.error('Server provisioning error', error as Error, {
          serverId: server.id,
        });
        // Szerver státusz frissítése hibára
        prisma.server.update({
          where: { id: server.id },
          data: { status: 'ERROR' },
        }).catch((updateError) => {
          logger.error('Failed to update server status', updateError as Error);
        });
      });

    // Előfizetés létrehozása (fizetési integrációval)
    // A fizetés a checkout API-n keresztül történik
    const subscription = await prisma.subscription.create({
      data: {
        userId: (session.user as any).id,
        serverId: server.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 nap
      },
    });

    // Számla létrehozása
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const invoice = await prisma.invoice.create({
      data: {
        userId: (session.user as any).id,
        subscriptionId: subscription.id,
        amount: finalPrice,
        currency: finalCurrency,
        status: 'PENDING',
        invoiceNumber,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 nap
      },
    });

    return NextResponse.json({
      success: true,
      serverId: server.id,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
        message: 'Szerver sikeresen létrehozva',
      });
    } catch (error) {
      logger.error('Server order error', error as Error);
      return handleApiError(error);
    }
  },
  '/api/servers/order',
  'POST'
);

