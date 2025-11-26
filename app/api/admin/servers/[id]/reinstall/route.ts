import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { installGameServer } from '@/lib/game-server-installer';

// POST - Szerver újratelepítése
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

    // Szerver adatok lekérése
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        user: true,
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
        { error: 'Szerver nincs hozzárendelve egy agent-hez' },
        { status: 400 }
      );
    }

    // Szerver konfiguráció kinyerése
    const config = server.configuration as any || {};
    
    // Telepítési paraméterek összeállítása
    const installConfig = {
      maxPlayers: server.maxPlayers,
      ram: config.ram || 2048, // Alapértelmezett RAM
      port: server.port || 27015,
      name: server.name,
      world: config.world,
      password: config.password,
      adminPassword: config.adminPassword,
      clusterId: config.clusterId,
      map: config.map,
    };

    // Szerver újratelepítése
    const result = await installGameServer(
      server.id,
      server.gameType,
      installConfig
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Szerver újratelepítése sikertelen',
        },
        { status: 500 }
      );
    }

    // Szerver státusz frissítése
    await prisma.server.update({
      where: { id },
      data: {
        status: 'OFFLINE', // Újratelepítés után offline lesz
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Szerver sikeresen újratelepítve. A szerver fájlok telepítve lettek.',
    });
  } catch (error) {
    console.error('Server reinstall error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szerver újratelepítése során' },
      { status: 500 }
    );
  }
}

