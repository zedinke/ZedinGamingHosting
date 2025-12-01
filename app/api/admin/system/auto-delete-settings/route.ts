import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { getAutoDeleteSettings, saveAutoDeleteSettings } from '@/lib/auto-delete-service';
import { logger } from '@/lib/logger';

/**
 * GET - Automatikus törlési beállítások lekérése
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const settings = await getAutoDeleteSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    logger.error('Error fetching auto delete settings', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a beállítások lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Automatikus törlési beállítások mentése
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
    const { enabled, deleteAfterDays, deleteAfterHours, deleteAfterMinutes } = body;

    // Validáció
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Az enabled mező boolean kell legyen' },
        { status: 400 }
      );
    }

    if (enabled) {
      const days = parseInt(deleteAfterDays?.toString() || '0', 10);
      const hours = parseInt(deleteAfterHours?.toString() || '0', 10);
      const minutes = parseInt(deleteAfterMinutes?.toString() || '0', 10);

      if (isNaN(days) || isNaN(hours) || isNaN(minutes)) {
        return NextResponse.json(
          { error: 'A nap, óra és perc mezők számok kell legyenek' },
          { status: 400 }
        );
      }

      if (days < 0 || hours < 0 || minutes < 0) {
        return NextResponse.json(
          { error: 'A nap, óra és perc értékek nem lehetnek negatívak' },
          { status: 400 }
        );
      }

      const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
      if (totalMinutes < 5) {
        return NextResponse.json(
          { error: 'Az automatikus törlés minimum 5 perc lehet' },
          { status: 400 }
        );
      }
    }

    const result = await saveAutoDeleteSettings({
      enabled,
      deleteAfterDays: enabled ? parseInt(deleteAfterDays?.toString() || '0', 10) : 0,
      deleteAfterHours: enabled ? parseInt(deleteAfterHours?.toString() || '0', 10) : 0,
      deleteAfterMinutes: enabled ? parseInt(deleteAfterMinutes?.toString() || '0', 10) : 0,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a beállítások mentése során' },
        { status: 500 }
      );
    }

    const updatedSettings = await getAutoDeleteSettings();

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: 'Beállítások sikeresen mentve',
    });
  } catch (error) {
    logger.error('Error saving auto delete settings', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a beállítások mentése során' },
      { status: 500 }
    );
  }
}

