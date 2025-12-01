import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, AppError, ErrorCodes, createUnauthorizedError, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

/**
 * SaaS csomagok listázása
 */
export const GET = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const activeOnly = searchParams.get('activeOnly') === 'true';

      const where: any = {};
      if (activeOnly) {
        where.isActive = true;
      }

      const plans = await prisma.saaSPlan.findMany({
        where,
        orderBy: { order: 'asc' },
      });

      return NextResponse.json({
        success: true,
        plans,
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/admin/saas-plans',
  'GET'
);

/**
 * Új SaaS csomag létrehozása
 */
export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createUnauthorizedError('Admin jogosultság szükséges');
      }

      const body = await request.json();
      const {
        name,
        displayName,
        description,
        price,
        currency = 'HUF',
        interval = 'month',
        features,
        maxUsers,
        maxServers,
        isActive = true,
        order = 0,
      } = body;

      // Validáció
      if (!name || !displayName || !price) {
        throw createValidationError('form', 'Név, megjelenített név és ár megadása kötelező');
      }

      // Név egyediség ellenőrzés
      const existing = await prisma.saaSPlan.findUnique({
        where: { name },
      });

      if (existing) {
        throw createValidationError('name', 'Ez a csomag név már létezik');
      }

      // Csomag létrehozása
      const plan = await prisma.saaSPlan.create({
        data: {
          name,
          displayName,
          description: description || null,
          price: parseFloat(price),
          currency,
          interval,
          features: features ? JSON.parse(JSON.stringify(features)) : null,
          maxUsers: maxUsers ? parseInt(maxUsers) : null,
          maxServers: maxServers ? parseInt(maxServers) : null,
          isActive,
          order: parseInt(order) || 0,
        },
      });

      logger.info('SaaS plan created', { planId: plan.id, name });

      return NextResponse.json({
        success: true,
        plan,
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/admin/saas-plans',
  'POST'
);

