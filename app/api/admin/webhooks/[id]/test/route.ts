import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { sendFormattedWebhook } from '@/lib/webhook-sender';

// POST - Webhook tesztelése
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { event, data } = body;

    // Teszt esemény küldése
    const result = await sendFormattedWebhook(
      id,
      event || 'server_status_change',
      data || {
        serverId: 'test-server-id',
        serverName: 'Teszt Szerver',
        oldStatus: 'OFFLINE',
        newStatus: 'ONLINE',
        action: 'start',
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Webhook teszt sikertelen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook teszt sikeres',
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a webhook tesztelése során' },
      { status: 500 }
    );
  }
}

