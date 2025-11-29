import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { encode } from 'next-auth/jwt';

// Mobile app login - NextAuth JWT token használata
export async function POST(request: NextRequest) {
  try {
    // Debug log
    console.log('Mobile login request received');
    
    const body = await request.json();
    console.log('Request body:', { email: body.email ? 'present' : 'missing', password: body.password ? 'present' : 'missing' });
    
    const { email, password } = body;

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email és jelszó megadása kötelező', user: null },
        { status: 400 }
      );
    }

    // Felhasználó keresése
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: 'Hibás email cím vagy jelszó', user: null },
        { status: 401 }
      );
    }

    // Jelszó ellenőrzése
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Hibás email cím vagy jelszó', user: null },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Kérjük, erősítsd meg az email címedet', user: null },
        { status: 401 }
      );
    }

    // Karbantartási mód ellenőrzése
    const { isMaintenanceMode } = await import('@/lib/maintenance');
    const maintenance = await isMaintenanceMode();
    
    if (maintenance && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Jelenleg karbantartás alatt vagyunk. Csak adminisztrátorok jelentkezhetnek be.', user: null },
        { status: 403 }
      );
    }

    // NextAuth JWT token generálása (ugyanaz, mint a web bejelentkezésnél)
    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 7 * 24 * 60 * 60, // 7 nap
    });

    // Response létrehozása
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toString(), // Enum -> String konverzió
        image: user.image,
      },
      error: null, // Explicit null, hogy a deszerializálás működjön
    });

    // NextAuth session cookie beállítása (JWT strategy esetén)
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 nap
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { success: false, error: 'Hiba történt a bejelentkezés során', user: null },
      { status: 500 }
    );
  }
}

