import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia' as any,
});

/**
 * Stripe checkout session létrehozása
 */
export async function createStripeCheckoutSession(
  userId: string,
  serverId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Felhasználó nem található');
  }

  // Stripe customer keresése vagy létrehozása
  let customerId: string;
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      stripeCustomerId: { not: null },
    },
  });

  if (existingSubscription?.stripeCustomerId) {
    customerId = existingSubscription.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.name || undefined,
      metadata: {
        userId,
      },
    });
    customerId = customer.id;
  }

  // Checkout session létrehozása
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      serverId,
    },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Stripe subscription létrehozása
 */
export async function createStripeSubscription(
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    expand: ['latest_invoice.payment_intent'],
  });
}

/**
 * Stripe subscription megszüntetése
 */
export async function cancelStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Stripe webhook esemény kezelése
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const serverId = session.metadata?.serverId;

  if (!userId || !serverId) {
    return;
  }

  // Előfizetés létrehozása
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      serverId,
      paymentProvider: 'STRIPE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripePriceId: session.line_items?.data[0]?.price?.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Automatikus telepítés triggerelése
  const { triggerAutoInstallOnPayment } = await import('@/lib/auto-install-on-payment');
  triggerAutoInstallOnPayment(serverId).catch((error) => {
    console.error('Auto-install error:', error);
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: 'CANCELED',
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
    },
    include: {
      server: true,
    },
  });

  if (!subscription) {
    return;
  }

  // Számla frissítése
  const updatedInvoice = await prisma.invoice.findFirst({
    where: {
      stripeInvoiceId: invoice.id,
    },
  });

  if (updatedInvoice) {
    await prisma.invoice.update({
      where: { id: updatedInvoice.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  // Automatikus telepítés triggerelése (ha van szerver és még nincs telepítve)
  if (subscription.serverId && subscription.server) {
    const { triggerAutoInstallOnPayment } = await import('@/lib/auto-install-on-payment');
    triggerAutoInstallOnPayment(subscription.serverId, updatedInvoice?.id).catch((error) => {
      console.error('Auto-install error:', error);
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await prisma.invoice.updateMany({
    where: {
      stripeInvoiceId: invoice.id,
    },
    data: {
      status: 'FAILED',
    },
  });
}

function mapStripeStatus(status: string): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING' {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELED';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
      return 'UNPAID';
    case 'trialing':
      return 'TRIALING';
    default:
      return 'ACTIVE';
  }
}

