import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, createUnauthorizedError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      throw createUnauthorizedError('Bejelentkezés szükséges');
    }

    // Legutóbbi számla számlázási adatainak lekérése
    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        userId: (session.user as any).id,
        billingName: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        billingName: true,
        billingAddress: true,
        billingTaxNumber: true,
        companyName: true,
        companyAddress: true,
        companyTaxNumber: true,
        companyVatNumber: true,
      },
    });

    return NextResponse.json({
      billingInfo: latestInvoice ? {
        billingName: latestInvoice.billingName || '',
        billingAddress: latestInvoice.billingAddress || '',
        billingTaxNumber: latestInvoice.billingTaxNumber || '',
        companyName: latestInvoice.companyName || '',
        companyAddress: latestInvoice.companyAddress || '',
        companyTaxNumber: latestInvoice.companyTaxNumber || '',
        companyVatNumber: latestInvoice.companyVatNumber || '',
      } : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

