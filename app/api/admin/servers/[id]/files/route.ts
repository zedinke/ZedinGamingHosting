import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Fájlok listázása egy szerver könyvtárában
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
    const path = searchParams.get('path') || '/';

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

    // TODO: Valós implementációban itt kellene SSH-n keresztül lekérdezni a fájlokat
    // Jelenleg csak egy mock választ adunk vissza
    const files = [
      {
        name: 'server.properties',
        type: 'file',
        size: 1024,
        modified: new Date().toISOString(),
      },
      {
        name: 'logs',
        type: 'directory',
        size: 0,
        modified: new Date().toISOString(),
      },
      {
        name: 'world',
        type: 'directory',
        size: 0,
        modified: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      path,
      files,
      server: {
        id: server.id,
        name: server.name,
      },
    });
  } catch (error) {
    console.error('Files list error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a fájlok lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Fájl műveletek (létrehozás, törlés, átnevezés)
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
    const { action, path, content, newPath } = body;

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

    // TODO: Valós implementációban itt kellene SSH-n keresztül végrehajtani a műveleteket
    switch (action) {
      case 'create_file':
        // Fájl létrehozása
        break;
      case 'create_directory':
        // Könyvtár létrehozása
        break;
      case 'delete':
        // Fájl/könyvtár törlése
        break;
      case 'rename':
        // Fájl/könyvtár átnevezése
        break;
      case 'write':
        // Fájl írása
        break;
      default:
        return NextResponse.json(
          { error: 'Érvénytelen művelet' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Művelet sikeresen végrehajtva',
    });
  } catch (error) {
    console.error('File operation error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a művelet végrehajtása során' },
      { status: 500 }
    );
  }
}

