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
      },
    });

    // Ha van számla, próbáljuk kinyerni az adatokat a címből
    let parsedData: any = null;
    if (latestInvoice && latestInvoice.billingAddress) {
      // Próbáljuk meg kinyerni az adatokat a címből (formátum: "utca, város irányítószám, ország")
      const addressParts = latestInvoice.billingAddress.split(',');
      if (addressParts.length >= 3) {
        const street = addressParts[0].trim();
        const cityPostal = addressParts[1].trim().split(' ');
        const postalCode = cityPostal[cityPostal.length - 1];
        const city = cityPostal.slice(0, -1).join(' ');
        const country = addressParts[2].trim();
        
        parsedData = {
          billingName: latestInvoice.billingName || '',
          email: '', // Email nincs a számlában, a user adatból kell venni
          phone: '', // Telefon nincs a számlában
          country: country || 'Magyarország',
          postalCode: postalCode || '',
          city: city || '',
          street: street || '',
          billingAddress: latestInvoice.billingAddress || '',
        };
      } else {
        parsedData = {
          billingName: latestInvoice.billingName || '',
          email: '',
          phone: '',
          country: 'Magyarország',
          postalCode: '',
          city: '',
          street: '',
          billingAddress: latestInvoice.billingAddress || '',
        };
      }
    }

    // Ha van user email, használjuk azt
    if (parsedData && !parsedData.email) {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { email: true },
      });
      if (user) {
        parsedData.email = user.email;
      }
    }

    return NextResponse.json({
      billingInfo: parsedData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

