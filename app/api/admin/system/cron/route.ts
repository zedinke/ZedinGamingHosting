import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { processPendingTasks } from '@/lib/task-executor';
import { checkOfflineAgents } from '@/lib/agent-heartbeat';
import { syncAllServerStatuses } from '@/lib/server-status-checker';

// POST - Cron job végrehajtása (belső hívás vagy cron)
export async function POST(request: NextRequest) {
  try {
    // TODO: Valós implementációban itt kellene API key vagy secret ellenőrzés
    // Jelenleg csak admin jogosultságot ellenőrizzük
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      // Ha nincs session, lehet hogy cron job hívja (API key ellenőrzés kellene)
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
          { error: 'Nincs jogosultság' },
          { status: 403 }
        );
      }
    }

    // Várakozó feladatok feldolgozása
    await processPendingTasks();

    // Offline agentek ellenőrzése
    await checkOfflineAgents();

    // Szerver státuszok szinkronizálása
    await syncAllServerStatuses();

    return NextResponse.json({
      success: true,
      message: 'Cron job sikeresen végrehajtva',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a cron job végrehajtása során' },
      { status: 500 }
    );
  }
}

