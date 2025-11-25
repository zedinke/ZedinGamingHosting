import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Agentek listája
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
    const machineId = searchParams.get('machineId');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (machineId) {
      where.machineId = machineId;
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          machine: {
            select: {
              id: true,
              name: true,
              ipAddress: true,
            },
          },
          _count: {
            select: {
              servers: true,
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agent.count({ where }),
    ]);

    return NextResponse.json({
      agents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Agents list error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az agentek lekérdezése során' },
      { status: 500 }
    );
  }
}

