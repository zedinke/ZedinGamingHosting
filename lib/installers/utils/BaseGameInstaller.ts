/**
 * Base Game Installer Interface
 * Minden game installer ezt implementálja
 */

import { DebugLogger } from './DebugLogger';
import { GameType } from '@prisma/client';

export interface PortAllocation {
  port: number; // Alap port
  queryPort?: number;
  beaconPort?: number;
  steamPeerPort?: number;
  rustPlusPort?: number;
  telnetPort?: number;
  webMapPort?: number;
  controlPanelPort?: number;
}

export interface InstallConfig {
  serverId: string;
  serverName: string;
  maxPlayers: number;
  map?: string;
  password?: string;
  adminPassword: string;
  port: number;
  ram?: number;
  unlimitedRam?: boolean;
  clusterId?: string;
  [key: string]: any; // Game-specific configs
}

export interface InstallResult {
  success: boolean;
  serverId: string;
  gameType: GameType;
  containerId?: string;
  ports?: PortAllocation;
  message?: string;
  error?: string;
  logs?: string;
}

export abstract class BaseGameInstaller {
  protected gameType: GameType;
  protected logger: DebugLogger;
  protected machineId: string;

  constructor(gameType: GameType, machineId: string) {
    this.gameType = gameType;
    this.machineId = machineId;
    this.logger = new DebugLogger(`Installer:${gameType}`);
  }

  /**
   * Validálja a konfigurációt
   */
  abstract validateConfig(config: InstallConfig): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Port allokációs logika - game-specifikus
   */
  abstract allocatePorts(basePort: number): Promise<PortAllocation>;

  /**
   * Docker Compose YAML generálása
   */
  abstract buildDockerCompose(config: InstallConfig, ports: PortAllocation): string;

  /**
   * Health check script - szerver elérhető-e?
   */
  abstract buildHealthCheck(ports: PortAllocation): string;

  /**
   * Pre-install cleanup
   */
  abstract preInstall(config: InstallConfig): Promise<void>;

  /**
   * Post-install setup (permissions, configs stb)
   */
  abstract postInstall(config: InstallConfig, containerId: string): Promise<void>;

  /**
   * Szerver indítása
   */
  abstract startServer(config: InstallConfig): Promise<{ success: boolean; error?: string }>;

  /**
   * Szerver leállítása
   */
  abstract stopServer(config: InstallConfig): Promise<{ success: boolean; error?: string }>;

  /**
   * Health check futtatása
   */
  abstract healthCheck(config: InstallConfig, ports: PortAllocation): Promise<boolean>;

  /**
   * Teljes installation flow
   */
  async install(config: InstallConfig): Promise<InstallResult> {
    try {
      this.logger.info(`📦 ${this.gameType} telepítés indítása`, {
        serverId: config.serverId,
        serverName: config.serverName,
        maxPlayers: config.maxPlayers,
      });

      // 1. Validáció
      this.logger.debug('1️⃣ Konfigurációs validáció');
      const validation = await this.validateConfig(config);
      if (!validation.valid) {
        this.logger.error('Validációs hibák', undefined, { errors: validation.errors });
        return {
          success: false,
          serverId: config.serverId,
          gameType: this.gameType,
          error: validation.errors.join(', '),
          logs: this.logger.getLogsAsString(),
        };
      }

      // 2. Pre-install
      this.logger.debug('2️⃣ Pre-install cleanup');
      await this.preInstall(config);

      // 3. Port allocation
      this.logger.debug('3️⃣ Port allokáció', { basePort: config.port });
      const ports = await this.allocatePorts(config.port);
      this.logger.info('✅ Portok allokálva', ports);

      // 4. Docker Compose generálás
      this.logger.debug('4️⃣ Docker Compose generálása');
      const dockerCompose = this.buildDockerCompose(config, ports);
      this.logger.trace('Generated Docker Compose:', { dockerCompose });

      // 5. Pre-install setup
      this.logger.debug('5️⃣ Pre-install setup');
      await this.preInstall(config);

      // 6. Start container
      this.logger.debug('6️⃣ Docker container indítása');
      const startResult = await this.startServer(config);
      if (!startResult.success) {
        throw new Error(startResult.error || 'Container start failed');
      }

      // 7. Post-install setup
      this.logger.debug('7️⃣ Post-install setup');
      await this.postInstall(config, startResult.containerId || '');

      // 8. Health check
      this.logger.debug('8️⃣ Health check (max 5 próba, 10sec timeout)');
      let healthy = false;
      for (let i = 0; i < 5; i++) {
        this.logger.debug(`   Próba ${i + 1}/5`, {});
        healthy = await this.healthCheck(config, ports);
        if (healthy) {
          this.logger.info('✅ Health check sikeres');
          break;
        }
        this.logger.warn(`   Health check nem válaszol, ${2 - i} próba maradt`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2sec wait
      }

      if (!healthy) {
        this.logger.warn('⚠️ Health check timeout, de installation folytatódik');
      }

      this.logger.info(`✅ ${this.gameType} telepítés sikeres!`, {
        serverId: config.serverId,
        ports,
      });

      return {
        success: true,
        serverId: config.serverId,
        gameType: this.gameType,
        ports,
        message: `${this.gameType} szerver sikeresen telepítve`,
        logs: this.logger.getLogsAsString(),
      };
    } catch (error: any) {
      this.logger.error(`❌ ${this.gameType} telepítés hiba`, error, {
        serverId: config.serverId,
      });

      return {
        success: false,
        serverId: config.serverId,
        gameType: this.gameType,
        error: error.message || 'Installation failed',
        logs: this.logger.getLogsAsString(),
      };
    }
  }

  getLogger(): DebugLogger {
    return this.logger;
  }

  getLogs(): string {
    return this.logger.getLogsAsString();
  }
}
