import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST - Webhook szerver állapot változásról
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, oldStatus, newStatus, timestamp } = body;

    if (!serverId || !oldStatus || !newStatus) {
      return NextResponse.json(
        { error: 'Hiányzó mezők' },
        { status: 400 }
      );
    }

    // Webhook signature ellenőrzése (ha van)
    const signature = request.headers.get('x-webhook-signature');
    if (signature && process.env.WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Érvénytelen signature' },
          { status: 401 }
        );
      }
    }

    // Szerver ellenőrzése
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        user: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Webhook esemény naplózása
    await prisma.$executeRaw`
      INSERT INTO webhook_events (id, type, server_id, data, created_at)
      VALUES (${crypto.randomUUID()}, 'server_status_change', ${serverId}, ${JSON.stringify(body)}, NOW())
    `.catch(() => {
      // Ha nincs webhook_events tábla, csak logoljuk
      console.log('Webhook event:', { serverId, oldStatus, newStatus });
    });

    // TODO: Itt lehet külső webhook-okat hívni (Discord, Slack, stb.)

    return NextResponse.json({
      success: true,
      message: 'Webhook feldolgozva',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a webhook feldolgozása során' },
      { status: 500 }
    );
  }
}

