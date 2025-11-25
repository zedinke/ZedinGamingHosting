import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verifikációs token hiányzik' },
        { status: 400 }
      );
    }

    // Token keresése
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Érvénytelen verifikációs token' },
        { status: 400 }
      );
    }

    // Token lejárat ellenőrzése
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: 'A verifikációs token lejárt' },
        { status: 400 }
      );
    }

    // Felhasználó megerősítése
    const user = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Token törlése
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message: 'Email cím sikeresen megerősítve',
      userId: user.id,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a verifikáció során' },
      { status: 500 }
    );
  }
}

