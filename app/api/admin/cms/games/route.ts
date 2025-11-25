import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const gameSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  slug: z.string().min(1, 'Slug megadása kötelező'),
  description: z.string().optional().nullable(),
  image: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
    z.null(),
  ]).optional(),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const games = await prisma.game.findMany({
      include: { category: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Games fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a játékok lekérése során' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const body = await request.json();
    const data = gameSchema.parse(body);

    // Check if slug already exists
    const existing = await prisma.game.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a slug már létezik' },
        { status: 400 }
      );
    }

    const game = await prisma.game.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image: data.image || null,
        categoryId: data.categoryId || null,
        isActive: data.isActive,
        order: data.order,
        locale: data.locale,
      },
      include: { category: true },
    });

    return NextResponse.json(game);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Game create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a játék létrehozása során' },
      { status: 500 }
    );
  }
}

