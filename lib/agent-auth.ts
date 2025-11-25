import { NextRequest } from 'next/server';
import { validateApiKey } from './api-key';

/**
 * Agent autentikáció middleware
 */
export async function authenticateAgent(request: NextRequest): Promise<{
  valid: boolean;
  agentId?: string;
  agent?: any;
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: 'API key szükséges',
    };
  }

  const apiKey = authHeader.substring(7);
  const validation = await validateApiKey(apiKey);

  if (!validation.valid) {
    return {
      valid: false,
      error: 'Érvénytelen API key',
    };
  }

  return {
    valid: true,
    agentId: validation.agentId,
    agent: validation.agent,
  };
}

