/**
 * Server Health Monitoring API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  recordServerHealth,
  getServerHealthHistory,
  getLatestServerHealth,
  analyzeServerHealthTrends,
} from '@/lib/ark-health-monitor';

/**
 * POST - Record health metrics (internal/cron)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin-only for cron/internal
    const authHeader = request.headers.get('Authorization');
    if (
      authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}` &&
      !process.env.INTERNAL_API_SECRET
    ) {
      const session = await getServerSession(authOptions);
      if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const metrics = await request.json();

    const result = await recordServerHealth(params.id, metrics);

    return NextResponse.json({
      success: true,
      metrics: result,
    });
  } catch (error: any) {
    logger.error('Failed to record health metrics', error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to record metrics' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get health status and history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const server = await prisma.server.findUnique({
      where: { id: params.id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 288;
    const hours = searchParams.get('hours') ? parseInt(searchParams.get('hours')!) : 1;

    const latest = getLatestServerHealth(params.id);
    const history = getServerHealthHistory(params.id, limit);
    const trends = analyzeServerHealthTrends(params.id, hours);

    return NextResponse.json({
      success: true,
      latest,
      history: history.slice(-50), // Return last 50 for UI
      trends,
      lastCheck: new Date(), // TODO: retrieve from database if available
    });
  } catch (error: any) {
    logger.error('Failed to get health status', error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to get health status' },
      { status: 500 }
    );
  }
}
