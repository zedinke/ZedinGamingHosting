/**
 * ARK Enterprise Maintenance API
 * GET - Scheduled maintenance windows
 * POST - Schedule maintenance, announce
 * DELETE - Cancel maintenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  scheduleMaintenanceWindow,
  announceMaintenanceToPlayers,
  drainServerGracefully,
} from '@/lib/ark-maintenance-planner';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check
    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
    const maintenance = config.maintenanceWindows || [];

    return NextResponse.json({
      success: true,
      data: {
        scheduled: maintenance.filter((m: any) => m.status === 'scheduled'),
        active: maintenance.filter((m: any) => m.status === 'active'),
        completed: maintenance.filter((m: any) => m.status === 'completed'),
        total: maintenance.length,
      },
    });
  } catch (error: unknown) {
    logger.error('Maintenance GET error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a karbantartási adatok lekérdezése során' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;
    const body = await request.json();
    const {
      action = 'schedule',
      scheduledTime,
      durationMinutes = 60,
      type = 'maintenance',
      description,
      announceMinutesBefore = 30,
    } = body;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
    }

    if (action === 'schedule') {
      if (!scheduledTime) {
        return NextResponse.json(
          { error: 'Ütemezés időpontja szükséges' },
          { status: 400 }
        );
      }

      const maintenance = await scheduleMaintenanceWindow(
        serverId,
        new Date(scheduledTime).getTime(),
        durationMinutes,
        description || '',
        type as any
      );

      return NextResponse.json({
        success: true,
        data: maintenance,
        message: 'Karbantartási ablak ütemezve',
      });
    }

    if (action === 'announce') {
      const maintenanceId = body.maintenanceId;
      if (!maintenanceId) {
        return NextResponse.json(
          { error: 'Karbantartási azonosító szükséges' },
          { status: 400 }
        );
      }

      const result = await announceMaintenanceToPlayers(
        serverId,
        maintenanceId,
        announceMinutesBefore
      );

      return NextResponse.json({
        success: true,
        data: result,
        message: `Karbantartási bejelentés küldve (${announceMinutesBefore} perccel előtte)`,
      });
    }

    if (action === 'drain') {
      const result = await drainServerGracefully(serverId, description);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Szerver fokozatosan leállított (új bejelentkezések letiltva)',
      });
    }

    return NextResponse.json({ error: 'Ismeretlen akcio' }, { status: 400 });
  } catch (error: unknown) {
    logger.error('Maintenance POST error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a karbantartás ütemezése során' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;
    const searchParams = new URL(request.url).searchParams;
    const maintenanceId = searchParams.get('maintenanceId');

    if (!maintenanceId) {
      return NextResponse.json(
        { error: 'Karbantartási azonosító szükséges' },
        { status: 400 }
      );
    }

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
    }

    const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
    const maintenance = (config.maintenanceWindows || []).filter(
      (m: any) => m.id !== maintenanceId
    );

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          maintenanceWindows: maintenance,
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Karbantartás sikeresen lemondva',
    });
  } catch (error: unknown) {
    logger.error('Maintenance DELETE error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a karbantartás lezárása során' },
      { status: 500 }
    );
  }
}
