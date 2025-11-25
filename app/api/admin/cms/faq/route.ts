import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const faqSchema = z.object({
  question: z.string().min(1, 'Kérdés megadása kötelező'),
  answer: z.string().min(1, 'Válasz megadása kötelező'),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
  isActive: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const faqs = await prisma.fAQ.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(faqs);
  } catch (error) {
    console.error('FAQs fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a FAQ-k lekérése során' },
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
    const data = faqSchema.parse(body);

    const faq = await prisma.fAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        order: data.order,
        locale: data.locale,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(faq);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('FAQ create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a FAQ létrehozása során' },
      { status: 500 }
    );
  }
}

