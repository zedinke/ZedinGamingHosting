import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const gameCategorySchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  slug: z.string().min(1, 'Slug megadása kötelező'),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable().refine(
    (val) => !val || val === null || /^#[0-9A-F]{6}$/i.test(val),
    { message: 'Érvényes hex szín szükséges (pl: #4F46E5)' }
  ),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const { id } = await params;
    const category = await prisma.gameCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Kategória nem található' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Game category fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a kategória lekérése során' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const body = await request.json();
    const data = gameCategorySchema.parse(body);

    // Check if slug already exists (excluding current category)
    const existing = await prisma.gameCategory.findFirst({
      where: {
        slug: data.slug,
        id: { not: id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a slug már létezik' },
        { status: 400 }
      );
    }

    const category = await prisma.gameCategory.update({
      where: { id: id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        isActive: data.isActive,
        order: data.order,
        locale: data.locale,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Game category update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a kategória frissítése során' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    await prisma.gameCategory.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Game category delete error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a kategória törlése során' },
      { status: 500 }
    );
  }
}

