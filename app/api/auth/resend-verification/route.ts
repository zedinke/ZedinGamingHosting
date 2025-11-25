import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale = 'hu' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email cím megadása kötelező' },
        { status: 400 }
      );
    }

    // Felhasználó keresése
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      );
    }

    // Ha már megerősítve van
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Ez az email cím már meg van erősítve' },
        { status: 400 }
      );
    }

    // Régi tokenek törlése
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Új token generálása
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Verifikációs email küldése
    await sendVerificationEmail(email, token, locale);

    return NextResponse.json({
      success: true,
      message: 'Verifikációs email elküldve',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az email küldése során' },
      { status: 500 }
    );
  }
}

