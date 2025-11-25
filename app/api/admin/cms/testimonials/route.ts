import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const testimonialSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  role: z.string().optional(),
  content: z.string().min(1, 'Tartalom megadása kötelező'),
  avatar: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(1).max(5),
  locale: z.enum(['hu', 'en']),
  isActive: z.boolean(),
  order: z.number().int().min(0),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const testimonials = await prisma.testimonial.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error('Testimonials fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a vélemények lekérése során' },
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
    const data = testimonialSchema.parse(body);

    const testimonial = await prisma.testimonial.create({
      data: {
        name: data.name,
        role: data.role || null,
        content: data.content,
        avatar: data.avatar || null,
        rating: data.rating,
        locale: data.locale,
        isActive: data.isActive,
        order: data.order,
      },
    });

    return NextResponse.json(testimonial);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Testimonial create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a vélemény létrehozása során' },
      { status: 500 }
    );
  }
}

