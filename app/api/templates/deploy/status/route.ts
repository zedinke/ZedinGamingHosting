/**
 * GET /api/templates/deploy/status
 * Deployment session status lekérése
 * 
 * Query params:
 * - sessionId: string
 * - serverId: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// Mock storage (valós implementációban: database)
const deploymentSessions = new Map<string, any>();

export async function GET(req: NextRequest) {
  try {
    // Autentikáció
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const serverId = searchParams.get('serverId');

    if (!sessionId || !serverId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required params: sessionId, serverId',
        },
        { status: 400 }
      );
    }

    // Session lekérése
    const deploySession = deploymentSessions.get(sessionId);

    if (!deploySession) {
      return NextResponse.json(
        {
          success: false,
          error: 'Deployment session nem található',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: deploySession,
    });
  } catch (error) {
    console.error('Deploy status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status check hiba',
      },
      { status: 500 }
    );
  }
}
