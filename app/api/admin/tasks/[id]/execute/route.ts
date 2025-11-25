import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeTask } from '@/lib/task-executor';

// POST - Feladat végrehajtása
export async function POST(
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

    const { id } = params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Feladat nem található' },
        { status: 404 }
      );
    }

    if (task.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Csak PENDING státuszú feladat hajtható végre' },
        { status: 400 }
      );
    }

    // Feladat végrehajtása háttérben
    executeTask(id).catch((error) => {
      console.error(`Task ${id} végrehajtási hiba:`, error);
    });

    return NextResponse.json({
      success: true,
      message: 'Feladat végrehajtása elindítva',
    });
  } catch (error: any) {
    console.error('Task execute error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a feladat végrehajtása során' },
      { status: 500 }
    );
  }
}

