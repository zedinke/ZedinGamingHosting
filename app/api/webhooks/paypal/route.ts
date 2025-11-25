import { NextRequest, NextResponse } from 'next/server';
import { handlePayPalWebhook } from '@/lib/payments/paypal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // PayPal webhook validálás (TODO: implementálni a valós validációt)
    // Jelenleg csak a eseményt kezeljük

    // Webhook esemény kezelése
    await handlePayPalWebhook(body);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

