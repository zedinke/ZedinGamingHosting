import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createStripeCheckoutSession } from '@/lib/payments/stripe';
import { createRevolutOrder } from '@/lib/payments/revolut';
import { createPayPalSubscription } from '@/lib/payments/paypal';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, serverId, planId, amount, currency, planName } = body;

    if (!provider || !serverId || !amount) {
      return NextResponse.json(
        { error: 'Hiányzó mezők' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    
    // Próba rang esetén ingyenes próba, de tényleges értékű számla generálása
    const isProba = userRole === 'PROBA';
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/billing?success=true`;
    const cancelUrl = `${baseUrl}/dashboard/billing?canceled=true`;

    // Próba rang esetén nem kell fizetési gateway, közvetlenül sikeres
    if (isProba) {
      const { prisma } = await import('@/lib/prisma');
      const { generateInvoiceNumber } = await import('@/lib/invoice-generator');
      const { getInvoiceSettings } = await import('@/lib/invoice-generator');
      
      // Számla beállítások lekérdezése
      const invoiceSettings = await getInvoiceSettings();
      if (!invoiceSettings) {
        return NextResponse.json(
          { error: 'Számla beállítások hiányoznak' },
          { status: 500 }
        );
      }

      // Számla szám generálása
      const sequenceNumber = await prisma.invoice.count() + 1;
      const invoiceNumber = generateInvoiceNumber(
        invoiceSettings.invoicePrefix,
        invoiceSettings.invoiceNumberFormat,
        sequenceNumber
      );

      // Számla létrehozása (tényleges értékkel, de fizetés nélkül)
      const invoice = await prisma.invoice.create({
        data: {
          userId,
          subscriptionId: (await prisma.subscription.findFirst({
            where: { serverId },
          }))?.id,
          paymentProvider: 'STRIPE', // Próba esetén is STRIPE-ként jelöljük
          amount: amount || 0,
          currency: currency || invoiceSettings.defaultCurrency,
          status: 'PAID', // Próba esetén automatikusan fizetett
          invoiceNumber,
          paidAt: new Date(),
          taxRate: invoiceSettings.defaultVatRate,
          subtotal: amount ? amount / (1 + invoiceSettings.defaultVatRate / 100) : 0,
          taxAmount: amount ? amount - (amount / (1 + invoiceSettings.defaultVatRate / 100)) : 0,
          items: JSON.stringify([{
            name: planName || 'Game Server Subscription (Próba)',
            quantity: 1,
            unitPrice: amount ? amount / (1 + invoiceSettings.defaultVatRate / 100) : 0,
            vatRate: invoiceSettings.defaultVatRate,
          }]),
        },
      });

      // Automatikus telepítés triggerelése
      const { triggerAutoInstallOnPayment } = await import('@/lib/auto-install-on-payment');
      triggerAutoInstallOnPayment(serverId, invoice.id).catch((error) => {
        console.error('Auto-install error:', error);
      });

      return NextResponse.json({
        success: true,
        provider: 'PROBA',
        isProba: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        message: 'Próba rendelés sikeresen létrehozva',
      });
    }

    let checkoutData: any;

    switch (provider) {
      case 'STRIPE':
        if (!planId) {
          return NextResponse.json(
            { error: 'Stripe price ID szükséges' },
            { status: 400 }
          );
        }
        checkoutData = await createStripeCheckoutSession(
          userId,
          serverId,
          planId,
          successUrl,
          cancelUrl
        );
        break;

      case 'REVOLUT':
        checkoutData = await createRevolutOrder(
          userId,
          serverId,
          amount,
          currency || 'HUF',
          planName || 'Game Server Subscription'
        );
        break;

      case 'PAYPAL':
        if (!planId) {
          return NextResponse.json(
            { error: 'PayPal plan ID szükséges' },
            { status: 400 }
          );
        }
        checkoutData = await createPayPalSubscription(
          userId,
          serverId,
          planId,
          successUrl,
          cancelUrl
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Érvénytelen fizetési szolgáltató' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      provider,
      checkoutUrl: checkoutData.url || checkoutData.checkoutUrl || checkoutData.approvalUrl,
      sessionId: checkoutData.sessionId,
      orderId: checkoutData.orderId,
      subscriptionId: checkoutData.subscriptionId,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a checkout létrehozása során' },
      { status: 500 }
    );
  }
}

