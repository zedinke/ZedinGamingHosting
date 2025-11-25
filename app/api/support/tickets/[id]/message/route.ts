import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Üzenet tartalma kötelező' },
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

    // Ellenőrizzük, hogy a felhasználó a ticket tulajdonosa
    if (ticket.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Üzenet létrehozása
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: (session.user as any).id,
        content: content.trim(),
        isAdmin: false,
      },
    });

    // Ticket státusz frissítése
    if (ticket.status === 'WAITING_FOR_USER') {
      await prisma.supportTicket.update({
        where: { id },
        data: {
          status: 'OPEN',
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.supportTicket.update({
        where: { id },
        data: {
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        isAdmin: message.isAdmin,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Ticket message error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az üzenet küldése során' },
      { status: 500 }
    );
  }
}

