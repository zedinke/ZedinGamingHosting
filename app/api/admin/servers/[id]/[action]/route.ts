import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, ServerStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
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
        // TODO: Itt kellene meghívni a tényleges szerver indítási API-t
        // Példa: await startServer(server.id);
        break;

      case 'stop':
        if (server.status === 'OFFLINE' || server.status === 'STOPPING') {
          return NextResponse.json(
            { error: 'A szerver már le van állítva vagy leállítás alatt van' },
            { status: 400 }
          );
        }
        newStatus = 'STOPPING';
        // TODO: Itt kellene meghívni a tényleges szerver leállítási API-t
        // Példa: await stopServer(server.id);
        break;

      case 'restart':
        if (server.status !== 'ONLINE') {
          return NextResponse.json(
            { error: 'Csak online szerver indítható újra' },
            { status: 400 }
          );
        }
        newStatus = 'RESTARTING';
        // TODO: Itt kellene meghívni a tényleges szerver újraindítási API-t
        // Példa: await restartServer(server.id);
        break;

      default:
        return NextResponse.json(
          { error: 'Érvénytelen művelet' },
          { status: 400 }
        );
    }

    // Státusz frissítése
    const updatedServer = await prisma.server.update({
      where: { id },
      data: { status: newStatus },
    });

    // TODO: Valós implementációban itt kellene egy háttérfolyamatot indítani,
    // ami a tényleges szerver műveletet végzi, majd frissíti a státuszt

    // Szimuláció: 2 másodperc után állítsuk be a végső státuszt
    setTimeout(async () => {
      let finalStatus: ServerStatus;
      if (action === 'start') {
        finalStatus = 'ONLINE';
      } else if (action === 'stop') {
        finalStatus = 'OFFLINE';
      } else {
        finalStatus = 'ONLINE';
      }

      await prisma.server.update({
        where: { id },
        data: { status: finalStatus },
      });
    }, 2000);

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

