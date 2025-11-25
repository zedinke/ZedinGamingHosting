import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    // Validáció
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Név és email megadása kötelező' },
        { status: 400 }
      );
    }

    // Email ellenőrzés (ha változott)
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (user?.email !== email) {
      // Ellenőrizzük, hogy az új email már foglalt-e
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Ez az email cím már foglalt' },
          { status: 400 }
        );
      }

      // Email változás esetén újra kell verifikálni
      await prisma.user.update({
        where: { id: (session.user as any).id },
        data: {
          name,
          email,
          emailVerified: null,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: (session.user as any).id },
        data: { name },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil sikeresen frissítve',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a profil frissítése során' },
      { status: 500 }
    );
  }
}

