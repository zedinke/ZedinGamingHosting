/**
 * Game Agent Health Check & Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGameAgentService } from '@/lib/game-templates/services/game-agent';
import { getServerSession } from 'next-auth';

/**
 * GET /api/agents/[agentId]/health
 * Agent health check
 */
export async function GET(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const agentService = getGameAgentService();
    const status = await agentService.checkHealth(params.agentId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Agent health check hiba:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health check hiba',
      },
      { status: 500 }
    );
  }
}
