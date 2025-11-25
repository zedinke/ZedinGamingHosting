import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyRevolutWebhook, handleRevolutWebhook } from '@/lib/payments/revolut';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = (await headers()).get('revolut-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Webhook validálás
    if (!verifyRevolutWebhook(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Webhook esemény kezelése
    const event = JSON.parse(body);
    await handleRevolutWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Revolut webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

