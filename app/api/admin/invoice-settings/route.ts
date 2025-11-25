import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { getInvoiceSettings, saveInvoiceSettings } from '@/lib/invoice-generator';
import { handleApiError, createForbiddenError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// GET - Számla beállítások lekérdezése
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createForbiddenError('Nincs jogosultság');
    }

    const settings = await getInvoiceSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    logger.error('Get invoice settings error', error as Error);
    return handleApiError(error);
  }
}

// POST - Számla beállítások mentése
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createForbiddenError('Nincs jogosultság');
    }

    const body = await request.json();
    await saveInvoiceSettings(body);

    logger.info('Invoice settings updated', {
      adminId: (session.user as any).id,
    });

    return NextResponse.json({
      success: true,
      message: 'Számla beállítások sikeresen mentve',
    });
  } catch (error) {
    logger.error('Save invoice settings error', error as Error);
    return handleApiError(error);
  }
}

