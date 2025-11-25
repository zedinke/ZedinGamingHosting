import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const slideshowSlideSchema = z.object({
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  mediaType: z.enum(['image', 'video']).default('image'),
  image: z.string().optional().nullable().refine(
    (val, ctx) => {
      const mediaType = (ctx as any).parent?.mediaType;
      if (mediaType === 'image') {
        if (!val || val.trim() === '') {
          return false;
        }
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      }
      return true;
    },
    { message: 'Kép megadása kötelező, ha kép típusú slide' }
  ),
  video: z.string().optional().nullable().refine(
    (val, ctx) => {
      const mediaType = (ctx as any).parent?.mediaType;
      if (mediaType === 'video') {
        if (!val || val.trim() === '') {
          return false;
        }
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      }
      return true;
    },
    { message: 'Videó megadása kötelező, ha videó típusú slide' }
  ),
  link: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
    z.null(),
  ]).optional().or(z.literal('')).nullable(),
  buttonText: z.string().optional().nullable(),
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

    const slide = await prisma.slideshowSlide.findUnique({
      where: { id: params.id },
    });

    if (!slide) {
      return NextResponse.json({ error: 'Slide nem található' }, { status: 404 });
    }

    return NextResponse.json(slide);
  } catch (error) {
    console.error('Slideshow slide fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a slide lekérése során' },
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
    const data = slideshowSlideSchema.parse(body);

    const slide = await prisma.slideshowSlide.update({
      where: { id: params.id },
      data: {
        title: data.title || null,
        subtitle: data.subtitle || null,
        mediaType: data.mediaType || 'image',
        image: data.mediaType === 'image' ? (data.image || null) : null,
        video: data.mediaType === 'video' ? (data.video || null) : null,
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
    console.error('Slideshow slide update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a slide frissítése során' },
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

    await prisma.slideshowSlide.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slideshow slide delete error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a slide törlése során' },
      { status: 500 }
    );
  }
}

