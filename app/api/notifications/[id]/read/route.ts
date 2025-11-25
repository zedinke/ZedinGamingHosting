import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { markNotificationAsRead } from '@/lib/notifications';

// POST - Értesítés olvasottnak jelölése
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const result = await markNotificationAsRead(id, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Értesítés olvasottnak jelölve',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { error: 'Hiba történt' },
      { status: 500 }
    );
  }
}

