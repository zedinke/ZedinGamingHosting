import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const slideshowSlideSchema = z.object({
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  image: z.string().url('Érvényes URL szükséges').or(z.literal('')),
  link: z.string().url().optional().or(z.literal('')).nullable(),
  buttonText: z.string().optional().nullable(),
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

    const slides = await prisma.slideshowSlide.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(slides);
  } catch (error) {
    console.error('Slideshow slides fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a slide-ok lekérése során' },
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
    const data = slideshowSlideSchema.parse(body);

    const slide = await prisma.slideshowSlide.create({
      data: {
        title: data.title || null,
        subtitle: data.subtitle || null,
        image: data.image,
        link: data.link || null,
        buttonText: data.buttonText || null,
        isActive: data.isActive,
        order: data.order,
        locale: data.locale,
      },
    });

    return NextResponse.json(slide);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Slideshow slide create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a slide létrehozása során' },
      { status: 500 }
    );
  }
}

