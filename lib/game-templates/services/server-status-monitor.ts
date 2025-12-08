/**
 * Server Status Monitor Service
 * Szerver health monitoring és auto-restart
 */

import { GameAgentService, getGameAgentService, AgentStatus } from './game-agent';
import { ContainerManager } from './container-manager';

/**
 * Server health status
 */
export interface ServerHealthStatus {
  serverId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  statusMessage: string;
  containerStatus: string;
  portHealthy: boolean;
  diskSpace: {
    total: number;
    used: number;
    free: number;
    percentUsed: number;
  };
  performance: {
    cpu: string;
    memory: string;
    uptime: number;
  };
  lastCheck: Date;
  failureCount: number;
  lastFailure?: Date;
}

/**
 * Server alert
 */
export interface ServerAlert {
  id: string;
  serverId: string;
  severity: 'info' | 'warning' | 'critical';
  type: string; // 'disk_low', 'container_crash', 'port_unreachable', etc.
  message: string;
  createdAt: Date;
  resolved: boolean;
}

/**
 * Monitor config
 */
export interface MonitorConfig {
  serverId: string;
  agentId: string;
  containerId: string;
  containerName: string;
  gamePort: number;
  queryPort: number;

  // Monitoring
  enabled: boolean;
  checkInterval: number; // seconds
  failureThreshold: number; // hány sikertelen check után auto-restart

  // Alerting
  diskLowThreshold: number; // % (e.g. 85)
  cpuHighThreshold: number; // % (e.g. 80)

  // Auto-recovery
  autoRestart: boolean;
  restartOnCrash: boolean;
}

/**
 * Server Status Monitor
 */
export class ServerStatusMonitor {
  private agentService: GameAgentService;
  private monitorConfigs: Map<string, MonitorConfig> = new Map();
  private healthStatuses: Map<string, ServerHealthStatus> = new Map();
  private alerts: Map<string, ServerAlert[]> = new Map();
  private monitorIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private failureCounters: Map<string, number> = new Map();

  constructor() {
    this.agentService = getGameAgentService();
  }

  /**
   * Monitor regisztrálása
   */
  registerMonitor(config: MonitorConfig): void {
    console.log(`📊 Monitor regisztrálva: ${config.serverId}`);

    this.monitorConfigs.set(config.serverId, config);
    this.alerts.set(config.serverId, []);
    this.failureCounters.set(config.serverId, 0);

    if (config.enabled) {
      this.startMonitoring(config.serverId);
    }
  }

  /**
   * Monitor eltávolítása
   */
  unregisterMonitor(serverId: string): void {
    this.monitorConfigs.delete(serverId);
    this.stopMonitoring(serverId);
    console.log(`🗑️ Monitor eltávolítva: ${serverId}`);
  }

  /**
   * Monitoring indítása
   */
  private startMonitoring(serverId: string): void {
    const config = this.monitorConfigs.get(serverId);
    if (!config) return;

    this.stopMonitoring(serverId);

    const interval = setInterval(async () => {
      await this.performHealthCheck(serverId);
    }, config.checkInterval * 1000);

    this.monitorIntervals.set(serverId, interval);
    console.log(`✅ Monitoring elindítva: ${serverId} (${config.checkInterval}s)`);

    // Initial check
    this.performHealthCheck(serverId).catch((error) => {
      console.error(`Initial health check hiba (${serverId}):`, error);
    });
  }

  /**
   * Monitoring leállítása
   */
  private stopMonitoring(serverId: string): void {
    const interval = this.monitorIntervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.monitorIntervals.delete(serverId);
      console.log(`⏹️ Monitoring leállítva: ${serverId}`);
    }
  }

  /**
   * Health check végrehajtása
   */
  async performHealthCheck(serverId: string): Promise<ServerHealthStatus> {
    const config = this.monitorConfigs.get(serverId);
    if (!config) {
      throw new Error(`Monitor config nem található: ${serverId}`);
    }

    const status: ServerHealthStatus = {
      serverId,
      status: 'healthy',
      statusMessage: 'OK',
      containerStatus: 'unknown',
      portHealthy: false,
      diskSpace: { total: 0, used: 0, free: 0, percentUsed: 0 },
      performance: { cpu: '0%', memory: '0%', uptime: 0 },
      lastCheck: new Date(),
      failureCount: this.failureCounters.get(serverId) || 0,
    };

    try {
      // Container check
      const containerStatus = await this.agentService.getContainerStatus(
        config.agentId,
        config.containerId
      );

      status.containerStatus = containerStatus.status;

      if (containerStatus.status !== 'running') {
        status.status = 'unhealthy';
        status.statusMessage = `Container nem fut: ${containerStatus.status}`;
        this.incrementFailureCounter(serverId);

        if (config.autoRestart && config.restartOnCrash) {
          await this.attemptAutoRestart(serverId);
        }
      }

      // Parse performance metrics
      status.performance.cpu = containerStatus.cpu || '0%';
      status.performance.memory = containerStatus.memory || '0%';

      // Disk space check
      const diskInfo = await this.agentService.checkDiskSpace(config.agentId);
      status.diskSpace = diskInfo;

      if (diskInfo.percentUsed > config.diskLowThreshold) {
        if (status.status === 'healthy') {
          status.status = 'degraded';
        }
        status.statusMessage = `Disk warning: ${diskInfo.percentUsed}% használva`;

        this.createAlert(serverId, 'warning', 'disk_low', `Disk tele: ${diskInfo.percentUsed}%`);
      }

      // Port check
      status.portHealthy = containerStatus.ports?.length > 0;
      if (!status.portHealthy && status.status === 'healthy') {
        status.status = 'degraded';
        status.statusMessage = 'Port binding hiba';
      }

      // Sikeres check - failure counter reset
      if (status.status === 'healthy') {
        this.failureCounters.set(serverId, 0);
      }
    } catch (error) {
      status.status = 'offline';
      status.statusMessage = error instanceof Error ? error.message : 'Health check hiba';
      status.failureCount = (status.failureCount || 0) + 1;
      status.lastFailure = new Date();

      this.incrementFailureCounter(serverId);

      console.error(`❌ Health check hiba (${serverId}):`, error);

      // Auto-restart ha meghaladta a failure threshold-ot
      if (
        config.autoRestart &&
        config.restartOnCrash &&
        this.failureCounters.get(serverId)! >= config.failureThreshold
      ) {
        await this.attemptAutoRestart(serverId);
      }
    }

    this.healthStatuses.set(serverId, status);
    return status;
  }

  /**
   * Failure counter inkrementálása
   */
  private incrementFailureCounter(serverId: string): void {
    const current = this.failureCounters.get(serverId) || 0;
    this.failureCounters.set(serverId, current + 1);
  }

  /**
   * Auto-restart attempt
   */
  private async attemptAutoRestart(serverId: string): Promise<void> {
    const config = this.monitorConfigs.get(serverId);
    if (!config) return;

    console.log(`🔄 Auto-restart indítása: ${serverId}`);

    try {
      // Container restart
      await this.agentService.stopContainer(config.agentId, config.containerId);

      // Várakozás
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Container start
      await this.agentService.startContainer(config.agentId, config.containerId, {});

      console.log(`✅ Auto-restart sikeres: ${serverId}`);
      this.createAlert(
        serverId,
        'info',
        'auto_restart_success',
        'Szerver auto-restart sikeres'
      );

      // Reset failure counter
      this.failureCounters.set(serverId, 0);
    } catch (error) {
      console.error(`❌ Auto-restart hiba (${serverId}):`, error);
      this.createAlert(
        serverId,
        'critical',
        'auto_restart_failed',
        `Auto-restart sikertelen: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`
      );
    }
  }

  /**
   * Alert létrehozása
   */
  private createAlert(
    serverId: string,
    severity: 'info' | 'warning' | 'critical',
    type: string,
    message: string
  ): void {
    const alerts = this.alerts.get(serverId) || [];

    const alert: ServerAlert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      serverId,
      severity,
      type,
      message,
      createdAt: new Date(),
      resolved: false,
    };

    alerts.push(alert);

    // Keep only last 100 alerts per server
    if (alerts.length > 100) {
      alerts.shift();
    }

    this.alerts.set(serverId, alerts);
    console.log(`⚠️ Alert: [${severity.toUpperCase()}] ${message}`);
  }

  /**
   * Health status lekérése
   */
  getHealthStatus(serverId: string): ServerHealthStatus | null {
    return this.healthStatuses.get(serverId) || null;
  }

  /**
   * Összes alert listázása
   */
  getAlerts(serverId: string, unresolvedOnly = true): ServerAlert[] {
    const alerts = this.alerts.get(serverId) || [];
    if (unresolvedOnly) {
      return alerts.filter((a) => !a.resolved);
    }
    return alerts;
  }

  /**
   * Alert feloldása
   */
  resolveAlert(serverId: string, alertId: string): void {
    const alerts = this.alerts.get(serverId) || [];
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Monitor config update
   */
  updateMonitorConfig(serverId: string, config: Partial<MonitorConfig>): void {
    const existing = this.monitorConfigs.get(serverId);
    if (!existing) return;

    const updated: MonitorConfig = {
      ...existing,
      ...config,
      serverId, // Protect ID
    };

    this.monitorConfigs.set(serverId, updated);

    // Restart monitoring ha enabled state megváltozott
    if (updated.enabled !== existing.enabled) {
      if (updated.enabled) {
        this.startMonitoring(serverId);
      } else {
        this.stopMonitoring(serverId);
      }
    }

    console.log(`✅ Monitor config frissítve: ${serverId}`);
  }

  /**
   * Összes monitor status listázása
   */
  listAllStatuses(): ServerHealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.monitorIntervals.forEach((interval) => clearInterval(interval));
    this.monitorIntervals.clear();
    this.monitorConfigs.clear();
    this.healthStatuses.clear();
    this.alerts.clear();
    console.log('✅ Server Status Monitor megsemmisítve');
  }
}

/**
 * Singleton instance
 */
let instance: ServerStatusMonitor | null = null;

export function getServerStatusMonitor(): ServerStatusMonitor {
  if (!instance) {
    instance = new ServerStatusMonitor();
  }
  return instance;
}

export default ServerStatusMonitor;
