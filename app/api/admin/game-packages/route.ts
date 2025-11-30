import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Összes csomag lekérése
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('gameType');

    const where = gameType ? { gameType: gameType as any } : {};

    const packages = await prisma.gamePackage.findMany({
      where,
      orderBy: [
        { gameType: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ packages });
  } catch (error: any) {
    console.error('Game packages fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba a csomagok lekérése során' },
      { status: 500 }
    );
  }
}

// POST - Új csomag létrehozása
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      gameType,
      name,
      nameHu,
      nameEn,
      description,
      descriptionHu,
      descriptionEn,
      price,
      currency = 'HUF',
      interval = 'month',
      image,
      videoUrl,
      slot,
      unlimitedSlot = false,
      cpuCores,
      ram,
      unlimitedRam = false,
      discountPrice,
      pricePerSlot,
      isActive = true,
      order = 0,
    } = body;

    // Validáció
    if (!gameType || !price || !cpuCores) {
      return NextResponse.json(
        { error: 'Minden kötelező mező kitöltése szükséges' },
        { status: 400 }
      );
    }

    // Ha nincs korlátlan slot, akkor slot kötelező
    if (!unlimitedSlot && (!slot || slot < 1)) {
      return NextResponse.json(
        { error: 'Slot szám megadása kötelező, ha nincs korlátlan slot' },
        { status: 400 }
      );
    }

    // Ha nincs korlátlan RAM, akkor ram kötelező
    if (!unlimitedRam && (!ram || ram < 1)) {
      return NextResponse.json(
        { error: 'RAM mennyiség megadása kötelező, ha nincs korlátlan RAM' },
        { status: 400 }
      );
    }

    // Név validáció - nameHu és nameEn kötelező
    if (!nameHu || !nameEn) {
      return NextResponse.json(
        { error: 'Magyar és angol név megadása kötelező' },
        { status: 400 }
      );
    }

    const gamePackage = await prisma.gamePackage.create({
      data: {
        gameType: gameType as any,
        name: nameHu, // Backward compatibility
        nameHu,
        nameEn,
        description: descriptionHu || description || null, // Backward compatibility
        descriptionHu: descriptionHu || null,
        descriptionEn: descriptionEn || null,
        price: parseFloat(price),
        currency,
        interval,
        image,
        videoUrl: videoUrl || null,
        slot: unlimitedSlot ? null : parseInt(slot),
        unlimitedSlot: Boolean(unlimitedSlot),
        cpuCores: parseInt(cpuCores),
        ram: unlimitedRam ? 0 : parseInt(ram), // Ha korlátlan RAM, akkor 0
        unlimitedRam: Boolean(unlimitedRam),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        pricePerSlot: pricePerSlot ? parseFloat(pricePerSlot) : null,
        isActive,
        order: parseInt(order) || 0,
      },
    });

    return NextResponse.json({ package: gamePackage });
  } catch (error: any) {
    console.error('Game package create error:', error);
    return NextResponse.json(
      { error: 'Hiba a csomag létrehozása során' },
      { status: 500 }
    );
  }
}

