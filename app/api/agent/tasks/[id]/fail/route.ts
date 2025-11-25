import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-key';

// POST - Feladat sikertelenség jelzése
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { error: errorMessage } = body;

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

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Érvénytelen API key' },
        { status: 401 }
      );
    }

    // Feladat keresése
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        agent: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Feladat nem található' },
        { status: 404 }
      );
    }

    // Ellenőrizzük, hogy az agent jogosult-e erre a feladatra
    // validation.agentId az Agent.agentId (egyedi azonosító)
    // task.agentId az Agent.id (Prisma primary key)
    // Ezért lekérdezzük az Agent-et az agentId alapján
    if (validation.agentId && task.agent) {
      const agent = await prisma.agent.findUnique({
        where: { agentId: validation.agentId },
        select: { id: true },
      });
      
      if (!agent || task.agentId !== agent.id) {
        return NextResponse.json(
          { error: 'Nincs jogosultság ehhez a feladathoz' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Nincs jogosultság ehhez a feladathoz' },
        { status: 403 }
      );
    }

    // Feladat frissítése
    await prisma.task.update({
      where: { id },
      data: {
        status: 'FAILED',
        error: errorMessage || 'Ismeretlen hiba',
        completedAt: new Date(),
      },
    });

    // Ha van szerver, státusz frissítése ERROR-ra
    if (task.serverId) {
      await prisma.server.update({
        where: { id: task.serverId },
        data: { status: 'ERROR' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Feladat sikertelenség jelölve',
    });
  } catch (error: any) {
    console.error('Fail task error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a feladat jelölése során' },
      { status: 500 }
    );
  }
}

