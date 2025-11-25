import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Szerver teljesítmény metrikák
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
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '24'; // órák száma
    const interval = searchParams.get('interval') || '1'; // órák száma

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

    // Metrikák lekérdezése
    const { getLatestMetrics, getAggregatedMetrics } = await import('@/lib/metrics-storage');
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - parseInt(period) * 60 * 60 * 1000);
    
    let metricsData;
    
    if (interval && parseInt(interval) > 1) {
      // Aggregált metrikák
      metricsData = await getAggregatedMetrics(
        id,
        startTime,
        endTime,
        parseInt(interval) >= 24 ? 'day' : 'hour'
      );
      
      // Formázás a frontend számára
      const metrics = {
        cpu: metricsData.map((m) => ({ timestamp: m.timestamp.toISOString(), value: m.cpu.avg })),
        ram: metricsData.map((m) => ({ timestamp: m.timestamp.toISOString(), value: m.ram.avg / (1024 * 1024) })), // GB
        disk: metricsData.map((m) => ({ timestamp: m.timestamp.toISOString(), value: m.disk.avg / (1024 * 1024) })), // GB
        network: metricsData.map((m) => ({
          timestamp: m.timestamp.toISOString(),
          in: m.networkIn.total / (1024 * 1024), // MB
          out: m.networkOut.total / (1024 * 1024), // MB
        })),
        players: metricsData.map((m) => ({
          timestamp: m.timestamp.toISOString(),
          online: m.players.avg,
          max: m.players.max,
        })),
      };
      
      return NextResponse.json({
        success: true,
        server: {
          id: server.id,
          name: server.name,
          gameType: server.gameType,
        },
        metrics,
        period: parseInt(period),
        interval: parseInt(interval),
      });
    } else {
      // Legutóbbi metrikák
      const latestMetrics = await getLatestMetrics(id, parseInt(period) * 12); // 5 perces intervallum
      
      if (latestMetrics.length === 0) {
        // Ha nincs metrika, mock adatokat generálunk
        const metrics = generateMockMetrics(parseInt(period), parseInt(interval));
        return NextResponse.json({
          success: true,
          server: {
            id: server.id,
            name: server.name,
            gameType: server.gameType,
          },
          metrics,
          period: parseInt(period),
          interval: parseInt(interval),
        });
      }
      
      // Formázás a frontend számára
      const metrics = {
        cpu: latestMetrics.map((m) => ({ timestamp: m.timestamp.toISOString(), value: m.cpu })),
        ram: latestMetrics.map((m) => ({ timestamp: m.timestamp.toISOString(), value: m.ram / (1024 * 1024) })), // GB
        disk: latestMetrics.map((m) => ({ timestamp: m.timestamp.toISOString(), value: m.disk / (1024 * 1024) })), // GB
        network: latestMetrics.map((m) => ({
          timestamp: m.timestamp.toISOString(),
          in: m.networkIn / (1024 * 1024), // MB
          out: m.networkOut / (1024 * 1024), // MB
        })),
        players: latestMetrics.map((m) => ({
          timestamp: m.timestamp.toISOString(),
          online: m.players || 0,
          max: 20, // TODO: max players a szerverből
        })),
      };
      
      return NextResponse.json({
        success: true,
        server: {
          id: server.id,
          name: server.name,
          gameType: server.gameType,
        },
        metrics,
        period: parseInt(period),
        interval: parseInt(interval),
      });
    }
  } catch (error) {
    console.error('Get metrics error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a metrikák lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * Mock metrikák generálása (valós implementációban time-series adatbázisból kellene)
 */
function generateMockMetrics(period: number, interval: number): any {
  const now = Date.now();
  const points: any[] = [];

  for (let i = period; i >= 0; i -= interval) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    points.push({
      timestamp: timestamp.toISOString(),
      cpu: {
        usage: Math.random() * 100,
        cores: 4,
      },
      ram: {
        used: Math.random() * 8 * 1024 * 1024 * 1024,
        total: 8 * 1024 * 1024 * 1024,
      },
      disk: {
        used: Math.random() * 100 * 1024 * 1024 * 1024,
        total: 100 * 1024 * 1024 * 1024,
      },
      network: {
        in: Math.random() * 100 * 1024 * 1024,
        out: Math.random() * 50 * 1024 * 1024,
      },
      players: {
        online: Math.floor(Math.random() * 20),
        max: 20,
      },
    });
  }

  return {
    cpu: points.map((p) => ({ timestamp: p.timestamp, value: p.cpu.usage })),
    ram: points.map((p) => ({
      timestamp: p.timestamp,
      value: p.ram.used / (1024 * 1024 * 1024), // GB
    })),
    disk: points.map((p) => ({
      timestamp: p.timestamp,
      value: p.disk.used / (1024 * 1024 * 1024), // GB
    })),
    network: points.map((p) => ({
      timestamp: p.timestamp,
      in: p.network.in / (1024 * 1024), // MB
      out: p.network.out / (1024 * 1024), // MB
    })),
    players: points.map((p) => ({
      timestamp: p.timestamp,
      online: p.players.online,
      max: p.players.max,
    })),
  };
}

