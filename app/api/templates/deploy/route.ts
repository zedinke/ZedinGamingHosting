/**
 * POST /api/templates/deploy
 * Game template deployment indítása
 * 
 * Body:
 * {
 *   "serverId": "server-id",
 *   "templateId": "ARK_ASCENDED" | "ARK_EVOLVED" | "RUST",
 *   "serverName": "My Server Name",
 *   "customConfig": {...} (optional)
 * }
 */

import { TemplateManager } from '@/lib/game-templates/services/template-manager';
import { GameTemplateType } from '@/lib/game-templates/types';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Autentikáció
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Request body
    const body = await req.json();
    const { serverId, templateId, serverName, customConfig } = body;

    // Validáció
    if (!serverId || !templateId || !serverName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: serverId, templateId, serverName',
        },
        { status: 400 }
      );
    }

    // Template validálása
    if (!Object.values(GameTemplateType).includes(templateId)) {
      return NextResponse.json(
        { success: false, error: `Invalid template ID: ${templateId}` },
        { status: 400 }
      );
    }

    // Deployment session létrehozása
    const deploySession = await TemplateManager.deployTemplate(
      serverId,
      templateId,
      serverName,
      {
        id: 'machine-1', // TODO: Real machine info from DB
        ip: '0.0.0.0',
        agentId: 'agent-1', // TODO: Real agent info
      }
    );

    return NextResponse.json({
      success: true,
      sessionId: deploySession.id,
      phase: deploySession.phase,
      progress: deploySession.progress,
      messages: deploySession.messages,
    });
  } catch (error) {
    console.error('Template deploy error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed',
      },
      { status: 500 }
    );
  }
}
