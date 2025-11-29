import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Ellenőrzi, hogy egy szerver kifizetett-e
 * @param serverId - A szerver ID-ja
 * @returns true, ha a szerver kifizetett (subscription ACTIVE és invoice PAID), false egyébként
 */
export async function isServerPaid(serverId: string): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        subscription: {
          include: {
            invoices: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Legutóbbi számla
            },
          },
        },
      },
    });

    if (!server) {
      logger.warn('Server not found for payment check', { serverId });
      return false;
    }

    // Ha nincs subscription, akkor nincs kifizetve
    if (!server.subscription) {
      logger.info('Server has no subscription', { serverId });
      return false;
    }

    // Subscription státusz ellenőrzése
    // ACTIVE és TRIALING státuszok esetén engedélyezett
    const allowedSubscriptionStatuses = ['ACTIVE', 'TRIALING'];
    if (!allowedSubscriptionStatuses.includes(server.subscription.status)) {
      logger.info('Server subscription is not active', {
        serverId,
        subscriptionStatus: server.subscription.status,
      });
      return false;
    }

    // Invoice státusz ellenőrzése
    // Ha van invoice, akkor annak PAID-nek kell lennie
    if (server.subscription.invoices && server.subscription.invoices.length > 0) {
      const latestInvoice = server.subscription.invoices[0];
      if (latestInvoice.status !== 'PAID') {
        logger.info('Server invoice is not paid', {
          serverId,
          invoiceStatus: latestInvoice.status,
          invoiceId: latestInvoice.id,
        });
        return false;
      }
    } else {
      // Ha nincs invoice, akkor lehet, hogy még nem készült el a számla
      // Ebben az esetben a subscription státusz alapján döntünk
      // Ha ACTIVE vagy TRIALING, akkor engedélyezett
      logger.info('Server has no invoices, checking subscription status only', {
        serverId,
        subscriptionStatus: server.subscription.status,
      });
    }

    return true;
  } catch (error) {
    logger.error('Error checking server payment status', error as Error, { serverId });
    // Hiba esetén biztonsági okokból false-t adunk vissza
    return false;
  }
}

/**
 * Ellenőrzi, hogy egy szerver kifizetett-e, és ha nem, akkor hibát dob
 * @param serverId - A szerver ID-ja
 * @throws Error, ha a szerver nincs kifizetve
 */
export async function requireServerPaid(serverId: string): Promise<void> {
  const isPaid = await isServerPaid(serverId);
  if (!isPaid) {
    throw new Error('A szerver nincs kifizetve. Kérjük, fizesse ki a számlát a szerver használatához.');
  }
}

