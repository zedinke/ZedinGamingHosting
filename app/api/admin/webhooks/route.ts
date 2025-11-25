import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

// GET - Webhook konfigurációk listája
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // TODO: Valós implementációban itt kellene webhook konfigurációk tárolása az adatbázisban
    // Jelenleg csak mock adatokat adunk vissza
    const webhooks = [
      {
        id: '1',
        name: 'Discord Notifications',
        url: 'https://discord.com/api/webhooks/...',
        events: ['server_status_change', 'task_completed'],
        active: true,
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Slack Notifications',
        url: 'https://hooks.slack.com/services/...',
        events: ['server_status_change'],
        active: false,
        createdAt: new Date(),
      },
    ];

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

    // TODO: Valós implementációban itt kellene webhook mentése az adatbázisba
    const webhook = {
      id: crypto.randomUUID(),
      name,
      url,
      events,
      secret: webhookSecret,
      active: true,
      createdAt: new Date(),
    };

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

