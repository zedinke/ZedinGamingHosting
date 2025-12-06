/**
 * ARK Enterprise Events & Analytics API
 * GET - Event statistics, leaderboards, export
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  logGameEvent,
  logAdminAction,
  getEventStatistics,
  recordPerformanceMetrics,
  exportEventsTelemetry,
} from '@/lib/ark-event-logging';

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
    const searchParams = new URL(request.url).searchParams;
    const action = searchParams.get('action') || 'statistics';
    const format = searchParams.get('format') || 'json'; // json, csv
    const days = parseInt(searchParams.get('days') || '7', 10);

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check
    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    if (action === 'export') {
      const telemetry = await exportEventsTelemetry(serverId, days);
      
      if (format === 'csv') {
        // Convert to CSV
        let csv = 'Típus,Játékos,Adatok,Timestamp\n';
        (telemetry.events || []).forEach((event: any) => {
          csv += `"${event.type}","${event.playerName || 'N/A'}","${JSON.stringify(event.data)}","${event.timestamp}"\n`;
        });

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="events.csv"',
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: telemetry,
      });
    }

    // Default: statistics
    const stats = await getEventStatistics(serverId, days);

    return NextResponse.json({
      success: true,
      data: {
        statistics: stats,
        period: `${days} nap`,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logger.error('Events GET error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt az események lekérdezése során' },
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
    const { type, eventData, action = 'log-event' } = body;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN or own server
    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    if (action === 'log-event') {
      const result = await logGameEvent(serverId, type, eventData);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Esemény sikeresen naplózva',
      });
    }

    if (action === 'log-admin-action') {
      const result = await logAdminAction(
        serverId,
        (session.user as any).id,
        eventData.action,
        eventData.details,
        request.ip || 'unknown'
      );

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Admin akció sikeresen naplózva',
      });
    }

    if (action === 'record-performance') {
      const result = await recordPerformanceMetrics(serverId, eventData);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Performance metrikák sikeresen rögzítve',
      });
    }

    return NextResponse.json({ error: 'Ismeretlen akcio' }, { status: 400 });
  } catch (error: unknown) {
    logger.error('Events POST error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt az esemény naplózása során' },
      { status: 500 }
    );
  }
}
