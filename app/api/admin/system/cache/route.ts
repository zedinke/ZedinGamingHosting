import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { cache } from '@/lib/cache';

// GET - Cache statisztikák
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const stats = cache.getStats();

    return NextResponse.json({
      success: true,
      cache: stats,
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a cache statisztikák lekérdezése során' },
      { status: 500 }
    );
  }
}

// DELETE - Cache törlése
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    cache.clear();

    return NextResponse.json({
      success: true,
      message: 'Cache törölve',
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a cache törlése során' },
      { status: 500 }
    );
  }
}

