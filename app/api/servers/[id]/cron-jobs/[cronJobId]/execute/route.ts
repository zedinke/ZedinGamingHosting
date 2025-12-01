import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { executeCronJob } from '@/lib/cron-job-manager';

/**
 * POST - Cron job manuális végrehajtása
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cronJobId: string }> | { id: string; cronJobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id, cronJobId } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    // Cron job lekérdezése
    const cronJob = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
    });

    if (!cronJob) {
      return NextResponse.json(
        { error: 'Cron job nem található' },
        { status: 404 }
      );
    }

    // Ellenőrzés: a cron job a megadott szerverhez tartozik
    if (cronJob.serverId !== id) {
      return NextResponse.json(
        { error: 'Cron job nem tartozik ehhez a szerverhez' },
        { status: 400 }
      );
    }

    // Csak a szerver tulajdonosa futtathatja manuálisan
    if (cronJob.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Cron job végrehajtása
    const result = await executeCronJob(cronJobId);

    return NextResponse.json({
      success: result.success,
      result: result.result,
      error: result.error,
      duration: result.duration,
      message: result.success
        ? 'Cron job sikeresen végrehajtva'
        : `Cron job végrehajtása sikertelen: ${result.error || 'Ismeretlen hiba'}`,
    });
  } catch (error) {
    logger.error('Execute cron job error', error as Error, {
      cronJobId: (await Promise.resolve(params)).cronJobId,
    });
    return NextResponse.json(
      { error: 'Hiba történt a cron job végrehajtása során' },
      { status: 500 }
    );
  }
}

