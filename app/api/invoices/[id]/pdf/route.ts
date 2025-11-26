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
    try {
      const pdfBuffer = await generateInvoicePDF(params.id);

      if (!pdfBuffer) {
        logger.error('PDF generation returned null', new Error('PDF generation failed'), {
          invoiceId: params.id,
        });
        return NextResponse.json(
          { error: 'Hiba történt a PDF generálása során. Kérjük, ellenőrizze a számla beállításokat.' },
          { status: 500 }
        );
      }

      // Mivel jelenleg HTML-t generálunk (PDF generálás még nincs implementálva),
      // HTML-ként adjuk vissza, hogy a böngésző megjelenítse
      // TODO: Valódi PDF generálás implementálása (puppeteer vagy más library)
      const htmlString = pdfBuffer.toString('utf-8');
      
      // Ha HTML-t kaptunk (ami jelenleg a helyzet), HTML-ként adjuk vissza
      if (htmlString.trim().startsWith('<!DOCTYPE html>') || htmlString.trim().startsWith('<html')) {
        return new NextResponse(htmlString, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `inline; filename="szamla-${invoice.invoiceNumber}.html"`,
          },
        });
      }
      
      // Ha valódi PDF buffer-t kaptunk, PDF-ként adjuk vissza
      const pdfArray = new Uint8Array(pdfBuffer);
      return new NextResponse(pdfArray, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="szamla-${invoice.invoiceNumber}.pdf"`,
        },
      });
    } catch (pdfError) {
      logger.error('PDF generation error', pdfError as Error, {
        invoiceId: params.id,
      });
      return NextResponse.json(
        { 
          error: 'Hiba történt a PDF generálása során',
          details: pdfError instanceof Error ? pdfError.message : 'Ismeretlen hiba'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Get invoice PDF error', error as Error, {
      invoiceId: params.id,
    });
    return handleApiError(error);
  }
}

