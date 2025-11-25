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
      const { name, gameType, planId, maxPlayers } = body;

      // Validáció
      if (!name || !gameType || !planId || !maxPlayers) {
        throw createValidationError('form', 'Minden mező kitöltése kötelező');
      }

      logger.info('Server order request', {
        userId: (session.user as any).id,
        gameType,
        planId,
        maxPlayers,
      });

    // Csomag ellenőrzése
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId },
    });

      if (!plan || !plan.isActive) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Érvénytelen vagy inaktív csomag',
          400
        );
      }

    // Port generálása
    const { generateServerPort } = await import('@/lib/server-provisioning');
    const port = await generateServerPort(gameType as GameType);

    // Szerver létrehozása
    const server = await prisma.server.create({
      data: {
        userId: (session.user as any).id,
        name,
        gameType: gameType as GameType,
        maxPlayers: parseInt(maxPlayers),
        status: 'OFFLINE',
        port,
      },
    });

    // Szerver provisioning háttérben
    const { provisionServer } = await import('@/lib/server-provisioning');
    provisionServer(server.id, {
      gameType: gameType as GameType,
      maxPlayers: parseInt(maxPlayers),
      planId,
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
        amount: plan.price,
        currency: plan.currency,
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

