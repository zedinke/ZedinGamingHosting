import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { migrateServer, prepareMigration } from '@/lib/server-migration';
import { logger } from '@/lib/logger';

// POST - Szerver migráció végrehajtása
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
    const body = await request.json();
    const { targetMachineId, targetAgentId } = body;

    if (!targetMachineId || !targetAgentId) {
      return NextResponse.json(
        { error: 'Cél gép és agent ID kötelező' },
        { status: 400 }
      );
    }

    // Előkészítés ellenőrzése
    const preparation = await prepareMigration(id, targetMachineId);
    if (!preparation.canMigrate) {
      return NextResponse.json(
        { error: preparation.error || 'Migráció nem lehetséges' },
        { status: 400 }
      );
    }

    logger.info('Starting server migration', {
      serverId: id,
      targetMachineId,
      targetAgentId,
      adminId: (session.user as any).id,
    });

    // Migráció végrehajtása
    const result = await migrateServer({
      serverId: id,
      targetMachineId,
      targetAgentId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Migráció sikertelen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Szerver sikeresen áttelepítve',
    });
  } catch (error: any) {
    logger.error('Server migration API error', error as Error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Hiba történt a migráció során' },
      { status: 500 }
    );
  }
}

// GET - Migráció előkészítése és ellenőrzése
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const targetMachineId = searchParams.get('targetMachineId');

    if (!targetMachineId) {
      return NextResponse.json(
        { error: 'targetMachineId paraméter kötelező' },
        { status: 400 }
      );
    }

    const preparation = await prepareMigration(id, targetMachineId);

    return NextResponse.json(preparation);
  } catch (error: any) {
    logger.error('Migration preparation API error', error as Error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Hiba történt' },
      { status: 500 }
    );
  }
}

