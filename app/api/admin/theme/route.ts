import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const themeSettingsSchema = z.record(z.any());

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const themeSettings = await prisma.themeSetting.findMany();
    const themeMap: Record<string, any> = {};
    themeSettings.forEach((setting) => {
      themeMap[setting.key] = setting.value;
    });

    return NextResponse.json(themeMap);
  } catch (error) {
    console.error('Theme settings fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a téma beállítások lekérése során' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const body = await request.json();
    const data = themeSettingsSchema.parse(body);

    // Update or create each setting
    const updates = Object.entries(data).map(([key, value]) =>
      prisma.themeSetting.upsert({
        where: { key },
        update: { value: value as any },
        create: {
          key,
          value: value as any,
        },
      })
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Theme settings update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a téma beállítások frissítése során' },
      { status: 500 }
    );
  }
}

