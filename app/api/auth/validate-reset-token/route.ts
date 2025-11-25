import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token hiányzik' },
        { status: 400 }
      );
    }

    // Token keresése
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        error: 'Érvénytelen token',
      });
    }

    // Token lejárat ellenőrzése
    if (resetToken.expires < new Date()) {
      // Lejárt token törlése
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return NextResponse.json({
        valid: false,
        error: 'A token lejárt',
      });
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email,
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    return NextResponse.json(
      { valid: false, error: 'Hiba történt a token ellenőrzése során' },
      { status: 500 }
    );
  }
}

