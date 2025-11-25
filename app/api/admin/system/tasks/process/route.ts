import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { processPendingTasks } from '@/lib/task-executor';

// POST - Várakozó feladatok feldolgozása (cron job vagy manuális)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    await processPendingTasks();

    return NextResponse.json({
      success: true,
      message: 'Várakozó feladatok feldolgozva',
    });
  } catch (error: any) {
    console.error('Process tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a feladatok feldolgozása során' },
      { status: 500 }
    );
  }
}

