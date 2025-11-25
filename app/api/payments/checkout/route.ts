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
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/billing?success=true`;
    const cancelUrl = `${baseUrl}/dashboard/billing?canceled=true`;

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

