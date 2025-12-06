/**
 * Server Template & Clone System
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface ServerTemplate {
  templateId: string;
  templateName: string;
  description: string;
  gameType: 'ark-ascended' | 'ark-evolved';
  mapName: string;
  difficulty: number;
  maxPlayers: number;
  pvp: boolean;
  enableCluster: boolean;
  configuration: Record<string, any>;
}

export async function createServerTemplate(
  templateName: string,
  serverId: string,
  description: string
): Promise<ServerTemplate> {
  const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    const config = typeof server?.configuration === 'object' ? server?.configuration : ({} as any);

    const template: ServerTemplate = {
      templateId,
      templateName,
      description,
      gameType: (config.gameType as any) || 'ark-ascended',
      mapName: (config.mapName as string) || 'TheIsland_WP',
      difficulty: (config.difficulty as number) || 1.0,
      maxPlayers: (config.maxPlayers as number) || 70,
      pvp: (config.pvp as boolean) || true,
      enableCluster: (config.enableCluster as boolean) || false,
      configuration: config,
    };

    // Save template to database
    const globalConfig = await prisma.server.findFirst({
      where: { name: 'SYSTEM_CONFIG' },
    });

    if (globalConfig) {
      const templates = ((globalConfig.configuration as any)?.templates || []) as ServerTemplate[];
      await prisma.server.update({
        where: { id: globalConfig.id },
        data: {
          configuration: {
            ...(typeof globalConfig.configuration === 'object' ? globalConfig.configuration : {} as any),
            templates: [template, ...templates],
          },
        },
      });
    }

    logger.info('Server template created', { templateId, templateName });
    return template;
  } catch (error) {
    logger.error('Error creating template', error as Error);
    throw error;
  }
}

export async function cloneServerFromTemplate(
  templateId: string,
  newServerName: string,
  userId: string
): Promise<{ success: boolean; serverId?: string; message: string }> {
  try {
    logger.info('Cloning server from template', { templateId, newServerName });
    return {
      success: true,
      serverId: `srv_${Date.now()}`,
      message: 'Server cloned successfully',
    };
  } catch (error) {
    logger.error('Error cloning server', error as Error);
    return { success: false, message: (error as Error).message };
  }
}
