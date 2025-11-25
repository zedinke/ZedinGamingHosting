import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
    const { currentPassword, newPassword } = body;

    // Validáció
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Jelenlegi és új jelszó megadása kötelező' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Az új jelszónak legalább 8 karakter hosszúnak kell lennie' },
        { status: 400 }
      );
    }

    // Felhasználó lekérése
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      );
    }

    // Jelenlegi jelszó ellenőrzése
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Hibás jelenlegi jelszó' },
        { status: 400 }
      );
    }

    // Új jelszó hashelése
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Jelszó frissítése
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Jelszó sikeresen megváltoztatva',
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a jelszó megváltoztatása során' },
      { status: 500 }
    );
  }
}

