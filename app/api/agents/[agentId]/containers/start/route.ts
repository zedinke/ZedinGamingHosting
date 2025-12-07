/**
 * Game Agent Container Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGameAgentService } from '@/lib/game-templates/services/game-agent';
import { getServerSession } from 'next-auth';

/**
 * POST /api/agents/[agentId]/containers/start
 * Start container on agent
 */
export async function POST(request: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { containerId, containerConfig } = await request.json();

    if (!containerId) {
      return NextResponse.json(
        { success: false, error: 'containerId szükséges' },
        { status: 400 }
      );
    }

    const agentService = getGameAgentService();
    const result = await agentService.startContainer(
      params.agentId,
      containerId,
      containerConfig || {}
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Container start hiba:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Container start hiba',
      },
      { status: 500 }
    );
  }
}
