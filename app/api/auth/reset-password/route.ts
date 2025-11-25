import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token és jelszó megadása kötelező' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A jelszónak legalább 8 karakter hosszúnak kell lennie' },
        { status: 400 }
      );
    }

    // Token keresése
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Érvénytelen token' },
        { status: 400 }
      );
    }

    // Token lejárat ellenőrzése
    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: 'A token lejárt' },
        { status: 400 }
      );
    }

    // Jelszó hashelése
    const hashedPassword = await bcrypt.hash(password, 10);

    // Felhasználó jelszavának frissítése
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Token törlése
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message: 'Jelszó sikeresen megváltoztatva',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a jelszó megváltoztatása során' },
      { status: 500 }
    );
  }
}

