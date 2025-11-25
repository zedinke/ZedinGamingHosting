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
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Érvényes hex szín szükséges').optional().nullable(),
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

    const categories = await prisma.gameCategory.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Game categories fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a kategóriák lekérése során' },
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
    const data = gameCategorySchema.parse(body);

    // Check if slug already exists
    const existing = await prisma.gameCategory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a slug már létezik' },
        { status: 400 }
      );
    }

    const category = await prisma.gameCategory.create({
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
    console.error('Game category create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a kategória létrehozása során' },
      { status: 500 }
    );
  }
}

