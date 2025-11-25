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
  image: z.string().url().optional().or(z.literal('')).nullable(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().url().optional().or(z.literal('')).nullable(),
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

    const sections = await prisma.homepageSection.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Homepage sections fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szekciók lekérése során' },
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
    const data = homepageSectionSchema.parse(body);

    const section = await prisma.homepageSection.create({
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
    console.error('Homepage section create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szekció létrehozása során' },
      { status: 500 }
    );
  }
}

