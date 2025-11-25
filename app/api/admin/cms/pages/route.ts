import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const pageSchema = z.object({
  slug: z.string().min(1, 'Slug megadása kötelező'),
  title: z.string().min(1, 'Cím megadása kötelező'),
  content: z.any(), // JSON content
  isPublished: z.boolean(),
  locale: z.enum(['hu', 'en']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Pages fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az oldalak lekérése során' },
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
    const data = pageSchema.parse(body);

    // Check if slug+locale combination already exists
    const existing = await prisma.page.findFirst({
      where: {
        slug: data.slug,
        locale: data.locale,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a slug már létezik ezen a nyelven' },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content,
        isPublished: data.isPublished,
        locale: data.locale,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      },
    });

    return NextResponse.json(page);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Page create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az oldal létrehozása során' },
      { status: 500 }
    );
  }
}

