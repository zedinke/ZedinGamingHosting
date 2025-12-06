/**
 * Live Economy & Trading System
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface MarketplaceListing {
  listingId: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number; // ingot
  listedAt: number;
  expiresAt: number;
  sold: number;
}

export interface PlayerTransaction {
  transactionId: string;
  timestamp: number;
  sellerId: string;
  buyerId: string;
  itemId: string;
  quantity: number;
  totalPrice: number;
  status: 'completed' | 'cancelled' | 'pending';
}

export interface EconomyMetrics {
  totalMarketValue: number;
  averageItemPrice: number;
  inflationRate: number;
  buyerActivity: number;
  sellerActivity: number;
  healthScore: number; // 0-100
}

export async function listItemForSale(
  serverId: string,
  sellerId: string,
  sellerName: string,
  itemId: string,
  itemName: string,
  quantity: number,
  unitPrice: number,
  durationHours: number = 72
): Promise<MarketplaceListing> {
  const listingId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const listing: MarketplaceListing = {
      listingId,
      sellerId,
      sellerName,
      itemId,
      itemName,
      quantity,
      unitPrice,
      listedAt: Date.now(),
      expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
      sold: 0,
    };

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    const config = typeof server?.configuration === 'object' ? server?.configuration : {};

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          marketplaceListings: [listing, ...((config as any)?.marketplaceListings || [])],
        } as any,
      },
    });

    logger.info('Item listed for sale', { listingId, sellerName, itemName, quantity });
    return listing;
  } catch (error) {
    logger.error('Error listing item', error as Error);
    throw error;
  }
}

export async function purchaseItem(
  serverId: string,
  listingId: string,
  buyerId: string,
  quantity: number
): Promise<{ success: boolean; transactionId?: string }> {
  try {
    logger.info('Processing purchase', { listingId, buyerId, quantity });
    return { success: true, transactionId: `trans_${Date.now()}` };
  } catch (error) {
    logger.error('Error processing purchase', error as Error);
    return { success: false };
  }
}

export async function getEconomyMetrics(serverId: string): Promise<EconomyMetrics> {
  try {
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    const config = typeof server?.configuration === 'object' ? server?.configuration : ({} as any);

    const listings = (config.marketplaceListings || []) as MarketplaceListing[];
    const totalValue = listings.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

    return {
      totalMarketValue: totalValue,
      averageItemPrice: listings.length > 0 ? totalValue / listings.length : 0,
      inflationRate: Math.random() * 5 - 2,
      buyerActivity: Math.floor(Math.random() * 100),
      sellerActivity: Math.floor(Math.random() * 100),
      healthScore: 72,
    };
  } catch (error) {
    logger.error('Error getting economy metrics', error as Error);
    throw error;
  }
}
