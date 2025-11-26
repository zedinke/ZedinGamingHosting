import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { syncServerStatus } from '@/lib/server-status-checker';
import { logger } from '@/lib/logger';

// POST - Szerver státusz szinkronizálása
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;

    logger.info('Syncing server status', {
      serverId: id,
      adminId: (session.user as any).id,
    });

    const result = await syncServerStatus(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.details || 'Hiba a státusz szinkronizálása során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      oldStatus: result.oldStatus,
      newStatus: result.newStatus,
      details: result.details,
      message: result.oldStatus !== result.newStatus
        ? `Státusz frissítve: ${result.oldStatus} → ${result.newStatus}`
        : 'Státusz már naprakész',
    });
  } catch (error: any) {
    logger.error('Sync server status API error', error as Error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Hiba történt a státusz szinkronizálása során' },
      { status: 500 }
    );
  }
}

