import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * POST - Backup bővítés vásárlása
 * TODO: Integrálás a fizetési rendszerrel (Stripe/Revolut/PayPal)
 * Most egyszerűen növeli a limitet (később fizetési flow lesz)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        backupCountLimit: true,
        backupStorageLimitGB: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Csak a szerver tulajdonosa vásárolhat bővítést
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Ár lekérése
    const priceSetting = await prisma.setting.findUnique({
      where: { key: 'backup_upgrade_price' },
    });

    const currencySetting = await prisma.setting.findUnique({
      where: { key: 'backup_upgrade_currency' },
    });

    const price = priceSetting ? parseFloat(priceSetting.value) : 5000;
    const currency = currencySetting?.value || 'HUF';

    // TODO: Itt kellene fizetési flow (Stripe checkout session, stb.)
    // Most egyszerűen növeljük a limitet
    // Később: Invoice létrehozása és fizetés kezelése

    // Limit növelése (+1 backup, +1 GB)
    const newBackupCountLimit = (server.backupCountLimit || 5) + 1;
    const newBackupStorageLimitGB = (server.backupStorageLimitGB || 5.0) + 1.0;

    await prisma.server.update({
      where: { id },
      data: {
        backupCountLimit: newBackupCountLimit,
        backupStorageLimitGB: newBackupStorageLimitGB,
      },
    });

    logger.info('Backup upgrade purchased', {
      serverId: id,
      userId,
      newBackupCountLimit,
      newBackupStorageLimitGB,
      price,
      currency,
    });

    // TODO: Invoice létrehozása a későbbi fizetési integrációhoz
    // const invoice = await prisma.invoice.create({
    //   data: {
    //     userId,
    //     amount: price,
    //     currency,
    //     status: 'PAID', // vagy 'PENDING' ha nincs automatikus fizetés
    //     // ...
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Backup bővítés sikeresen megvásárolva',
      newLimits: {
        backupCountLimit: newBackupCountLimit,
        backupStorageLimitGB: newBackupStorageLimitGB,
      },
      // checkoutUrl: null, // TODO: Stripe checkout URL
    });
  } catch (error: any) {
    logger.error('Backup upgrade error', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a bővítés vásárlása során' },
      { status: 500 }
    );
  }
}

