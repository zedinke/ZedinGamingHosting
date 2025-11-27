import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, SubscriptionStatus } from '@prisma/client';

// POST - Előfizetés státusz módosítása
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
    const { status } = body;

    if (!status || !Object.values(SubscriptionStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Érvénytelen státusz' },
        { status: 400 }
      );
    }

    // Előfizetés keresése
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        server: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Előfizetés nem található' },
        { status: 404 }
      );
    }

    // Státusz frissítése
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: status as SubscriptionStatus,
        updatedAt: new Date(),
      },
    });

    // Ha ACTIVE-re állítjuk, beállítjuk a periódusokat is (ha nincsenek)
    if (status === 'ACTIVE' && (!subscription.currentPeriodStart || !subscription.currentPeriodEnd)) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 hónap

      await prisma.subscription.update({
        where: { id },
        data: {
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      },
    });
  } catch (error) {
    console.error('Subscription status update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a státusz frissítése során' },
      { status: 500 }
    );
  }
}

