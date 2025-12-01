import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { generateLicenseKey } from '@/lib/license-generator';
import { handleApiError, AppError, ErrorCodes, createUnauthorizedError, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

/**
 * License Key generálás
 * POST /api/admin/license/generate
 * Body: { orderId?: string, manual?: boolean, customerEmail?: string, planId?: string }
 */
export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createUnauthorizedError('Admin jogosultság szükséges');
      }

      const body = await request.json();
      const { orderId, manual, customerEmail, planId } = body;

      // Ha orderId van, akkor az adott megrendeléshez generálunk
      if (orderId) {
        const order = await prisma.saaSOrder.findUnique({
          where: { id: orderId },
          include: { plan: true },
        });

        if (!order) {
          throw createValidationError('orderId', 'Megrendelés nem található');
        }

        if (order.licenseKey) {
          throw createValidationError('orderId', 'Ez a megrendelés már rendelkezik license key-vel');
        }

        // License key generálás
        const licenseKey = generateLicenseKey();

        // Megrendelés frissítése
        const updatedOrder = await prisma.saaSOrder.update({
          where: { id: orderId },
          data: {
            licenseKey,
            licenseGenerated: true,
            licenseGeneratedAt: new Date(),
          },
        });

        logger.info('License key generated for order', { orderId, licenseKey });

        return NextResponse.json({
          success: true,
          licenseKey,
          order: updatedOrder,
        });
      }

      // Manuális generálás (orderId nélkül)
      if (manual && customerEmail && planId) {
        const plan = await prisma.saaSPlan.findUnique({
          where: { id: planId },
        });

        if (!plan) {
          throw createValidationError('planId', 'Csomag nem található');
        }

        // Új megrendelés létrehozása manuális generáláshoz
        const licenseKey = generateLicenseKey();

        const order = await prisma.saaSOrder.create({
          data: {
            planId,
            customerEmail,
            customerName: customerEmail.split('@')[0], // Alapértelmezett név
            amount: plan.price,
            currency: plan.currency,
            paymentStatus: 'PAID', // Manuális esetén PAID
            licenseKey,
            licenseGenerated: true,
            licenseGeneratedAt: new Date(),
            isActive: true,
            startDate: new Date(),
            endDate: plan.interval === 'month' 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : plan.interval === 'year'
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              : new Date(),
          },
          include: { plan: true },
        });

        logger.info('Manual license key generated', { orderId: order.id, licenseKey });

        return NextResponse.json({
          success: true,
          licenseKey,
          order,
        });
      }

      throw createValidationError('form', 'orderId vagy (manual, customerEmail, planId) megadása kötelező');
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/admin/license/generate',
  'POST'
);

