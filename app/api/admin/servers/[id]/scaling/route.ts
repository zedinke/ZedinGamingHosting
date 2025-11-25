import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { checkAndScaleServer, scaleServerResources } from '@/lib/auto-scaling';

// GET - Skálázási ellenőrzés
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
    const result = await checkAndScaleServer(id);

    return NextResponse.json({
      success: true,
      action: result.action,
      reason: result.reason,
    });
  } catch (error) {
    console.error('Check scaling error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a skálázási ellenőrzés során' },
      { status: 500 }
    );
  }
}

// POST - Skálázás végrehajtása
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
    const { action } = body;

    if (action !== 'scale_up' && action !== 'scale_down') {
      return NextResponse.json(
        { error: 'Érvénytelen művelet' },
        { status: 400 }
      );
    }

    const result = await scaleServerResources(id, action);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a skálázás során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Szerver sikeresen ${action === 'scale_up' ? 'fel' : 'le'} skálázva`,
    });
  } catch (error) {
    console.error('Scale server error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a skálázás során' },
      { status: 500 }
    );
  }
}

