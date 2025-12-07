import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const pageSchema = z.object({
  slug: z.string().min(1, 'Slug megadása kötelező'),
  title: z.string().min(1, 'Cím megadása kötelező'),
  content: z.any(),
  isPublished: z.boolean(),
  locale: z.enum(['hu', 'en', 'es']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
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
    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      return NextResponse.json({ error: 'Oldal nem található' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Page fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az oldal lekérése során' },
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

    const { id } = await params;
    const body = await request.json();
    const data = pageSchema.parse(body);

    // Check if slug+locale combination already exists (excluding current page)
    const existing = await prisma.page.findFirst({
      where: {
        slug: data.slug,
        locale: data.locale,
        id: { not: id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a slug már létezik ezen a nyelven' },
        { status: 400 }
      );
    }

    const page = await prisma.page.update({
      where: { id },
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
    console.error('Page update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az oldal frissítése során' },
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

    const { id } = await params;
    await prisma.page.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Page delete error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az oldal törlése során' },
      { status: 500 }
    );
  }
}

