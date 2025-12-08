/**
 * Server Lifecycle API - list & register
 * Nem piszkálja a régi /api/servers végpontot, külön namespace-ben fut.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getGameServerLifecycleManager } from '@/lib/game-templates/services';
import { GameServerConfig } from '@/lib/game-templates/services/game-server-lifecycle';

function withDefaults(body: Partial<GameServerConfig>): GameServerConfig {
  if (!body.serverId) throw new Error('serverId kötelező');
  if (!body.agentId) throw new Error('agentId kötelező');
  if (!body.containerId) throw new Error('containerId kötelező');
  if (!body.containerName) throw new Error('containerName kötelező');
  if (!body.gameName) throw new Error('gameName kötelező');
  if (body.steamAppId === undefined) throw new Error('steamAppId kötelező');
  if (body.gamePort === undefined) throw new Error('gamePort kötelező');
  if (body.queryPort === undefined) throw new Error('queryPort kötelező');

  return {
    serverId: body.serverId,
    agentId: body.agentId,
    containerId: body.containerId,
    containerName: body.containerName,
    gameName: body.gameName,
    steamAppId: body.steamAppId,
    gamePort: body.gamePort,
    queryPort: body.queryPort,
    autoUpdate: body.autoUpdate ?? false,
    maintenanceTime: body.maintenanceTime,
    updateCheckInterval: body.updateCheckInterval ?? 3600,
    restartOnUpdate: body.restartOnUpdate ?? true,
    monitoringEnabled: body.monitoringEnabled ?? true,
    monitoringInterval: body.monitoringInterval ?? 300,
    failureThreshold: body.failureThreshold ?? 3,
    autoRestart: body.autoRestart ?? true,
    restartOnCrash: body.restartOnCrash ?? true,
    diskLowThreshold: body.diskLowThreshold ?? 85,
    cpuHighThreshold: body.cpuHighThreshold ?? 80,
  };
}

function serializeState(state: any) {
  if (!state) return null;
  return {
    ...state,
    createdAt: state.createdAt?.toISOString?.() ?? state.createdAt,
    startedAt: state.startedAt?.toISOString?.() ?? state.startedAt,
    stoppedAt: state.stoppedAt?.toISOString?.() ?? state.stoppedAt,
    lastUpdate: state.lastUpdate?.toISOString?.() ?? state.lastUpdate,
  };
}

/**
 * GET /api/servers/lifecycle
 * Lista az összes szerver állapotáról
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const lifecycle = getGameServerLifecycleManager();
    const states = lifecycle.listServerStates().map(serializeState);

    return NextResponse.json({ success: true, servers: states });
  } catch (error) {
    console.error('Servers lifecycle list hiba:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ismeretlen hiba' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/servers/lifecycle
 * Szerver regisztráció
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const config = withDefaults(body);

    const lifecycle = getGameServerLifecycleManager();
    const state = await lifecycle.registerServer(config);

    return NextResponse.json({ success: true, state: serializeState(state) });
  } catch (error) {
    console.error('Server lifecycle register hiba:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ismeretlen hiba' },
      { status: 500 }
    );
  }
}
