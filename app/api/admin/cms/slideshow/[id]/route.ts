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
  image: z.string().optional().nullable(),
  video: z.string().optional().nullable(),
  link: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
    z.null(),
  ]).optional().or(z.literal('')).nullable(),
  buttonText: z.string().optional().nullable(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
}).superRefine((data, ctx) => {
  // Kép validáció
  if (data.mediaType === 'image') {
    if (!data.image || data.image.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kép megadása kötelező, ha kép típusú slide',
        path: ['image'],
      });
    } else if (!data.image.startsWith('http://') && !data.image.startsWith('https://') && !data.image.startsWith('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes URL vagy fájl elérési út szükséges',
        path: ['image'],
      });
    }
  }
  
  // Videó validáció
  if (data.mediaType === 'video') {
    if (!data.video || data.video.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Videó megadása kötelező, ha videó típusú slide',
        path: ['video'],
      });
    } else if (!data.video.startsWith('http://') && !data.video.startsWith('https://') && !data.video.startsWith('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes URL vagy fájl elérési út szükséges',
        path: ['video'],
      });
    }
  }
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

    const updateData: any = {
      title: data.title || null,
      subtitle: data.subtitle || null,
      image: data.mediaType === 'image' ? (data.image || undefined) : undefined,
      video: data.mediaType === 'video' ? (data.video || undefined) : undefined,
      link: data.link || null,
      buttonText: data.buttonText || null,
      isActive: data.isActive,
      order: data.order,
      locale: data.locale,
    };
    
    // Add mediaType if it exists in the schema
    if (data.mediaType) {
      updateData.mediaType = data.mediaType;
    }
    
    const slide = await prisma.slideshowSlide.update({
      where: { id: params.id },
      data: updateData,
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

