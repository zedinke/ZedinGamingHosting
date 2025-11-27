import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const homepageSectionSchema = z.object({
  type: z.enum(['hero', 'features', 'stats', 'cta', 'slideshow']),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  content: z.any().optional().nullable(),
  image: z.string().optional().or(z.literal('')).nullable().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: 'Érvényes URL szükséges' }
  ),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().optional().or(z.literal('')).nullable().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: 'Érvényes URL szükséges' }
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
    const section = await prisma.homepageSection.findUnique({
      where: { id },
    });

    if (!section) {
      return NextResponse.json({ error: 'Szekció nem található' }, { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error('Homepage section fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szekció lekérése során' },
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
    const data = homepageSectionSchema.parse(body);

    const section = await prisma.homepageSection.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title || null,
        subtitle: data.subtitle || null,
        content: data.content || null,
        image: data.image || null,
        buttonText: data.buttonText || null,
        buttonLink: data.buttonLink || null,
        isActive: data.isActive,
        order: data.order,
        locale: data.locale,
      },
    });

    return NextResponse.json(section);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Homepage section update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szekció frissítése során' },
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
    await prisma.homepageSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Homepage section delete error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szekció törlése során' },
      { status: 500 }
    );
  }
}

