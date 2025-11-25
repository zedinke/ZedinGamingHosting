import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Számla nem található' }, { status: 404 });
    }

    // Send invoice email
    try {
      await sendInvoiceEmail(invoice.user.email, invoice);
    } catch (emailError) {
      console.error('Invoice email error:', emailError);
      return NextResponse.json(
        { error: 'Hiba történt az email küldése során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Számla sikeresen elküldve',
    });
  } catch (error) {
    console.error('Invoice resend error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a számla újraküldése során' },
      { status: 500 }
    );
  }
}

