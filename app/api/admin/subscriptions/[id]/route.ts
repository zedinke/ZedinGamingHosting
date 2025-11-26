import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, SubscriptionStatus } from '@prisma/client';

// GET - Előfizetés részletei
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

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        server: {
          select: {
            id: true,
            name: true,
            gameType: true,
            status: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Előfizetés nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az előfizetés lekérdezése során' },
      { status: 500 }
    );
  }
}

// PATCH - Előfizetés frissítése
export async function PATCH(
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

    const body = await request.json();
    const { status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status as SubscriptionStatus;
    }

    if (currentPeriodStart) {
      updateData.currentPeriodStart = new Date(currentPeriodStart);
    }

    if (currentPeriodEnd) {
      updateData.currentPeriodEnd = new Date(currentPeriodEnd);
    }

    if (cancelAtPeriodEnd !== undefined) {
      updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }

    const subscription = await prisma.subscription.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        server: {
          select: {
            id: true,
            name: true,
            gameType: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az előfizetés frissítése során' },
      { status: 500 }
    );
  }
}

