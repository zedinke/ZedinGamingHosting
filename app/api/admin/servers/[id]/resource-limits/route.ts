import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Erőforrás limitok lekérése
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

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        configuration: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    const config = (server.configuration as any) || {};
    const limits = config.resourceLimits || {
      cpu: { max: 100, min: 0 }, // CPU százalék
      ram: { max: 4096, min: 512 }, // RAM MB
      disk: { max: 10240, min: 1024 }, // Disk MB
    };

    return NextResponse.json({
      success: true,
      limits,
    });
  } catch (error) {
    console.error('Get resource limits error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az erőforrás limitok lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Erőforrás limitok frissítése
export async function PUT(
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
    const { limits } = body;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    const config = (server.configuration as any) || {};
    config.resourceLimits = limits;

    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        configuration: config,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Erőforrás limitok sikeresen frissítve',
      limits: (updatedServer.configuration as any)?.resourceLimits,
    });
  } catch (error) {
    console.error('Update resource limits error:', error);
    return NextResponse.json(
      { error: 'Hiba történt az erőforrás limitok frissítése során' },
      { status: 500 }
    );
  }
}

