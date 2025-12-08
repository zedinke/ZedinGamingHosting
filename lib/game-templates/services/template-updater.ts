/**
 * Template Update Service
 * SteamCMD alapú szerver frissítés kezelése
 */

import { prisma } from '@/lib/prisma';
import { GameType } from '@prisma/client';
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
   * SteamCMD update futtatása (agent gépen közvetlenül)
   */
  private static async runSteamCMDUpdate(
    serverDir: string,
    steamAppId: number,
    logs: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // SteamCMD update parancs (agent gépen közvetlenül fut, nem SSH-n keresztül)
      const updateCommand = `cd /opt/steamcmd && ./steamcmd.sh +force_install_dir ${serverDir} +login anonymous +app_update ${steamAppId} validate +quit`;

      logs.push(`SteamCMD parancs: ${updateCommand}`);

      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync(updateCommand, {
        timeout: 600000, // 10 perc timeout
      });

      if (stderr && !stderr.includes('Success')) {
        // SteamCMD néha stderr-re írja a kimenetet, de az nem feltétlenül hiba
        logs.push(`SteamCMD stderr: ${stderr}`);
      }

      logs.push(`SteamCMD stdout: ${stdout}`);

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
    const appIds: Partial<Record<GameType, number>> = {
      SEVEN_DAYS_TO_DIE: 294420,
      ARK_EVOLVED: 376030,
      ARK_ASCENDED: 2430930,
      RUST: 258550,
      VALHEIM: 896660,
      SATISFACTORY: 1690800,
      CONAN_EXILES: 440900,
      DAYZ: 221100,
      PROJECT_ZOMBOID: 108600,
      CS2: 730,
      CSGO: 730,
      LEFT_4_DEAD_2: 550,
      KILLING_FLOOR_2: 232090,
      INSURGENCY_SANDSTORM: 581320,
      SQUAD: 393380,
      HELL_LET_LOOSE: 686810,
      POST_SCRIPTUM: 736220,
      ARMA_3: 107410,
      TERRARIA: 105600,
      STARBOUND: 211820,
      SPACE_ENGINEERS: 244850,
      GARRYS_MOD: 4000,
      UNTURNED: 304930,
      TEAM_FORTRESS_2: 440,
      HALF_LIFE_2_DEATHMATCH: 320,
      COUNTER_STRIKE_SOURCE: 240,
      DAY_OF_DEFEAT_SOURCE: 300,
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

