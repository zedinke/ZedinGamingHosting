import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, TicketStatus } from '@prisma/client';

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

    if (!status || !Object.values(TicketStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Érvénytelen státusz' },
        { status: 400 }
      );
    }

    // Ticket keresése
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket nem található' },
        { status: 404 }
      );
    }

    // Státusz frissítése
    const updateData: any = {
      status: status as TicketStatus,
      updatedAt: new Date(),
    };

    if (status === 'CLOSED' && !ticket.closedAt) {
      updateData.closedAt = new Date();
    } else if (status !== 'CLOSED') {
      updateData.closedAt = null;
    }

    await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      status: status,
    });
  } catch (error) {
    console.error('Ticket status update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a státusz frissítése során' },
      { status: 500 }
    );
  }
}

