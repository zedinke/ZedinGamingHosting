import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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
    const { transitionInterval } = body;

    // Validate interval (1-60 seconds)
    const interval = parseInt(transitionInterval, 10);
    if (isNaN(interval) || interval < 1 || interval > 60) {
      return NextResponse.json(
        { error: 'A váltási időnek 1-60 másodperc között kell lennie' },
        { status: 400 }
      );
    }

    await prisma.setting.upsert({
      where: { key: 'slideshow_transition_interval' },
      update: { value: interval.toString() },
      create: {
        key: 'slideshow_transition_interval',
        value: interval.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      transitionInterval: interval,
    });
  } catch (error) {
    console.error('Slideshow settings error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a beállítások mentése során' },
      { status: 500 }
    );
  }
}

