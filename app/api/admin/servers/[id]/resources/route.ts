import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// PUT - Szerver erőforrás használat frissítése (agent hívja)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Resolve params if it's a Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    const session = await getServerSession(authOptions);

    // Agent autentikáció (API key) vagy admin jogosultság
    const authHeader = request.headers.get('authorization');
    let isAuthorized = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // API key autentikáció (agent)
      const apiKey = authHeader.substring(7);
      const { validateApiKey } = await import('@/lib/api-key');
      const validation = await validateApiKey(apiKey);
      
      if (validation.valid) {
        // Ellenőrizzük, hogy az agent jogosult-e erre a szerverre
        const serverWithAgent = await prisma.server.findUnique({
          where: { id },
          include: { agent: true },
        });
        
        if (serverWithAgent?.agentId === validation.agent?.id) {
          isAuthorized = true;
        }
      }
    } else {
      // Session autentikáció (admin)
      if (session && (session.user as any).role === UserRole.ADMIN) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }
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

