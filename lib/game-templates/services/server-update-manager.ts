/**
 * Server Update Manager Service
 * Szerver frissítések ütemezése és kezelése
 */

import { GameAgentService, getGameAgentService } from './game-agent';
import { GameUpdateInfo } from '@/lib/game-templates/types';

/**
 * Update scheduler config
 */
export interface UpdateScheduleConfig {
  serverId: string;
  agentId: string;
  steamAppId: number;
  installDir: string;

  // Frissítés beállítások
  autoUpdate: boolean;
  maintenanceTime?: string; // "03:00" UTC
  checkInterval: number; // seconds
  restartOnUpdate: boolean;
}

/**
 * Update job
 */
export interface UpdateJob {
  id: string;
  serverId: string;
  status: 'pending' | 'checking' | 'downloading' | 'installing' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  newVersion?: string;
}

/**
 * Server Update Manager
 */
export class ServerUpdateManager {
  private agentService: GameAgentService;
  private updateJobs: Map<string, UpdateJob> = new Map();
  private updateSchedules: Map<string, UpdateScheduleConfig> = new Map();
  private updateIntervals: Map<string, NodeJS.Timer> = new Map();

  constructor() {
    this.agentService = getGameAgentService();
  }

  /**
   * Update schedule létrehozása
   */
  registerUpdateSchedule(config: UpdateScheduleConfig): void {
    console.log(`📅 Update schedule regisztrálva: ${config.serverId}`);

    this.updateSchedules.set(config.serverId, config);

    if (config.autoUpdate) {
      this.startUpdateSchedule(config.serverId);
    }
  }

  /**
   * Update schedule eltávolítása
   */
  unregisterUpdateSchedule(serverId: string): void {
    this.updateSchedules.delete(serverId);
    this.stopUpdateSchedule(serverId);
  }

  /**
   * Update schedule indítása
   */
  private startUpdateSchedule(serverId: string): void {
    const config = this.updateSchedules.get(serverId);
    if (!config) return;

    // Meglévő interval leállítása
    this.stopUpdateSchedule(serverId);

    // Új interval indítása
    const interval = setInterval(async () => {
      await this.checkAndUpdateServer(serverId);
    }, config.checkInterval * 1000);

    this.updateIntervals.set(serverId, interval);
    console.log(`✅ Update check schedule elindítva: ${serverId} (${config.checkInterval}s)`);
  }

  /**
   * Update schedule leállítása
   */
  private stopUpdateSchedule(serverId: string): void {
    const interval = this.updateIntervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(serverId);
      console.log(`⏹️ Update check schedule leállítva: ${serverId}`);
    }
  }

  /**
   * Frissítés ellenőrzése és letöltése
   */
  async checkAndUpdateServer(serverId: string): Promise<UpdateJob | null> {
    const config = this.updateSchedules.get(serverId);
    if (!config) {
      console.warn(`⚠️ Update schedule nem található: ${serverId}`);
      return null;
    }

    // Job létrehozása
    const jobId = `update-${serverId}-${Date.now()}`;
    const job: UpdateJob = {
      id: jobId,
      serverId,
      status: 'checking',
      progress: 0,
      startedAt: new Date(),
    };

    this.updateJobs.set(jobId, job);

    try {
      console.log(`🔍 Frissítés ellenőrzése: ${serverId}`);

      // Update check
      const updateInfo = await this.agentService.checkServerUpdate(
        config.agentId,
        config.steamAppId
      );

      if (!updateInfo || updateInfo.currentVersion === updateInfo.availableVersion) {
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = new Date();
        console.log(`✅ Szerver már aktuális: ${serverId} (v${updateInfo?.currentVersion})`);
        return job;
      }

      // Update szükséges
      console.log(
        `📥 Frissítés elérhető: ${serverId} v${updateInfo.currentVersion} → v${updateInfo.availableVersion}`
      );

      job.status = 'downloading';
      job.progress = 25;

      // Update letöltés és telepítés
      const updateResult = await this.agentService.updateServer(
        config.agentId,
        serverId,
        config.steamAppId,
        config.installDir
      );

      if (updateResult.success) {
        job.status = 'completed';
        job.progress = 100;
        job.newVersion = updateResult.version;
        job.completedAt = new Date();

        console.log(`✅ Szerver frissítve: ${serverId} → v${updateResult.version}`);

        // Restart ha szükséges
        if (config.restartOnUpdate) {
          console.log(`🔄 Szerver újraindítása a frissítés után: ${serverId}`);
          // TODO: Container restart
        }
      } else {
        throw new Error('Update installation hiba');
      }
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Ismeretlen hiba';
      job.completedAt = new Date();

      console.error(`❌ Update hiba (${serverId}):`, error);
    }

    return job;
  }

  /**
   * Manual update trigger
   */
  async manualUpdate(serverId: string): Promise<UpdateJob | null> {
    console.log(`🚀 Manual update indítása: ${serverId}`);
    return this.checkAndUpdateServer(serverId);
  }

  /**
   * Update job státusza
   */
  getUpdateJob(jobId: string): UpdateJob | null {
    return this.updateJobs.get(jobId) || null;
  }

  /**
   * Összes update job listázása
   */
  listUpdateJobs(serverId?: string): UpdateJob[] {
    if (serverId) {
      return Array.from(this.updateJobs.values()).filter((job) => job.serverId === serverId);
    }
    return Array.from(this.updateJobs.values());
  }

  /**
   * Update job törlése
   */
  deleteUpdateJob(jobId: string): void {
    this.updateJobs.delete(jobId);
  }

  /**
   * Szerver update schedule config lekérése
   */
  getUpdateSchedule(serverId: string): UpdateScheduleConfig | undefined {
    return this.updateSchedules.get(serverId);
  }

  /**
   * Összes update schedule listázása
   */
  listUpdateSchedules(): UpdateScheduleConfig[] {
    return Array.from(this.updateSchedules.values());
  }

  /**
   * Update config módosítása
   */
  updateScheduleConfig(serverId: string, config: Partial<UpdateScheduleConfig>): void {
    const existing = this.updateSchedules.get(serverId);
    if (!existing) return;

    const updated: UpdateScheduleConfig = {
      ...existing,
      ...config,
      serverId, // Megvéd az ID megváltoztatástól
    };

    this.updateSchedules.set(serverId, updated);

    // Auto-update state alapján restart schedule
    if (updated.autoUpdate !== existing.autoUpdate) {
      if (updated.autoUpdate) {
        this.startUpdateSchedule(serverId);
      } else {
        this.stopUpdateSchedule(serverId);
      }
    }

    console.log(`✅ Update schedule frissítve: ${serverId}`);
  }
}

/**
 * Singleton instance
 */
let instance: ServerUpdateManager | null = null;

export function getServerUpdateManager(): ServerUpdateManager {
  if (!instance) {
    instance = new ServerUpdateManager();
  }
  return instance;
}

export default ServerUpdateManager;
