import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserNotifications, markAllNotificationsAsRead, getUnreadNotificationCount } from '@/lib/notifications';

// GET - Felhasználó értesítései
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const userId = (session.user as any).id;
    const notifications = await getUserNotifications(userId, limit, unreadOnly);
    const unreadCount = await getUnreadNotificationCount(userId);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az értesítések lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Összes értesítés olvasottnak jelölése
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const result = await markAllNotificationsAsRead(userId);

    return NextResponse.json({
      success: result.success,
      message: 'Összes értesítés olvasottnak jelölve',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return NextResponse.json(
      { error: 'Hiba történt' },
      { status: 500 }
    );
  }
}

