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
  image: z.string().optional().or(z.literal('')).nullable().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: 'Érvényes URL szükséges' }
  ),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!game) {
      return NextResponse.json({ error: 'Játék nem található' }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('Game fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a játék lekérése során' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const body = await request.json();
    const data = gameSchema.parse(body);

    // Check if slug already exists (excluding current game)
    const existing = await prisma.game.findFirst({
      where: {
        slug: data.slug,
        id: { not: params.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a slug már létezik' },
        { status: 400 }
      );
    }

    const game = await prisma.game.update({
      where: { id: params.id },
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
    console.error('Game update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a játék frissítése során' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    await prisma.game.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Game delete error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a játék törlése során' },
      { status: 500 }
    );
  }
}

