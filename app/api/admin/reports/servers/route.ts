import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, GameType } from '@prisma/client';

// GET - Szerver statisztikák és jelentések
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // napok száma
    const gameTypeParam = searchParams.get('gameType') || '';

    // Validáljuk és konvertáljuk a gameType-ot enum-ra
    let gameTypeFilter: GameType | undefined = undefined;
    if (gameTypeParam) {
      if (Object.values(GameType).includes(gameTypeParam as GameType)) {
        gameTypeFilter = gameTypeParam as GameType;
      } else {
        console.warn(`Invalid gameType: ${gameTypeParam}`);
      }
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Alap statisztikák
    const [
      totalServers,
      onlineServers,
      offlineServers,
      serversByGame,
      serversByStatus,
      newServers,
      serversByMachine,
    ] = await Promise.all([
      prisma.server.count(),
      prisma.server.count({ where: { status: 'ONLINE' } }),
      prisma.server.count({ where: { status: 'OFFLINE' } }),
      prisma.server.groupBy({
        by: ['gameType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        ...(gameTypeFilter ? { where: { gameType: gameTypeFilter } } : {}),
      }),
      prisma.server.groupBy({
        by: ['status'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.server.count({
        where: {
          createdAt: { gte: daysAgo },
        },
      }),
      prisma.server.groupBy({
        by: ['machineId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        where: {
          machineId: { not: null },
        },
      }),
    ]);

    // Napi szerver létrehozások (utolsó 30 nap)
    const dailyCreations = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM servers
      WHERE createdAt >= ${daysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    ` as Array<{ date: Date; count: number }>;

    // Felhasználónkénti szerver statisztikák
    const serversByUser = await prisma.server.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Felhasználó nevek lekérése
    const userIds = serversByUser.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const serversByUserWithNames = serversByUser.map((s) => {
      const user = users.find((u) => u.id === s.userId);
      return {
        userId: s.userId,
        userName: user?.name || user?.email || 'Ismeretlen',
        count: s._count.id,
      };
    });

    return NextResponse.json({
      summary: {
        total: totalServers,
        online: onlineServers,
        offline: offlineServers,
        new: newServers,
      },
      byGame: serversByGame,
      byStatus: serversByStatus,
      byMachine: serversByMachine.length,
      dailyCreations,
      topUsers: serversByUserWithNames,
      period: parseInt(period),
    });
  } catch (error) {
    console.error('Server reports error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a jelentések generálása során' },
      { status: 500 }
    );
  }
}

