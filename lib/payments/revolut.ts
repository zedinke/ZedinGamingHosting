import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const revolutApiUrl = process.env.REVOLUT_API_URL || 'https://b2b.revolut.com/api/1.0';
const revolutApiKey = process.env.REVOLUT_API_KEY || '';
const revolutWebhookSecret = process.env.REVOLUT_WEBHOOK_SECRET || '';

/**
 * Revolut API request helper
 */
async function revolutRequest(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${revolutApiUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${revolutApiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Revolut API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Revolut order létrehozása
 */
export async function createRevolutOrder(
  userId: string,
  serverId: string,
  amount: number,
  currency: string = 'HUF',
  description: string = 'Game Server Subscription'
): Promise<{ orderId: string; publicId: string; checkoutUrl: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Felhasználó nem található');
  }

  // Revolut order létrehozása
  const order = await revolutRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Centben
      currency,
      description,
      customer_email: user.email || undefined,
      metadata: {
        userId,
        serverId,
      },
      capture_mode: 'MANUAL', // Manuális capture (előfizetés esetén)
    }),
  });

  return {
    orderId: order.id,
    publicId: order.public_id,
    checkoutUrl: `https://pay.revolut.com/${order.public_id}`,
  };
}

/**
 * Revolut order capture (fizetés megerősítése)
 */
export async function captureRevolutOrder(orderId: string): Promise<void> {
  await revolutRequest(`/orders/${orderId}/capture`, {
    method: 'POST',
  });
}

/**
 * Revolut order státusz lekérdezése
 */
export async function getRevolutOrderStatus(orderId: string): Promise<{
  state: string;
  amount: number;
  currency: string;
}> {
  const response = await revolutRequest(`/orders/${orderId}`, {
    method: 'GET',
  });
  return {
    state: response.state,
    amount: response.amount / 100, // Centből
    currency: response.currency,
  };
}

/**
 * Revolut webhook validálás
 */
export function verifyRevolutWebhook(
  payload: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac('sha256', revolutWebhookSecret);
  const calculatedSignature = hmac.update(payload).digest('hex');
  return calculatedSignature === signature;
}

/**
 * Revolut webhook esemény kezelése
 */
export async function handleRevolutWebhook(event: any): Promise<void> {
  const { type, data } = event;

  switch (type) {
    case 'ORDER_COMPLETED':
      await handleOrderCompleted(data);
      break;
    case 'ORDER_AUTHORISED':
      await handleOrderAuthorised(data);
      break;
    case 'ORDER_PAYMENT_FAILED':
      await handleOrderPaymentFailed(data);
      break;
  }
}

async function handleOrderCompleted(order: any) {
  const userId = order.metadata?.userId;
  const serverId = order.metadata?.serverId;

  if (!userId || !serverId) {
    return;
  }

  // Előfizetés létrehozása
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      serverId,
      paymentProvider: 'REVOLUT',
      revolutOrderId: order.id,
      revolutPaymentId: order.payments?.[0]?.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Számla létrehozása
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const invoice = await prisma.invoice.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      paymentProvider: 'REVOLUT',
      revolutOrderId: order.id,
      revolutPaymentId: order.payments?.[0]?.id,
      amount: order.amount / 100,
      currency: 'EUR', // Számlák mindig EUR-ban
      status: 'PAID',
      invoiceNumber,
      paidAt: new Date(),
    },
  });

  // Auto-install kikapcsolva: a régi installer rendszer eltávolítva
}

async function handleOrderAuthorised(order: any) {
  // Order authorized, de még nincs captured
  // Itt lehet manuális capture-t kezdeményezni
}

async function handleOrderPaymentFailed(order: any) {
  await prisma.invoice.updateMany({
    where: {
      revolutOrderId: order.id,
    },
    data: {
      status: 'FAILED',
    },
  });
}

