/**
 * Game Server Update Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerUpdateManager } from '@/lib/game-templates/services/server-update-manager';
import { getServerSession } from 'next-auth';

/**
 * GET /api/servers/[serverId]/updates/status
 * Get last update job status
 */
export async function GET(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updateManager = getServerUpdateManager();
    const jobs = updateManager.listUpdateJobs(params.serverId);

    // Get latest job
    const latestJob = jobs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];

    return NextResponse.json({
      success: true,
      job: latestJob || null,
      totalJobs: jobs.length,
    });
  } catch (error) {
    console.error('Update status hiba:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status hiba',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/servers/[serverId]/updates/check
 * Manually trigger update check
 */
export async function POST(request: NextRequest, { params }: { params: { serverId: string } }) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updateManager = getServerUpdateManager();
    const job = await updateManager.manualUpdate(params.serverId);

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Manual update hiba:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Update hiba',
      },
      { status: 500 }
    );
  }
}
