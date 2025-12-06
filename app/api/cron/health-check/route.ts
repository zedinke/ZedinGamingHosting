/**
 * Server Health Check Cron Job
 * Run every 5 minutes to collect health metrics from all active servers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { recordServerHealth } from '@/lib/ark-health-monitor';

/**
 * Get server metrics from Docker or SSH
 * This is a stub - implement actual metric collection based on your server infrastructure
 */
async function getServerMetrics(server: any) {
  try {
    // TODO: Implement actual metric collection
    // For ARK Docker: Use docker stats API
    // For SSH: Query via rcon or server files
    
    // Mock implementation - replace with actual metric collection
    return {
      fps: 30 + Math.random() * 20, // 30-50 FPS simulation
      playerCount: Math.floor(Math.random() * server.maxPlayers),
      maxPlayers: server.maxPlayers || 70,
      cpuUsage: 40 + Math.random() * 40, // 40-80% CPU simulation
      ramUsage: 50 + Math.random() * 30, // 50-80% RAM simulation
      maxRam: 32, // GB
    };
  } catch (error) {
    logger.error('Failed to get server metrics', error as Error, { serverId: server.id });
    return null;
  }
}

/**
 * POST /api/cron/health-check
 * Collect health metrics for all active servers
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;

    if (!authHeader?.startsWith('Bearer ') || !cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== cronSecret) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get all active servers (TODO: add status filtering if available in schema)
    const servers = await prisma.server.findMany();

    logger.info(`Running health check for ${servers.length} active servers`);

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Collect metrics for each server
    for (const server of servers) {
      try {
        const metrics = await getServerMetrics(server);

        if (metrics) {
          const result = await recordServerHealth(server.id, metrics);
          successCount++;
          results.push({
            serverId: server.id,
            status: 'success',
          });
        } else {
          failureCount++;
          results.push({
            serverId: server.id,
            status: 'failed',
            reason: 'Could not retrieve metrics',
          });
        }
      } catch (error) {
        failureCount++;
        results.push({
          serverId: server.id,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Avoid rate limiting - small delay between servers
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info(`Health check completed: ${successCount} success, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      timestamp: new Date(),
      summary: {
        totalServers: servers.length,
        successCount,
        failureCount,
      },
      results,
    });
  } catch (error) {
    logger.error('Health check cron job failed', error as Error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

/**
 * GET - Health check endpoint status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Health check cron endpoint ready',
    usage: 'POST with Authorization: Bearer <CRON_SECRET>',
  });
}
