import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { performanceMonitor } from '@/lib/performance-monitor';

// GET - Performance metrikák
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
    const endpoint = searchParams.get('endpoint');
    const method = searchParams.get('method');

    const averageResponseTime = performanceMonitor.getAverageResponseTime(
      endpoint || undefined,
      method || undefined
    );

    const slowestEndpoints = performanceMonitor.getSlowestEndpoints(10);
    const errorRate = performanceMonitor.getErrorRate(endpoint || undefined);

    return NextResponse.json({
      success: true,
      metrics: {
        averageResponseTime,
        errorRate,
        slowestEndpoints,
      },
    });
  } catch (error) {
    console.error('Get performance metrics error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a metrikák lekérdezése során' },
      { status: 500 }
    );
  }
}

