import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-key';

// GET - Feladatok lekérdezése egy agent számára
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status') || 'PENDING';

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId szükséges' },
        { status: 400 }
      );
    }

    // API key autentikáció
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'API key szükséges' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const validation = await validateApiKey(apiKey);

    if (!validation.valid || validation.agentId !== agentId) {
      return NextResponse.json(
        { error: 'Érvénytelen API key' },
        { status: 401 }
      );
    }

    // Feladatok lekérdezése
    // validation.agentId az Agent.agentId (egyedi azonosító)
    // task.agentId az Agent.id (Prisma primary key)
    // Ezért lekérdezzük az Agent-et az agentId alapján
    const agent = await prisma.agent.findUnique({
      where: { agentId: validation.agentId! },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent nem található' },
        { status: 404 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        agentId: agent.id,
        status: status as any,
      },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            gameType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10, // Maximum 10 feladat egyszerre
    });

    return NextResponse.json({
      success: true,
      tasks: tasks.map((task) => ({
        id: task.id,
        type: task.type,
        status: task.status,
        command: task.command,
        server: task.server,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a feladatok lekérdezése során' },
      { status: 500 }
    );
  }
}

