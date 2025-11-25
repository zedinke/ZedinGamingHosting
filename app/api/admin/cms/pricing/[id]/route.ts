import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const pricingPlanSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  description: z.string().optional(),
  price: z.number().min(0, 'Az ár nem lehet negatív'),
  currency: z.string().min(1, 'Pénznem megadása kötelező'),
  interval: z.enum(['month', 'year']),
  stripePriceId: z.string().optional(),
  features: z.array(z.string()),
  isActive: z.boolean(),
  order: z.number().int().min(0),
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

    const plan = await prisma.pricingPlan.findUnique({
      where: { id: params.id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Árazási csomag nem található' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Pricing plan fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az árazási csomag lekérése során' },
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
    const data = pricingPlanSchema.parse(body);

    // Check if name already exists (excluding current plan)
    const existing = await prisma.pricingPlan.findFirst({
      where: {
        name: data.name,
        id: { not: params.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a név már létezik' },
        { status: 400 }
      );
    }

    const plan = await prisma.pricingPlan.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        currency: data.currency,
        interval: data.interval,
        stripePriceId: data.stripePriceId || null,
        features: data.features,
        isActive: data.isActive,
        order: data.order,
      },
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Pricing plan update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az árazási csomag frissítése során' },
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

    await prisma.pricingPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pricing plan delete error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az árazási csomag törlése során' },
      { status: 500 }
    );
  }
}

