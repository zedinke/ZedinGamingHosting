/**
 * Agent Template Deployment API
 * Template-alapú játékszerver telepítés agent gépen
 */

import { NextRequest, NextResponse } from 'next/server';
import { TemplateDeployer } from '@/lib/game-templates/services/template-deployer';
import { GameTemplateType } from '@/lib/game-templates/types';
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
    const {
      serverId,
      templateId,
      serverName,
      maxPlayers,
      config,
    } = body;

    // Validáció
    if (!serverId || !templateId || !serverName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: serverId, templateId, serverName' },
        { status: 400 }
      );
    }

    logger.info('Agent template deployment request', {
      agentId: agent.agentId,
      serverId,
      templateId,
      machineId: agent.machineId,
    });

    // Template deployment
    const result = await TemplateDeployer.deployTemplate({
      serverId,
      templateId: templateId as GameTemplateType,
      machineId: agent.machineId,
      agentId: agent.id,
      serverName,
      maxPlayers: maxPlayers || 10,
      config,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      containerId: result.containerId,
      ports: result.ports,
    });
  } catch (error: any) {
    logger.error('Agent template deployment error', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Deployment failed' },
      { status: 500 }
    );
  }
}

