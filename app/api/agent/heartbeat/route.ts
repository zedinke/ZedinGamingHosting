import { NextRequest, NextResponse } from 'next/server';
import { handleAgentHeartbeat } from '@/lib/agent-heartbeat';

// POST - Agent heartbeat küldése
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, status, resources, capabilities } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId szükséges' },
        { status: 400 }
      );
    }

    // TODO: Valós implementációban itt kellene autentikáció (API key vagy token)
    // Jelenleg csak az agentId-t ellenőrizzük

    await handleAgentHeartbeat(agentId, {
      status,
      resources,
      capabilities,
    });

    return NextResponse.json({
      success: true,
      message: 'Heartbeat fogadva',
    });
  } catch (error: any) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt a heartbeat feldolgozása során' },
      { status: 500 }
    );
  }
}

