import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// PUT - Szerver erőforrás használat frissítése (agent hívja)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // TODO: Valós implementációban itt kellene agent autentikáció (API key)
    // Jelenleg csak admin jogosultságot ellenőrizzük
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { resourceUsage } = body;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Erőforrás használat frissítése
    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        resourceUsage: resourceUsage || server.resourceUsage,
      },
    });

    // Metrikák mentése
    if (resourceUsage) {
      const { saveMetric } = await import('@/lib/metrics-storage');
      await saveMetric({
        serverId: id,
        timestamp: new Date(),
        cpu: resourceUsage.cpu || 0,
        ram: resourceUsage.ram || 0,
        disk: resourceUsage.disk || 0,
        networkIn: resourceUsage.networkIn || 0,
        networkOut: resourceUsage.networkOut || 0,
        players: resourceUsage.players,
        uptime: resourceUsage.uptime,
      });
    }

    return NextResponse.json({
      success: true,
      server: {
        id: updatedServer.id,
        resourceUsage: updatedServer.resourceUsage,
      },
    });
  } catch (error) {
    console.error('Update resources error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az erőforrás frissítése során' },
      { status: 500 }
    );
  }
}

