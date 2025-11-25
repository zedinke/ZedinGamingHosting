import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const homepageSectionSchema = z.object({
  type: z.enum(['hero', 'features', 'stats', 'cta', 'slideshow']),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.any().optional(),
  image: z.string().url().optional().or(z.literal('')),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
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

    const section = await prisma.homepageSection.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const body = await request.json();
    const data = homepageSectionSchema.parse(body);

    const section = await prisma.homepageSection.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    await prisma.homepageSection.delete({
      where: { id: params.id },
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

