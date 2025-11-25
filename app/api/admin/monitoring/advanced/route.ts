import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { getSystemStatistics, getResourceTrends } from '@/lib/monitoring-advanced';

// GET - Részletes monitoring adatok
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const hours = parseInt(searchParams.get('hours') || '24');

    if (serverId) {
      // Szerver specifikus trendek
      const trends = await getResourceTrends(serverId, hours);
      return NextResponse.json({
        success: true,
        trends,
      });
    } else {
      // Rendszer szintű statisztikák
      const statistics = await getSystemStatistics();
      return NextResponse.json({
        success: true,
        statistics,
      });
    }
  } catch (error) {
    console.error('Get advanced monitoring error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a monitoring adatok lekérdezése során' },
      { status: 500 }
    );
  }
}

