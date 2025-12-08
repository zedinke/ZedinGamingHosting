/**
 * Agent Template Update API
 * Játékszerver frissítés SteamCMD-vel
 */

import { NextRequest, NextResponse } from 'next/server';
import { TemplateUpdater } from '@/lib/game-templates/services/template-updater';
import { GameType } from '@prisma/client';
import { authenticateAgent } from '@/lib/agent-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Agent autentikáció
    const authResult = await authenticateAgent(request);
    if (!authResult.valid || !authResult.agentId) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Agent információk lekérése
    const agent = await prisma.agent.findUnique({
      where: { agentId: authResult.agentId },
      include: { machine: true },
    });

    if (!agent || !agent.machine) {
      return NextResponse.json(
        { success: false, error: 'Agent or machine not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { serverId, gameType } = body;

    // Validáció
    if (!serverId || !gameType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: serverId, gameType' },
        { status: 400 }
      );
    }

    logger.info('Agent template update request', {
      agentId: agent.agentId,
      serverId,
      gameType,
      machineId: agent.machineId,
    });

    // Template update
    const result = await TemplateUpdater.updateGameServer({
      serverId,
      gameType: gameType as GameType,
      machineId: agent.machineId,
      agentId: agent.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, logs: result.logs },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: result.updated,
      logs: result.logs,
    });
  } catch (error: any) {
    logger.error('Agent template update error', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Update failed' },
      { status: 500 }
    );
  }
}

