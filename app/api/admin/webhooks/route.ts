import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

// GET - Webhook konfigurációk listája
export async function GET(request: NextRequest) {
  // Rate limit ellenőrzés
  const rateLimitResult = rateLimitMiddleware(50, 60 * 1000)(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Webhookok lekérdezése az adatbázisból
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      webhooks,
    });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a webhookok lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Új webhook létrehozása
export async function POST(request: NextRequest) {
  // Rate limit ellenőrzés
  const rateLimitResult = rateLimitMiddleware(20, 60 * 1000)(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, url, events, secret } = body;

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Hiányzó mezők' },
        { status: 400 }
      );
    }

    // Webhook secret generálása, ha nincs megadva
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    // Webhook mentése az adatbázisba
    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events,
        secret: webhookSecret,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      webhook,
      message: 'Webhook sikeresen létrehozva',
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a webhook létrehozása során' },
      { status: 500 }
    );
  }
}

