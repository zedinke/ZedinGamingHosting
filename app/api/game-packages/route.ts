import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Publikus csomagok lekérése (csak aktívak)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('gameType');

    const where: any = { isActive: true };
    if (gameType) {
      where.gameType = gameType;
    }

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
    console.error('Public game packages fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba a csomagok lekérése során' },
      { status: 500 }
    );
  }
}

