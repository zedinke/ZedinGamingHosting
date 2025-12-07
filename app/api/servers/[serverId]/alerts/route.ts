/**
 * Server Alerts API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerStatusMonitor } from '@/lib/game-templates/services/server-status-monitor';
import { getServerSession } from 'next-auth';

/**
 * GET /api/servers/[serverId]/alerts
 * Get server alerts
 */
export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const monitor = getServerStatusMonitor();

    // Query param: unresolved_only (default: true)
    const unresolvedOnly = request.nextUrl.searchParams.get('unresolved_only') !== 'false';
    const alerts = monitor.getAlerts(params.serverId, unresolvedOnly);

    return NextResponse.json({
      success: true,
      alerts,
      totalAlerts: alerts.length,
    });
  } catch (error) {
    console.error('Alerts lista hiba:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Alerts hiba',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/servers/[serverId]/alerts/[alertId]/resolve
 * Resolve an alert
 */
export async function POST(request: NextRequest, { params }: { params: any }) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { serverId, alertId } = params;

    const monitor = getServerStatusMonitor();
    monitor.resolveAlert(serverId, alertId);

    return NextResponse.json({
      success: true,
      message: 'Alert resolved',
    });
  } catch (error) {
    console.error('Alert resolve hiba:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Resolve hiba',
      },
      { status: 500 }
    );
  }
}
