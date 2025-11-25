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

    // API key autentikáció
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'API key szükséges' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const { validateApiKey } = await import('@/lib/api-key');
    const validation = await validateApiKey(apiKey);

    if (!validation.valid || validation.agentId !== agentId) {
      return NextResponse.json(
        { error: 'Érvénytelen API key' },
        { status: 401 }
      );
    }

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

