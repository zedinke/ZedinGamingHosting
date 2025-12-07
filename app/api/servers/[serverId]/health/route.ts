/**
 * Server Health Monitoring API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerStatusMonitor } from '@/lib/game-templates/services/server-status-monitor';
import { getServerSession } from 'next-auth';

/**
 * GET /api/servers/[serverId]/health
 * Get server health status
 */
export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const monitor = getServerStatusMonitor();
    const status = monitor.getHealthStatus(params.serverId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Server health hiba:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health hiba',
      },
      { status: 500 }
    );
  }
}
