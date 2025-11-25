import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, locale = 'hu' } = body;

    // Validáció
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Minden mező kitöltése kötelező' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A jelszónak legalább 8 karakter hosszúnak kell lennie' },
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy létezik-e már ilyen email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ez az email cím már regisztrálva van' },
        { status: 400 }
      );
    }

    // Jelszó hashelése
    const hashedPassword = await bcrypt.hash(password, 10);

    // Felhasználó létrehozása
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null, // Még nincs megerősítve
      },
    });

    // Verifikációs token generálása
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 óra érvényesség

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
      message: 'Regisztráció sikeres. Kérjük, ellenőrizd az email fiókodat.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a regisztráció során' },
      { status: 500 }
    );
  }
}

