import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ServerStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id, action } = params;

    // Szerver keresése
    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    let newStatus: ServerStatus;

    // Művelet végrehajtása
    switch (action) {
      case 'start':
        if (server.status === 'ONLINE' || server.status === 'STARTING') {
          return NextResponse.json(
            { error: 'A szerver már fut vagy indítás alatt van' },
            { status: 400 }
          );
        }
        newStatus = 'STARTING';
        break;

      case 'stop':
        if (server.status === 'OFFLINE' || server.status === 'STOPPING') {
          return NextResponse.json(
            { error: 'A szerver már le van állítva vagy leállítás alatt van' },
            { status: 400 }
          );
        }
        newStatus = 'STOPPING';
        break;

      case 'restart':
        if (server.status !== 'ONLINE') {
          return NextResponse.json(
            { error: 'Csak online szerver indítható újra' },
            { status: 400 }
          );
        }
        newStatus = 'RESTARTING';
        break;

      default:
        return NextResponse.json(
          { error: 'Érvénytelen művelet' },
          { status: 400 }
        );
    }

    // Státusz frissítése
    await prisma.server.update({
      where: { id },
      data: { status: newStatus },
    });

    // TODO: Valós implementációban itt kellene a tényleges szerver műveletet végrehajtani

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Szerver ${action} művelet elindítva`,
    });
  } catch (error) {
    console.error('Server action error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a művelet végrehajtása során' },
      { status: 500 }
    );
  }
}

