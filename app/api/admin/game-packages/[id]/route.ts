import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Egy csomag lekérése
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const gamePackage = await prisma.gamePackage.findUnique({
      where: { id: params.id },
    });

    if (!gamePackage) {
      return NextResponse.json(
        { error: 'Csomag nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json({ package: gamePackage });
  } catch (error: any) {
    console.error('Game package fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba a csomag lekérése során' },
      { status: 500 }
    );
  }
}

// PUT - Csomag frissítése
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      description,
      price,
      currency,
      interval,
      image,
      videoUrl,
      slot,
      cpuCores,
      ram,
      discountPrice,
      isActive,
      order,
    } = body;

    const updateData: any = {};

    if (gameType !== undefined) updateData.gameType = gameType;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (currency !== undefined) updateData.currency = currency;
    if (interval !== undefined) updateData.interval = interval;
    if (image !== undefined) updateData.image = image;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;
    if (slot !== undefined) updateData.slot = parseInt(slot);
    if (cpuCores !== undefined) updateData.cpuCores = parseInt(cpuCores);
    if (ram !== undefined) updateData.ram = parseInt(ram);
    if (discountPrice !== undefined) {
      updateData.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = parseInt(order) || 0;

    const gamePackage = await prisma.gamePackage.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ package: gamePackage });
  } catch (error: any) {
    console.error('Game package update error:', error);
    return NextResponse.json(
      { error: 'Hiba a csomag frissítése során' },
      { status: 500 }
    );
  }
}

// DELETE - Csomag törlése
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Ellenőrizzük, hogy van-e aktív előfizetés ezzel a csomaggal
    const subscriptions = await prisma.subscription.findMany({
      where: {
        // Itt kellene egy kapcsolat, de mivel nincs, csak töröljük
      },
    });

    await prisma.gamePackage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Game package delete error:', error);
    return NextResponse.json(
      { error: 'Hiba a csomag törlése során' },
      { status: 500 }
    );
  }
}

