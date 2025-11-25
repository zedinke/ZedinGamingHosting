import axios from 'axios';
import { prisma } from '@/lib/prisma';

const paypalApiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * PayPal access token lekérdezése
 */
async function getPayPalAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await axios.post(
    `${paypalApiUrl}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: paypalClientId,
        password: paypalClientSecret,
      },
    }
  );

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 perc buffer

  return accessToken;
}

/**
 * PayPal API client
 */
async function getPayPalClient() {
  const token = await getPayPalAccessToken();
  return axios.create({
    baseURL: paypalApiUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * PayPal subscription plan létrehozása
 */
export async function createPayPalPlan(
  name: string,
  description: string,
  amount: number,
  currency: string = 'HUF',
  interval: 'MONTH' | 'YEAR' = 'MONTH'
): Promise<{ planId: string }> {
  const client = await getPayPalClient();

  const plan = {
    name,
    description,
    type: 'SERVICE',
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0',
        currency_code: currency,
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
    billing_cycles: [
      {
        frequency: {
          interval_unit: interval,
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Végtelen
        pricing_scheme: {
          fixed_price: {
            value: amount.toString(),
            currency_code: currency,
          },
        },
      },
    ],
  };

  const response = await client.post('/v1/billing/plans', plan);
  return { planId: response.data.id };
}

/**
 * PayPal subscription létrehozása
 */
export async function createPayPalSubscription(
  userId: string,
  serverId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Felhasználó nem található');
  }

  const client = await getPayPalClient();

  const subscription = {
    plan_id: planId,
    start_time: new Date(Date.now() + 60000).toISOString(), // 1 perc múlva
    subscriber: {
      email_address: user.email || undefined,
      name: {
        given_name: user.name?.split(' ')[0] || undefined,
        surname: user.name?.split(' ').slice(1).join(' ') || undefined,
      },
    },
    application_context: {
      brand_name: 'ZedinGamingHosting',
      locale: 'hu-HU',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: successUrl,
      cancel_url: cancelUrl,
    },
    custom_id: `${userId}:${serverId}`,
  };

  const response = await client.post('/v1/billing/subscriptions', subscription);

  return {
    subscriptionId: response.data.id,
    approvalUrl: response.data.links.find((link: any) => link.rel === 'approve')?.href || '',
  };
}

/**
 * PayPal subscription aktiválása
 */
export async function activatePayPalSubscription(subscriptionId: string): Promise<void> {
  const client = await getPayPalClient();
  await client.post(`/v1/billing/subscriptions/${subscriptionId}/activate`);
}

/**
 * PayPal subscription megszüntetése
 */
export async function cancelPayPalSubscription(subscriptionId: string): Promise<void> {
  const client = await getPayPalClient();
  await client.post(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    reason: 'User requested cancellation',
  });
}

/**
 * PayPal subscription státusz lekérdezése
 */
export async function getPayPalSubscriptionStatus(subscriptionId: string): Promise<{
  status: string;
  planId: string;
}> {
  const client = await getPayPalClient();
  const response = await client.get(`/v1/billing/subscriptions/${subscriptionId}`);
  return {
    status: response.data.status,
    planId: response.data.plan_id,
  };
}

/**
 * PayPal webhook esemény kezelése
 */
export async function handlePayPalWebhook(event: any): Promise<void> {
  const { event_type, resource } = event;

  switch (event_type) {
    case 'BILLING.SUBSCRIPTION.CREATED':
    case 'BILLING.SUBSCRIPTION.UPDATED':
      await handleSubscriptionUpdated(resource);
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      await handleSubscriptionCancelled(resource);
      break;
    case 'PAYMENT.SALE.COMPLETED':
      await handlePaymentCompleted(resource);
      break;
    case 'PAYMENT.SALE.DENIED':
      await handlePaymentDenied(resource);
      break;
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const customId = subscription.custom_id;
  if (!customId) return;

  const [userId, serverId] = customId.split(':');

  await prisma.subscription.upsert({
    where: {
      paypalSubscriptionId: subscription.id,
    },
    create: {
      userId,
      serverId,
      paymentProvider: 'PAYPAL',
      paypalSubscriptionId: subscription.id,
      paypalPlanId: subscription.plan_id,
      status: mapPayPalStatus(subscription.status),
      currentPeriodStart: new Date(subscription.start_time),
      currentPeriodEnd: subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      status: mapPayPalStatus(subscription.status),
      currentPeriodStart: new Date(subscription.start_time),
      currentPeriodEnd: subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : undefined,
    },
  });
}

async function handleSubscriptionCancelled(subscription: any) {
  await prisma.subscription.updateMany({
    where: {
      paypalSubscriptionId: subscription.id,
    },
    data: {
      status: 'CANCELED',
    },
  });
}

async function handlePaymentCompleted(payment: any) {
  // Számla létrehozása vagy frissítése
  const subscription = await prisma.subscription.findFirst({
    where: {
      paypalSubscriptionId: payment.billing_agreement_id,
    },
  });

  if (!subscription) {
    return;
  }

  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await prisma.invoice.create({
    data: {
      userId: subscription.userId,
      subscriptionId: subscription.id,
      paymentProvider: 'PAYPAL',
      paypalTransactionId: payment.id,
      amount: parseFloat(payment.amount.total),
      currency: payment.amount.currency,
      status: 'PAID',
      invoiceNumber,
      paidAt: new Date(),
    },
  });
}

async function handlePaymentDenied(payment: any) {
  await prisma.invoice.updateMany({
    where: {
      paypalTransactionId: payment.id,
    },
    data: {
      status: 'FAILED',
    },
  });
}

function mapPayPalStatus(status: string): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING' {
  switch (status) {
    case 'ACTIVE':
      return 'ACTIVE';
    case 'CANCELLED':
      return 'CANCELED';
    case 'SUSPENDED':
      return 'PAST_DUE';
    case 'EXPIRED':
      return 'UNPAID';
    default:
      return 'ACTIVE';
  }
}

