import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET - Backup bővítés ára lekérése
 */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'backup_upgrade_price' },
    });

    const currencySetting = await prisma.setting.findUnique({
      where: { key: 'backup_upgrade_currency' },
    });

    const price = setting ? parseFloat(setting.value) : 5000; // Alapértelmezett: 5000 HUF
    const currency = currencySetting?.value || 'HUF';

    return NextResponse.json({
      success: true,
      price,
      currency,
    });
  } catch (error) {
    logger.error('Error fetching backup upgrade price', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt az ár lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Backup bővítés ára mentése (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { price, currency = 'HUF' } = body;

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Érvénytelen ár' },
        { status: 400 }
      );
    }

    // Ár mentése
    await prisma.setting.upsert({
      where: { key: 'backup_upgrade_price' },
      update: { value: price.toString(), category: 'system' },
      create: {
        key: 'backup_upgrade_price',
        value: price.toString(),
        category: 'system',
      },
    });

    // Pénznem mentése
    await prisma.setting.upsert({
      where: { key: 'backup_upgrade_currency' },
      update: { value: currency, category: 'system' },
      create: {
        key: 'backup_upgrade_currency',
        value: currency,
        category: 'system',
      },
    });

    return NextResponse.json({
      success: true,
      price,
      currency,
      message: 'Backup bővítés ára sikeresen mentve',
    });
  } catch (error) {
    logger.error('Error saving backup upgrade price', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt az ár mentése során' },
      { status: 500 }
    );
  }
}

