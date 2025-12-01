import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, AppError, ErrorCodes, createValidationError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

/**
 * SaaS megrendelés létrehozása
 */
export const POST = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const {
        planId,
        customerName,
        customerEmail,
        customerCompany,
        billingAddress,
        billingTaxNumber,
        paymentProvider = 'STRIPE',
      } = body;

      // Validáció
      if (!planId) {
        throw createValidationError('planId', 'Csomag megadása kötelező');
      }

      if (!customerName || !customerEmail || !billingAddress) {
        throw createValidationError('form', 'Név, email és számlázási cím megadása kötelező');
      }

      // Plan ellenőrzés
      const plan = await prisma.saaSPlan.findUnique({
        where: { id: planId },
      });

      if (!plan || !plan.isActive) {
        throw createValidationError('planId', 'Érvénytelen vagy inaktív csomag');
      }

      // Megrendelés létrehozása
      const order = await prisma.saaSOrder.create({
        data: {
          planId,
          customerName,
          customerEmail,
          customerCompany: customerCompany || null,
          billingAddress,
          billingTaxNumber: billingTaxNumber || null,
          amount: plan.price,
          currency: plan.currency,
          paymentProvider: paymentProvider as any,
          paymentStatus: 'PENDING',
        },
        include: {
          plan: true,
        },
      });

      // Fizetési URL generálás (Stripe, PayPal, stb.)
      let checkoutUrl: string | null = null;

      if (paymentProvider === 'STRIPE') {
        // Stripe checkout session létrehozása
        const stripe = await import('stripe');
        const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY || '');

        // Alapértelmezett locale (hu)
        const defaultLocale = 'hu';
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: plan.currency.toLowerCase(),
                product_data: {
                  name: plan.displayName,
                  description: plan.description || 'Zed Gaming System SaaS licenc',
                },
                unit_amount: Math.round(plan.price * 100), // Centekbe konvertálás
                recurring: plan.interval === 'month' 
                  ? { interval: 'month' }
                  : plan.interval === 'year'
                  ? { interval: 'year' }
                  : undefined,
              },
              quantity: 1,
            },
          ],
          mode: plan.interval === 'month' || plan.interval === 'year' ? 'subscription' : 'payment',
          success_url: `${baseUrl}/${defaultLocale}/zed-gaming-system/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/${defaultLocale}/zed-gaming-system/order?plan=${planId}`,
          customer_email: customerEmail,
          metadata: {
            orderId: order.id,
            planId: plan.id,
            type: 'saas_order', // Jelzés, hogy SaaS megrendelés
          },
        });

        // Stripe payment intent ID mentése
        await prisma.saaSOrder.update({
          where: { id: order.id },
          data: {
            stripePaymentIntentId: session.id,
          },
        });

        checkoutUrl = session.url;
      }

      logger.info('SaaS order created', { orderId: order.id, planId, customerEmail });

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
        checkoutUrl,
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/saas/orders',
  'POST'
);

/**
 * SaaS megrendelések listázása (admin)
 */
export const GET = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const where: any = {};
      if (status) {
        where.paymentStatus = status;
      }

      const [orders, total] = await Promise.all([
        prisma.saaSOrder.findMany({
          where,
          include: {
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.saaSOrder.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return handleApiError(error);
    }
  },
  '/api/saas/orders',
  'GET'
);

