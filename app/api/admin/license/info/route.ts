import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, AppError, ErrorCodes, createUnauthorizedError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';

/**
 * License információk lekérése
 * GET /api/admin/license/info
 * 
 * Jelenleg a legutóbbi aktív SaaS megrendelést használja
 * TODO: Ha lesz SystemLicense modell, akkor azt használjuk
 */
export const GET = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createUnauthorizedError('Admin jogosultság szükséges');
      }

      // Legutóbbi aktív SaaS megrendelés lekérése
      const order = await prisma.saaSOrder.findFirst({
        where: {
          isActive: true,
          paymentStatus: 'PAID',
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!order) {
        return NextResponse.json({
          success: true,
          license: null,
          message: 'Nincs aktív license',
        });
      }

      // Napok száma hátra
      let daysRemaining: number | null = null;
      if (order.endDate) {
        const now = new Date();
        const end = new Date(order.endDate);
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = diff;
      }

      return NextResponse.json({
        success: true,
        license: {
          isActive: order.isActive,
          licenseKey: order.licenseKey,
          startDate: order.startDate,
          endDate: order.endDate,
          planName: order.plan.displayName,
          daysRemaining,
        },
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/admin/license/info',
  'GET'
);

