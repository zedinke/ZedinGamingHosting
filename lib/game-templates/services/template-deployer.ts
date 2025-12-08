/**
 * Template Deployer Service
 * Teljes template deployment folyamat kezelése
 */

import { GameTemplateType, GameTemplate } from '../types';
import { getTemplate } from '../models/templates';
import { TemplateManager } from './template-manager';
import { PortManager, PortAllocationResult } from '@/lib/port-manager';
import { ContainerManager } from './container-manager';
import { prisma } from '@/lib/prisma';
import { GameType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { SevenDaysToDieConfigGenerator } from '../configs/7days2die-config';

export interface DeployTemplateOptions {
  serverId: string;
  templateId: GameTemplateType;
  machineId: string;
  agentId: string;
  serverName: string;
  maxPlayers: number;
  config?: any; // Játék-specifikus konfiguráció
}

export interface DeployTemplateResult {
  success: boolean;
  containerId?: string;
  ports?: PortAllocationResult;
  error?: string;
}

/**
 * Template Deployer - Teljes deployment folyamat
 */
export class TemplateDeployer {
  /**
   * Template deployment teljes folyamata
   */
  static async deployTemplate(
    options: DeployTemplateOptions
  ): Promise<DeployTemplateResult> {
    const { serverId, templateId, machineId, agentId, serverName, maxPlayers, config } = options;

    try {
      logger.info('Template deployment started', { serverId, templateId, machineId, agentId });

      // 1. Template információ lekérése
      const template = getTemplate(templateId);
      logger.info('Template loaded', { templateId, templateName: template.name });

      // 2. Port allokáció
      logger.info('Allocating ports', { serverId, machineId, templateId });
      const ports = await PortManager.allocatePorts(
        machineId,
        this.mapTemplateTypeToGameType(templateId),
        serverId
      );
      logger.info('Ports allocated', { serverId, ports });

      // 3. Szerver könyvtár létrehozása
      const serverDir = `/opt/servers/${serverId}`;
      logger.info('Creating server directory', { serverId, serverDir });

      // 4. Template letöltés (ha nincs lokálisan)
      const templateArchivePath = `/tmp/${template.id}-${template.version}.tar.gz`;
      logger.info('Downloading template', { templateId, archivePath: templateArchivePath });
      
      try {
        await TemplateManager.downloadTemplate(
          template.gdrive,
          templateArchivePath,
          (loaded, total) => {
            const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
            logger.info('Template download progress', { serverId, progress });
          }
        );
      } catch (error: any) {
        logger.error('Template download failed', error, { serverId, templateId });
        throw new Error(`Template download failed: ${error.message}`);
      }

      // 5. Template kibontás
      logger.info('Extracting template', { serverId, archivePath: templateArchivePath, serverDir });
      await TemplateManager.extractTemplate(templateArchivePath, serverDir);

      // 6. Konfiguráció generálás (játék-specifikus)
      logger.info('Generating configuration', { serverId, templateId });
      await this.generateGameConfig(serverId, templateId, serverDir, {
        serverName,
        maxPlayers,
        ports,
        ...config,
      });

      // 7. Docker container indítás
      logger.info('Starting Docker container', { serverId, templateId });
      const containerName = `game-${serverId}`;
      const containerId = await this.startGameContainer(
        containerName,
        template,
        serverId,
        serverDir,
        ports
      );

      // 8. Szerver státusz frissítése
      await prisma.server.update({
        where: { id: serverId },
        data: {
          status: 'ONLINE',
          port: ports.port,
          queryPort: ports.queryPort ?? null,
          telnetPort: ports.telnetPort ?? null,
          webMapPort: ports.webMapPort ?? null,
          rconPort: ports.rconPort ?? null,
        },
      });

      logger.info('Template deployment completed', { serverId, containerId, ports });

      return {
        success: true,
        containerId,
        ports,
      };
    } catch (error: any) {
      logger.error('Template deployment failed', error, { serverId, templateId });
      
      // Port felszabadítás hiba esetén
      try {
        await PortManager.deallocatePorts(serverId);
      } catch (deallocError) {
        logger.error('Port deallocation failed', deallocError as Error, { serverId });
      }

      return {
        success: false,
        error: error.message || 'Template deployment failed',
      };
    }
  }

  /**
   * Játék-specifikus konfiguráció generálás
   */
  private static async generateGameConfig(
    serverId: string,
    templateId: GameTemplateType,
    serverDir: string,
    options: {
      serverName: string;
      maxPlayers: number;
      ports: PortAllocationResult;
      [key: string]: any;
    }
  ): Promise<void> {
    switch (templateId) {
      case 'SEVEN_DAYS_TO_DIE':
        await this.generate7DaysConfig(serverDir, options);
        break;
      // További játékok itt...
      default:
        logger.warn('No config generator for template', { templateId });
    }
  }

  /**
   * 7 Days to Die konfiguráció generálás
   */
  private static async generate7DaysConfig(
    serverDir: string,
    options: {
      serverName: string;
      maxPlayers: number;
      ports: PortAllocationResult;
      [key: string]: any;
    }
  ): Promise<void> {
    const configDir = join(serverDir, 'server');
    
    // Könyvtár létrehozása
    await mkdir(configDir, { recursive: true });

    // serverconfig.xml generálása
    const serverConfig = SevenDaysToDieConfigGenerator.generateServerConfig(
      {
        serverName: options.serverName,
        maxPlayers: options.maxPlayers,
        port: options.ports.port,
        telnetPort: options.ports.telnetPort || 8081,
        webMapPort: options.ports.webMapPort || 8080,
        worldGeneration: options.worldGeneration || 'RandomGen',
        difficulty: options.difficulty || 'Normal',
        gameMode: options.gameMode || 'Survival',
        eacEnabled: options.eacEnabled !== false,
        adminUsers: options.adminUsers || [],
        serverPassword: options.serverPassword || '',
      },
      options.ports
    );

    await writeFile(join(configDir, 'serverconfig.xml'), serverConfig, 'utf-8');

    // admin.xml generálása
    const adminConfig = SevenDaysToDieConfigGenerator.generateAdminConfig(
      options.adminUsers || []
    );
    await writeFile(join(configDir, 'admin.xml'), adminConfig, 'utf-8');

    logger.info('7 Days to Die config generated', { serverDir, configDir });
  }

  /**
   * Docker container indítás
   */
  private static async startGameContainer(
    containerName: string,
    template: GameTemplate,
    serverId: string,
    serverDir: string,
    ports: PortAllocationResult
  ): Promise<string> {
    // Port binding string generálása
    const portBindings: string[] = [];
    
    if (ports.port) {
      portBindings.push(`-p ${ports.port}:${ports.port}/udp`);
    }
    if (ports.telnetPort) {
      portBindings.push(`-p ${ports.telnetPort}:${ports.telnetPort}/tcp`);
    }
    if (ports.webMapPort) {
      portBindings.push(`-p ${ports.webMapPort}:${ports.webMapPort}/tcp`);
    }
    if (ports.queryPort) {
      portBindings.push(`-p ${ports.queryPort}:${ports.queryPort}/udp`);
    }
    if (ports.rconPort) {
      portBindings.push(`-p ${ports.rconPort}:${ports.rconPort}/tcp`);
    }

    const portBindingStr = portBindings.join(' ');

    // Container run parancs
    const runCommand = `docker run -d \\
      --name ${containerName} \\
      --restart unless-stopped \\
      -v ${serverDir}/server:/opt/7days2die \\
      ${portBindingStr} \\
      ${template.dockerImage}`;

    logger.info('Starting container', { containerName, command: runCommand });

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync(runCommand);
    const containerId = stdout.trim();

    logger.info('Container started', { containerName, containerId });

    return containerId;
  }

  /**
   * Template Type -> GameType mapping
   */
  private static mapTemplateTypeToGameType(templateType: GameTemplateType): GameType {
    const mapping: Record<GameTemplateType, GameType> = {
      ARK_ASCENDED: 'ARK_ASCENDED',
      ARK_EVOLVED: 'ARK_EVOLVED',
      RUST: 'RUST',
      SEVEN_DAYS_TO_DIE: 'SEVEN_DAYS_TO_DIE',
    };

    return mapping[templateType] || 'OTHER';
  }
}

export default TemplateDeployer;

