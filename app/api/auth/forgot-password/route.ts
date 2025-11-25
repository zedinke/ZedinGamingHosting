import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
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

    // Biztonsági okokból nem mondjuk el, ha nincs ilyen felhasználó
    // De csak akkor küldünk emailt, ha létezik
    if (!user) {
      // Ugyanazt a választ adjuk, mintha létezne
      return NextResponse.json({
        success: true,
        message: 'Ha ez az email cím regisztrálva van, akkor elküldtük a jelszó visszaállítási linket.',
      });
    }

    // Régi tokenek törlése
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Új token generálása
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 óra érvényesség

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    // Jelszó visszaállítási email küldése
    await sendPasswordResetEmail(email, token, locale);

    return NextResponse.json({
      success: true,
      message: 'Ha ez az email cím regisztrálva van, akkor elküldtük a jelszó visszaállítási linket.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a jelszó visszaállítási email küldése során' },
      { status: 500 }
    );
  }
}

