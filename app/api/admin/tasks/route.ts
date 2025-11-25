import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Feladatok listája
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const agentId = searchParams.get('agentId');
    const serverId = searchParams.get('serverId');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (agentId) {
      where.agentId = agentId;
    }
    if (serverId) {
      where.serverId = serverId;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
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
          server: {
            select: {
              id: true,
              name: true,
              gameType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Tasks list error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a feladatok lekérdezése során' },
      { status: 500 }
    );
  }
}

