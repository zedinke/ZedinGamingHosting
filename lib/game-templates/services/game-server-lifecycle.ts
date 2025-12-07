/**
 * Game Server Lifecycle Manager
 * Összekapcsolja az összes servicet: Agent, Update, Monitor
 */

import { GameAgentService, getGameAgentService } from './game-agent';
import {
  ServerUpdateManager,
  getServerUpdateManager,
  UpdateScheduleConfig,
} from './server-update-manager';
import {
  ServerStatusMonitor,
  getServerStatusMonitor,
  MonitorConfig,
  ServerHealthStatus,
} from './server-status-monitor';

/**
 * Game server lifecycle config
 */
export interface GameServerConfig {
  serverId: string;
  agentId: string;
  containerId: string;
  containerName: string;
  gameName: string;
  steamAppId: number;
  gamePort: number;
  queryPort: number;

  // Auto-update config
  autoUpdate: boolean;
  maintenanceTime?: string; // "03:00" UTC
  updateCheckInterval: number; // seconds (default: 3600 = 1 hour)
  restartOnUpdate: boolean;

  // Monitoring config
  monitoringEnabled: boolean;
  monitoringInterval: number; // seconds (default: 300 = 5 min)
  failureThreshold: number; // (default: 3)
  autoRestart: boolean;
  restartOnCrash: boolean;

  // Alerting thresholds
  diskLowThreshold: number; // % (default: 85)
  cpuHighThreshold: number; // % (default: 80)
}

/**
 * Server lifecycle state
 */
export interface ServerLifecycleState {
  serverId: string;
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  status: 'initializing' | 'running' | 'stopped' | 'error' | 'updating';

  // Associated managers
  agentId: string;
  containerId: string;
  monitoringEnabled: boolean;
  updateCheckEnabled: boolean;

  // Current status
  healthStatus?: ServerHealthStatus;
  lastUpdate?: Date;
  updateJobId?: string;
}

/**
 * Game Server Lifecycle Manager
 */
export class GameServerLifecycleManager {
  private agentService: GameAgentService;
  private updateManager: ServerUpdateManager;
  private statusMonitor: ServerStatusMonitor;
  private serverConfigs: Map<string, GameServerConfig> = new Map();
  private serverStates: Map<string, ServerLifecycleState> = new Map();

  constructor() {
    this.agentService = getGameAgentService();
    this.updateManager = getServerUpdateManager();
    this.statusMonitor = getServerStatusMonitor();
  }

  /**
   * Szerver regisztrálása és összes service indítása
   */
  async registerServer(config: GameServerConfig): Promise<ServerLifecycleState> {
    console.log(`\n📋 Szerver regisztrálása: ${config.serverId} (${config.gameName})`);

    // Config tárolása
    this.serverConfigs.set(config.serverId, config);

    // Lifecycle state
    const state: ServerLifecycleState = {
      serverId: config.serverId,
      createdAt: new Date(),
      status: 'initializing',
      agentId: config.agentId,
      containerId: config.containerId,
      monitoringEnabled: config.monitoringEnabled,
      updateCheckEnabled: config.autoUpdate,
    };

    this.serverStates.set(config.serverId, state);

    try {
      // 1. Agent health check
      console.log(`  ✓ Agent health check: ${config.agentId}`);
      const agentStatus = await this.agentService.checkHealth(config.agentId);
      console.log(`    → Status: ${agentStatus.status}`);

      // 2. Update manager regisztrálása
      if (config.autoUpdate) {
        console.log(`  ✓ Update manager regisztrálása`);

        const updateConfig: UpdateScheduleConfig = {
          serverId: config.serverId,
          agentId: config.agentId,
          steamAppId: config.steamAppId,
          installDir: `/opt/gameservers/${config.serverId}`,
          autoUpdate: config.autoUpdate,
          maintenanceTime: config.maintenanceTime,
          checkInterval: config.updateCheckInterval,
          restartOnUpdate: config.restartOnUpdate,
        };

        this.updateManager.registerUpdateSchedule(updateConfig);
        console.log(`    → Update check: ${config.updateCheckInterval}s interval`);
      }

      // 3. Status monitor regisztrálása
      if (config.monitoringEnabled) {
        console.log(`  ✓ Status monitor regisztrálása`);

        const monitorConfig: MonitorConfig = {
          serverId: config.serverId,
          agentId: config.agentId,
          containerId: config.containerId,
          containerName: config.containerName,
          gamePort: config.gamePort,
          queryPort: config.queryPort,
          enabled: true,
          checkInterval: config.monitoringInterval,
          failureThreshold: config.failureThreshold,
          diskLowThreshold: config.diskLowThreshold,
          cpuHighThreshold: config.cpuHighThreshold,
          autoRestart: config.autoRestart,
          restartOnCrash: config.restartOnCrash,
        };

        this.statusMonitor.registerMonitor(monitorConfig);
        console.log(`    → Health check: ${config.monitoringInterval}s interval`);
      }

      state.status = 'running';
      state.startedAt = new Date();

      console.log(`✅ Szerver sikeresen regisztrálva: ${config.serverId}\n`);

      return state;
    } catch (error) {
      state.status = 'error';
      console.error(`❌ Szerver regisztrációs hiba: ${config.serverId}`, error);
      throw error;
    }
  }

  /**
   * Szerver eltávolítása és összes service leállítása
   */
  async unregisterServer(serverId: string): Promise<void> {
    console.log(`🗑️ Szerver eltávolítása: ${serverId}`);

    const config = this.serverConfigs.get(serverId);
    const state = this.serverStates.get(serverId);

    if (config) {
      // Update manager eltávolítása
      if (config.autoUpdate) {
        this.updateManager.unregisterUpdateSchedule(serverId);
      }

      // Status monitor eltávolítása
      if (config.monitoringEnabled) {
        this.statusMonitor.unregisterMonitor(serverId);
      }

      // Container leállítása
      try {
        await this.agentService.stopContainer(config.agentId, config.containerId);
      } catch (error) {
        console.warn(`⚠️ Container leállítás hiba: ${error}`);
      }
    }

    this.serverConfigs.delete(serverId);

    if (state) {
      state.status = 'stopped';
      state.stoppedAt = new Date();
    }

    console.log(`✅ Szerver eltávolítva: ${serverId}`);
  }

  /**
   * Szerver státusza
   */
  getServerState(serverId: string): ServerLifecycleState | null {
    const state = this.serverStates.get(serverId);
    if (state) {
      // Update health status
      const healthStatus = this.statusMonitor.getHealthStatus(serverId);
      state.healthStatus = healthStatus || undefined;
    }
    return state || null;
  }

  /**
   * Összes szerver listázása
   */
  listServers(): GameServerConfig[] {
    return Array.from(this.serverConfigs.values());
  }

  /**
   * Összes szerver státusza
   */
  listServerStates(): ServerLifecycleState[] {
    return Array.from(this.serverStates.values());
  }

  /**
   * Szerver config update
   */
  updateServerConfig(serverId: string, config: Partial<GameServerConfig>): void {
    const existing = this.serverConfigs.get(serverId);
    if (!existing) return;

    const updated: GameServerConfig = {
      ...existing,
      ...config,
      serverId, // Protect
    };

    this.serverConfigs.set(serverId, updated);

    // Update manager config
    if (updated.autoUpdate !== existing.autoUpdate) {
      if (updated.autoUpdate) {
        const updateConfig: UpdateScheduleConfig = {
          serverId,
          agentId: updated.agentId,
          steamAppId: updated.steamAppId,
          installDir: `/opt/gameservers/${serverId}`,
          autoUpdate: true,
          maintenanceTime: updated.maintenanceTime,
          checkInterval: updated.updateCheckInterval,
          restartOnUpdate: updated.restartOnUpdate,
        };
        this.updateManager.registerUpdateSchedule(updateConfig);
      } else {
        this.updateManager.unregisterUpdateSchedule(serverId);
      }
    }

    // Monitor config
    if (updated.monitoringEnabled !== existing.monitoringEnabled) {
      if (updated.monitoringEnabled) {
        const monitorConfig: MonitorConfig = {
          serverId,
          agentId: updated.agentId,
          containerId: updated.containerId,
          containerName: updated.containerName,
          gamePort: updated.gamePort,
          queryPort: updated.queryPort,
          enabled: true,
          checkInterval: updated.monitoringInterval,
          failureThreshold: updated.failureThreshold,
          diskLowThreshold: updated.diskLowThreshold,
          cpuHighThreshold: updated.cpuHighThreshold,
          autoRestart: updated.autoRestart,
          restartOnCrash: updated.restartOnCrash,
        };
        this.statusMonitor.registerMonitor(monitorConfig);
      } else {
        this.statusMonitor.unregisterMonitor(serverId);
      }
    }

    console.log(`✅ Szerver config frissítve: ${serverId}`);
  }

  /**
   * Manuális frissítés trigger
   */
  async manualUpdate(serverId: string): Promise<void> {
    console.log(`🚀 Manuális update: ${serverId}`);
    const job = await this.updateManager.manualUpdate(serverId);

    const state = this.serverStates.get(serverId);
    if (state && job) {
      state.updateJobId = job.id;
      state.lastUpdate = new Date();
    }
  }

  /**
   * Szerver restart
   */
  async restartServer(serverId: string): Promise<void> {
    const config = this.serverConfigs.get(serverId);
    if (!config) throw new Error(`Szerver nem található: ${serverId}`);

    console.log(`🔄 Szerver restart: ${serverId}`);

    try {
      await this.agentService.stopContainer(config.agentId, config.containerId);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await this.agentService.startContainer(config.agentId, config.containerId, {});
      console.log(`✅ Szerver újraindítva: ${serverId}`);
    } catch (error) {
      console.error(`❌ Restart hiba: ${error}`);
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
let instance: GameServerLifecycleManager | null = null;

export function getGameServerLifecycleManager(): GameServerLifecycleManager {
  if (!instance) {
    instance = new GameServerLifecycleManager();
  }
  return instance;
}

export default GameServerLifecycleManager;
