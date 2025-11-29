import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/error-handler';

// POST - FCM token regisztrálása
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, platform = 'android', deviceId } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token megadása kötelező' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Token regisztrálása vagy frissítése
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        active: true,
        updatedAt: new Date(),
        deviceId: deviceId || undefined,
        platform,
      },
      create: {
        userId,
        token,
        platform,
        deviceId: deviceId || undefined,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Push token regisztrálva',
    });
  } catch (error) {
    console.error('Register push token error:', error);
    return handleApiError(error as Error, 'Push token regisztrálási hiba');
  }
}

// DELETE - FCM token törlése (kijelentkezéskor)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token megadása kötelező' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    await prisma.pushToken.updateMany({
      where: {
        userId,
        token,
      },
      data: {
        active: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Push token törölve',
    });
  } catch (error) {
    console.error('Delete push token error:', error);
    return handleApiError(error as Error, 'Push token törlési hiba');
  }
}

