import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, TicketPriority } from '@prisma/client';

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
    const { priority } = body;

    if (!priority || !Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json(
        { error: 'Érvénytelen prioritás' },
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

    // Prioritás frissítése
    await prisma.supportTicket.update({
      where: { id },
      data: {
        priority: priority as TicketPriority,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      priority: priority,
    });
  } catch (error) {
    console.error('Ticket priority update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a prioritás frissítése során' },
      { status: 500 }
    );
  }
}

