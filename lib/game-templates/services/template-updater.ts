/**
 * Template Update Service
 * SteamCMD alapú szerver frissítés kezelése
 */

import { prisma } from '@/lib/prisma';
import { GameType } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';
import { ContainerManager } from './container-manager';
import { logger } from '@/lib/logger';

export interface UpdateGameServerOptions {
  serverId: string;
  gameType: GameType;
  machineId: string;
  agentId: string;
}

export interface UpdateGameServerResult {
  success: boolean;
  updated: boolean;
  error?: string;
  logs?: string[];
}

/**
 * Template Updater - SteamCMD alapú frissítés
 */
export class TemplateUpdater {
  /**
   * Játékszerver frissítése SteamCMD-vel
   */
  static async updateGameServer(
    options: UpdateGameServerOptions
  ): Promise<UpdateGameServerResult> {
    const { serverId, gameType, machineId, agentId } = options;
    const logs: string[] = [];

    try {
      logger.info('Game server update started', { serverId, gameType, machineId, agentId });
      logs.push(`Frissítés indítása: ${gameType} szerver (${serverId})`);

      // 1. Szerver információk lekérése
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          machine: true,
          agent: true,
        },
      });

      if (!server || !server.machine || !server.agent) {
        throw new Error('Server, machine, or agent not found');
      }

      // 2. Steam App ID meghatározása
      const steamAppId = this.getSteamAppId(gameType);
      if (!steamAppId) {
        throw new Error(`Steam App ID not found for game type: ${gameType}`);
      }

      logs.push(`Steam App ID: ${steamAppId}`);

      // 3. Container leállítás (ha fut)
      const containerName = `game-${serverId}`;
      try {
        const containerStatus = await ContainerManager.getContainerStatus(containerName);
        if (containerStatus && containerStatus.status === 'running') {
          logs.push('Container leállítása frissítéshez...');
          await ContainerManager.stopContainer(containerName, 30);
          logs.push('Container leállítva');
        }
      } catch (error: any) {
        logger.warn('Container stop failed (may not exist)', { serverId, error: error.message });
        logs.push(`Figyelmeztetés: Container leállítás: ${error.message}`);
      }

      // 4. SteamCMD update futtatása
      logs.push('SteamCMD update futtatása...');
      const serverDir = `/opt/servers/${serverId}/server`;
      const updateResult = await this.runSteamCMDUpdate(
        server.machine,
        serverDir,
        steamAppId,
        logs
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'SteamCMD update failed');
      }

      logs.push('SteamCMD update sikeres');

      // 5. Container újraindítás
      try {
        logs.push('Container újraindítása...');
        await ContainerManager.startContainer(containerName);
        logs.push('Container újraindítva');
      } catch (error: any) {
        logger.warn('Container start failed', { serverId, error: error.message });
        logs.push(`Figyelmeztetés: Container indítás: ${error.message}`);
      }

      // 6. Szerver státusz frissítése
      await prisma.server.update({
        where: { id: serverId },
        data: {
          updatedAt: new Date(),
        },
      });

      logger.info('Game server update completed', { serverId, gameType });

      return {
        success: true,
        updated: true,
        logs,
      };
    } catch (error: any) {
      logger.error('Game server update failed', error, { serverId, gameType });
      logs.push(`Hiba: ${error.message}`);

      return {
        success: false,
        updated: false,
        error: error.message || 'Update failed',
        logs,
      };
    }
  }

  /**
   * SteamCMD update futtatása SSH-n keresztül
   */
  private static async runSteamCMDUpdate(
    machine: any,
    serverDir: string,
    steamAppId: number,
    logs: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sshConfig = {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      };

      if (!sshConfig.keyPath) {
        throw new Error('SSH key path is required');
      }

      // SteamCMD update parancs
      const updateCommand = `cd /opt/steamcmd && ./steamcmd.sh +force_install_dir ${serverDir} +login anonymous +app_update ${steamAppId} validate +quit`;

      logs.push(`SteamCMD parancs: ${updateCommand}`);

      const result = await executeSSHCommand(sshConfig, updateCommand, 600000); // 10 perc timeout

      if (result.exitCode !== 0) {
        return {
          success: false,
          error: `SteamCMD update failed: ${result.stderr}`,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'SteamCMD update failed',
      };
    }
  }

  /**
   * Steam App ID meghatározása játék típus alapján
   */
  private static getSteamAppId(gameType: GameType): number | null {
    const appIds: Record<GameType, number> = {
      SEVEN_DAYS_TO_DIE: 251570,
      ARK_EVOLVED: 376030,
      ARK_ASCENDED: 2430930,
      RUST: 258550,
      VALHEIM: 896660,
      SATISFACTORY: 1690800,
      // További játékok...
      OTHER: 0,
    };

    const appId = appIds[gameType];
    return appId && appId !== 0 ? appId : null;
  }

  /**
   * Frissítések ellenőrzése
   */
  static async checkForUpdates(gameType: GameType): Promise<boolean> {
    // TODO: Implement update check logic
    // Ez lehet Steam API vagy más módszer
    return true; // Mindig frissítünk új rendeléskor
  }
}

export default TemplateUpdater;

