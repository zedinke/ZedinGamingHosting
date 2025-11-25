import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Konzol logok lekérése
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

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const lines = parseInt(searchParams.get('lines') || '100');

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    // TODO: Valós implementációban itt kellene SSH-n keresztül lekérdezni a konzol logokat
    // Jelenleg csak egy mock választ adunk vissza
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Server started successfully',
      },
      {
        timestamp: new Date(Date.now() - 1000).toISOString(),
        level: 'INFO',
        message: 'Loading world...',
      },
      {
        timestamp: new Date(Date.now() - 2000).toISOString(),
        level: 'WARN',
        message: 'Low memory warning',
      },
    ];

    return NextResponse.json({
      logs,
      server: {
        id: server.id,
        name: server.name,
      },
    });
  } catch (error) {
    console.error('Console logs error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a konzol logok lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Parancs küldése a szerver konzoljára
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
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Parancs szükséges' },
        { status: 400 }
      );
    }

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent) {
      return NextResponse.json(
        { error: 'Szerver vagy agent nem található' },
        { status: 404 }
      );
    }

    // TODO: Valós implementációban itt kellene SSH-n keresztül elküldeni a parancsot
    // await sendCommandToServer(server.agent, command);

    return NextResponse.json({
      success: true,
      message: 'Parancs elküldve',
      command,
    });
  } catch (error) {
    console.error('Console command error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a parancs küldése során' },
      { status: 500 }
    );
  }
}

