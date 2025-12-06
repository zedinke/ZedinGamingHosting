/**
 * ARK Enterprise Economy System API
 * GET - Market listings, metrics, economy health
 * POST - List item, purchase, trade
 * DELETE - Remove listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  listItemForSale,
  purchaseItem,
  getEconomyMetrics,
} from '@/lib/ark-economy-system';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;
    const searchParams = new URL(request.url).searchParams;
    const action = searchParams.get('action') || 'listings';
    const sort = searchParams.get('sort') || 'recent'; // recent, price_asc, price_desc, demand

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check
    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};

    if (action === 'metrics') {
      const metrics = await getEconomyMetrics(serverId);
      return NextResponse.json({
        success: true,
        data: metrics,
      });
    }

    if (action === 'active') {
      const listings = (config.marketListings || []).filter(
        (l: any) => new Date(l.expiresAt) > new Date()
      );

      // Apply sorting
      let sorted = [...listings];
      if (sort === 'price_asc') {
        sorted.sort((a: any, b: any) => a.price - b.price);
      } else if (sort === 'price_desc') {
        sorted.sort((a: any, b: any) => b.price - a.price);
      } else if (sort === 'demand') {
        sorted.sort((a: any, b: any) => b.demand - a.demand);
      } else {
        sorted.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          listings: sorted,
          count: sorted.length,
          totalValue: sorted.reduce((sum: number, l: any) => sum + (l.price * l.quantity), 0),
        },
      });
    }

    return NextResponse.json({ error: 'Ismeretlen akcio' }, { status: 400 });
  } catch (error: unknown) {
    logger.error('Economy GET error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a piaci adatok lekérdezése során' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;
    const body = await request.json();
    const { action = 'list', itemName, quantity, price, duration = 72, demandEstimate = 0 } = body;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check
    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    if (action === 'list') {
      if (!itemName || !quantity || !price) {
        return NextResponse.json(
          { error: 'Tárgy név, mennyiség és ár szükséges' },
          { status: 400 }
        );
      }

      const listing = await listItemForSale(
        serverId,
        (session.user as any).id,
        (session.user as any).name || 'Seller',
        `item_${Date.now()}`,
        itemName,
        quantity,
        price,
        duration
      );

      return NextResponse.json({
        success: true,
        data: listing,
        message: 'Tárgy felsorolva a piacon',
      });
    }

    if (action === 'purchase') {
      const listingId = body.listingId;
      const buyQuantity = body.quantity || 1;

      if (!listingId) {
        return NextResponse.json(
          { error: 'Felsorolás azonosító szükséges' },
          { status: 400 }
        );
      }

      const transaction = await purchaseItem(serverId, listingId, buyQuantity, (session.user as any).id);

      return NextResponse.json({
        success: true,
        data: transaction,
        message: 'Vásárlás sikeresen feldolgozva',
      });
    }

    return NextResponse.json({ error: 'Ismeretlen akcio' }, { status: 400 });
  } catch (error: unknown) {
    logger.error('Economy POST error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a piac kezelésekor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;
    const searchParams = new URL(request.url).searchParams;
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json(
        { error: 'Felsorolás azonosító szükséges' },
        { status: 400 }
      );
    }

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check
    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
    const listings = (config.marketListings || []).filter((l: any) => l.id !== listingId);

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          marketListings: listings,
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Felsorolás sikeresen eltávolítva',
    });
  } catch (error: unknown) {
    logger.error('Economy DELETE error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a felsorolás eltávolítása során' },
      { status: 500 }
    );
  }
}
