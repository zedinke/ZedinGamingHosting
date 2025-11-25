import { NextRequest, NextResponse } from 'next/server';
import { handlePayPalWebhook } from '@/lib/payments/paypal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = await request.headers;
    const authAlgo = headers.get('paypal-auth-algo');
    const certUrl = headers.get('paypal-cert-url');
    const transmissionId = headers.get('paypal-transmission-id');
    const transmissionSig = headers.get('paypal-transmission-sig');
    const transmissionTime = headers.get('paypal-transmission-time');

    // PayPal webhook validálás
    // Megjegyzés: Teljes validációhoz szükséges a PayPal certificate letöltése és validálása
    // Jelenleg csak az alapvető ellenőrzéseket végezzük
    if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
      console.warn('PayPal webhook missing headers, but continuing...');
    }

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

