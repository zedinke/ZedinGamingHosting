import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { triggerAutoDelete } from '@/lib/auto-delete-executor';
import { logger } from '@/lib/logger';

/**
 * POST - Manuális automatikus törlés trigger (teszteléshez)
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    logger.info('Manual auto delete trigger requested', {
      adminId: (session.user as any).id,
    });

    const result = await triggerAutoDelete();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt az automatikus törlés során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} szerver törölve`,
    });
  } catch (error) {
    logger.error('Error triggering auto delete', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt az automatikus törlés indítása során' },
      { status: 500 }
    );
  }
}

