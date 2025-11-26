import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { triggerAutoInstallOnPayment } from '@/lib/auto-install-on-payment';

// POST - Automatikus telepítés triggerelése
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

    const server = await prisma.server.findUnique({
      where: { id: params.id },
      include: {
        subscription: {
          include: {
            invoices: {
              where: {
                status: 'PAID',
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Ellenőrizzük, hogy van-e fizetett számla
    const hasPaidInvoice = server.subscription?.invoices && server.subscription.invoices.length > 0;
    
    if (!hasPaidInvoice) {
      return NextResponse.json(
        { error: 'Nincs fizetett számla a szerverhez' },
        { status: 400 }
      );
    }

    // Automatikus telepítés triggerelése
    const result = await triggerAutoInstallOnPayment(
      server.id,
      server.subscription.invoices[0]?.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a szerver telepítés indítása során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Szerver telepítés sikeresen elindítva',
    });
  } catch (error: any) {
    console.error('Trigger install error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a szerver telepítés indítása során' },
      { status: 500 }
    );
  }
}

