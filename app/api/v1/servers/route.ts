import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * API v1 - Szerverek listázása
 * GET /api/v1/servers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const gameType = searchParams.get('gameType');
    const status = searchParams.get('status');

    const where: any = {};

    // Ha nem admin, csak saját szervereit láthatja
    if ((session.user as any).role !== 'ADMIN') {
      where.userId = (session.user as any).id;
    } else if (userId) {
      where.userId = userId;
    }

    if (gameType) {
      where.gameType = gameType;
    }

    if (status) {
      where.status = status;
    }

    const servers = await prisma.server.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        agent: {
          include: {
            machine: {
              select: {
                id: true,
                name: true,
                ipAddress: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: servers,
      count: servers.length,
    });
  } catch (error) {
    console.error('API v1 servers error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szerverek lekérdezése során' },
      { status: 500 }
    );
  }
}

