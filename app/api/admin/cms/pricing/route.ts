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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const plans = await prisma.pricingPlan.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Pricing plans fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az árazási csomagok lekérése során' },
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
    const data = pricingPlanSchema.parse(body);

    // Check if name already exists
    const existing = await prisma.pricingPlan.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez a név már létezik' },
        { status: 400 }
      );
    }

    const plan = await prisma.pricingPlan.create({
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
    console.error('Pricing plan create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az árazási csomag létrehozása során' },
      { status: 500 }
    );
  }
}

