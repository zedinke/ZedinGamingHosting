import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { handleApiError, createUnauthorizedError, createNotFoundError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// GET - Számla PDF letöltése
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      throw createUnauthorizedError('Bejelentkezés szükséges');
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!invoice) {
      throw createNotFoundError('Számla', params.id);
    }

    // Ellenőrizzük, hogy a felhasználó hozzáfér-e a számlához
    const isAdmin = (session.user as any).role === 'ADMIN';
    const isOwner = invoice.userId === (session.user as any).id;

    if (!isAdmin && !isOwner) {
      throw createUnauthorizedError('Nincs jogosultság a számla megtekintéséhez');
    }

    // PDF generálása
    const pdfBuffer = await generateInvoicePDF(params.id);

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'Hiba történt a PDF generálása során' },
        { status: 500 }
      );
    }

    // PDF válasz küldése
    // Buffer konvertálása Uint8Array-re a NextResponse kompatibilitáshoz
    const pdfArray = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfArray, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="szamla-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Get invoice PDF error', error as Error, {
      invoiceId: params.id,
    });
    return handleApiError(error);
  }
}

