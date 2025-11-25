import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TicketCategory, TicketPriority } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, category, priority, message } = body;

    // Validáció
    if (!subject || !category || !priority || !message) {
      return NextResponse.json(
        { error: 'Minden mező kitöltése kötelező' },
        { status: 400 }
      );
    }

    // Ticket létrehozása
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: (session.user as any).id,
        subject,
        category: category as TicketCategory,
        priority: priority as TicketPriority,
        status: 'OPEN',
      },
    });

    // Első üzenet létrehozása
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: (session.user as any).id,
        content: message,
        isAdmin: false,
      },
    });

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      message: 'Ticket sikeresen létrehozva',
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a ticket létrehozása során' },
      { status: 500 }
    );
  }
}

