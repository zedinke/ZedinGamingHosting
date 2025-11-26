import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, InvoiceStatus } from '@prisma/client';
import { triggerAutoInstallOnPayment } from '@/lib/auto-install-on-payment';

// PATCH - Számla frissítése
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
    const { status } = body;

    // Számla lekérdezése a régi státusszal
    const oldInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        subscription: {
          include: {
            server: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!oldInvoice) {
      return NextResponse.json(
        { error: 'Számla nem található' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status as InvoiceStatus;
      
      // Ha PAID-re változtatjuk, beállítjuk a paidAt dátumot
      if (status === 'PAID' && !oldInvoice.paidAt) {
        updateData.paidAt = new Date();
      }
      
      // Ha nem PAID, töröljük a paidAt dátumot
      if (status !== 'PAID' && oldInvoice.paidAt) {
        updateData.paidAt = null;
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        subscription: {
          include: {
            server: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Ha a státusz PAID-re változott és van szerver, triggereljük az automatikus telepítést
    if (status === 'PAID' && oldInvoice.status !== 'PAID' && invoice.subscription?.server?.id) {
      // Háttérben triggereljük az automatikus telepítést
      const serverId = invoice.subscription.server.id;
      if (serverId) {
        triggerAutoInstallOnPayment(serverId, invoice.id).catch((error) => {
          console.error('Auto-install trigger error:', error);
          // Nem dobunk hibát, mert a számla frissítése sikeres volt
        });
      }
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a számla frissítése során' },
      { status: 500 }
    );
  }
}

