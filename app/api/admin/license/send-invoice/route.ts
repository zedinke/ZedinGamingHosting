import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { sendInvoiceEmail } from '@/lib/email-invoice';
import { handleApiError, AppError, ErrorCodes, createUnauthorizedError, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

/**
 * Számla küldése email-ben
 * POST /api/admin/license/send-invoice
 * Body: { orderId: string }
 */
export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || (session.user as any).role !== UserRole.ADMIN) {
        throw createUnauthorizedError('Admin jogosultság szükséges');
      }

      const body = await request.json();
      const { orderId } = body;

      if (!orderId) {
        throw createValidationError('orderId', 'Megrendelés ID megadása kötelező');
      }

      // Megrendelés lekérése
      const order = await prisma.saaSOrder.findUnique({
        where: { id: orderId },
        include: { plan: true },
      });

      if (!order) {
        throw createValidationError('orderId', 'Megrendelés nem található');
      }

      if (!order.licenseKey) {
        throw createValidationError('orderId', 'A megrendeléshez még nincs license key generálva');
      }

      // Számla szám generálás
      const invoiceNumber = `SAAS-${order.id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      // Számla dátumok
      const issueDate = new Date();
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14); // 14 nap fizetési határidő

      // Email küldés
      const emailResult = await sendInvoiceEmail({
        order,
        plan: order.plan,
        invoiceNumber,
        issueDate,
        dueDate,
      });

      if (!emailResult.success) {
        throw new AppError(
          ErrorCodes.INTERNAL_ERROR,
          'Számla email küldése sikertelen',
          500
        );
      }

      // Megrendelés frissítése
      await prisma.saaSOrder.update({
        where: { id: orderId },
        data: {
          invoiceId: invoiceNumber,
          invoiceSent: true,
          invoiceSentAt: new Date(),
        },
      });

      logger.info('Invoice sent via email', { orderId, invoiceNumber, email: order.customerEmail });

      return NextResponse.json({
        success: true,
        message: 'Számla sikeresen elküldve',
        invoiceNumber,
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/admin/license/send-invoice',
  'POST'
);

