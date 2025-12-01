import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, AppError, ErrorCodes, createUnauthorizedError, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

/**
 * SaaS csomag lekérése
 */
export const GET = withPerformanceMonitoring(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const plan = await prisma.saaSPlan.findUnique({
        where: { id: params.id },
      });

      if (!plan) {
        return NextResponse.json(
          { error: 'Csomag nem található' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        plan,
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/admin/saas-plans/[id]',
  'GET'
);

/**
 * SaaS csomag frissítése
 */
export const PATCH = withPerformanceMonitoring(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createUnauthorizedError('Admin jogosultság szükséges');
      }

      const body = await request.json();
      const updateData: any = {};

      if (body.displayName !== undefined) updateData.displayName = body.displayName;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.price !== undefined) updateData.price = parseFloat(body.price);
      if (body.currency !== undefined) updateData.currency = body.currency;
      if (body.interval !== undefined) updateData.interval = body.interval;
      if (body.features !== undefined) updateData.features = body.features ? JSON.parse(JSON.stringify(body.features)) : null;
      if (body.maxUsers !== undefined) updateData.maxUsers = body.maxUsers ? parseInt(body.maxUsers) : null;
      if (body.maxServers !== undefined) updateData.maxServers = body.maxServers ? parseInt(body.maxServers) : null;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.order !== undefined) updateData.order = parseInt(body.order) || 0;

      const plan = await prisma.saaSPlan.update({
        where: { id: params.id },
        data: updateData,
      });

      logger.info('SaaS plan updated', { planId: plan.id });

      return NextResponse.json({
        success: true,
        plan,
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/admin/saas-plans/[id]',
  'PATCH'
);

/**
 * SaaS csomag törlése
 */
export const DELETE = withPerformanceMonitoring(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createUnauthorizedError('Admin jogosultság szükséges');
      }

      // Ellenőrizzük, hogy van-e aktív megrendelés
      const orderCount = await prisma.saaSOrder.count({
        where: { planId: params.id },
      });

      if (orderCount > 0) {
        throw createValidationError('planId', 'Nem törölhető, mert van hozzá tartozó megrendelés');
      }

      await prisma.saaSPlan.delete({
        where: { id: params.id },
      });

      logger.info('SaaS plan deleted', { planId: params.id });

      return NextResponse.json({
        success: true,
        message: 'Csomag sikeresen törölve',
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/admin/saas-plans/[id]',
  'DELETE'
);

