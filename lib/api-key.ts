import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * API kulcs generálása
 */
export function generateApiKey(): string {
  const prefix = 'zedin_';
  const randomPart = randomBytes(32).toString('hex');
  return `${prefix}${randomPart}`;
}

/**
 * API kulcs validálása
 */
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; agentId?: string }> {
  try {
    // API kulcs formátum ellenőrzése
    if (!apiKey.startsWith('zedin_') || apiKey.length < 40) {
      return { valid: false };
    }

    // Agent keresése API kulcs alapján
    const agent = await prisma.agent.findUnique({
      where: {
        apiKey: apiKey,
      },
      select: {
        id: true,
        agentId: true,
      },
    });

    if (!agent) {
      return { valid: false };
    }

    return { valid: true, agentId: agent.agentId };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

/**
 * API kulcs létrehozása egy agenthez
 */
export async function createApiKeyForAgent(agentId: string): Promise<string> {
  const apiKey = generateApiKey();
  
  await prisma.agent.update({
    where: { id: agentId },
    data: { apiKey },
  });

  return apiKey;
}

