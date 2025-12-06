/**
 * ARK Docker Installer
 * Manages Docker-based ARK Survival Ascended and Evolved servers
 * Production-ready implementation with full error handling
 */

import { spawn, execSync } from 'child_process';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';

export interface ArkServerConfig {
  serverId: string;
  serverName: string;
  gameType: 'ark-ascended' | 'ark-evolved';
  mapName: string;
  maxPlayers: number;
  difficulty: number; // 0.5 - 4.0
  serverPort: number;
  queryPort: number;
  steamApiKey: string;
  serverPassword?: string;
  adminPassword: string;
  ramMb?: number;
  clusterId?: string;
  clusterMode?: boolean;
  enablePvp?: boolean;
  enableCrosshair?: boolean;
  customEngineIni?: string;
  customGameIni?: string;
}

export interface ServerStatus {
  status: 'running' | 'stopped' | 'error';
  containerId?: string;
  memory?: number;
  cpu?: number;
  players?: number;
  uptime?: number;
  lastUpdate?: Date;
}

/**
 * ARK Docker Installer - Main class for managing ARK servers via Docker
 */
export class ArkDockerInstaller extends EventEmitter {
  private dataDir: string;
  private clusterDir: string;
  private dockerDir: string;

  constructor(baseDir: string = '/opt/ark-docker') {
    super();
    this.dataDir = join(baseDir, 'data');
    this.clusterDir = join(baseDir, 'cluster');
    this.dockerDir = join(baseDir, 'docker');
  }

  /**
   * Initialize directories and build Docker images
   */
  async initialize(): Promise<void> {
    try {
      logger.info('[ArkDocker] Initializing ARK Docker environment...');

      // Create directories
      await mkdir(this.dataDir, { recursive: true });
      await mkdir(this.clusterDir, { recursive: true });

      // Build Docker images
      await this.buildImages();

      logger.info('[ArkDocker] Initialization completed successfully');
      this.emit('initialized');
    } catch (error: any) {
      logger.error('[ArkDocker] Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Build Docker images for ARK servers
   */
  private async buildImages(): Promise<void> {
    const images = [
      { name: 'ark-ascended', path: join(this.dockerDir, 'ark-ascended') },
      { name: 'ark-evolved', path: join(this.dockerDir, 'ark-evolved') },
    ];

    for (const image of images) {
      if (!existsSync(image.path)) {
        logger.warn(`[ArkDocker] Dockerfile path not found: ${image.path}`);
        continue;
      }

      try {
        logger.info(`[ArkDocker] Building Docker image: ${image.name}`);
        await this.executeCommand('docker', [
          'build',
          '-t',
          `zedin-gaming/${image.name}:latest`,
          image.path,
        ]);
        logger.info(`[ArkDocker] Successfully built image: ${image.name}`);
      } catch (error: any) {
        logger.error(
          `[ArkDocker] Failed to build image ${image.name}`,
          error as Error
        );
        throw error;
      }
    }
  }

  /**
   * Install and start an ARK server
   */
  async install(config: ArkServerConfig): Promise<{ success: boolean; error?: string; containerId?: string }> {
    try {
      this.validateConfig(config);
      logger.info(`[ArkDocker] Installing ${config.gameType} server: ${config.serverId}`);

      // Initialize directories and build Docker images if needed
      await this.initialize();

      // Create server data directory
      const serverDataDir = join(this.dataDir, config.serverId);
      await mkdir(serverDataDir, { recursive: true });

      // Generate environment file
      const envContent = this.generateEnvFile(config);
      const envPath = join(serverDataDir, '.env');
      await writeFile(envPath, envContent);

      // Generate docker-compose file
      const composeContent = this.generateDockerCompose(config);
      const composePath = join(serverDataDir, 'docker-compose.yml');
      await writeFile(composePath, composeContent);

      // Start container with docker-compose
      await this.executeCommand('docker-compose', ['-f', composePath, 'up', '-d'], {
        cwd: serverDataDir,
        env: { ...process.env, ...this.parseEnvFile(envContent) },
      });

      // Get container ID
      const containerId = await this.getContainerId(config.serverId);

      logger.info(`[ArkDocker] Server installed successfully: ${containerId}`);
      this.emit('server-installed', { serverId: config.serverId, containerId });

      return { success: true, containerId: containerId || undefined };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(`[ArkDocker] Installation failed for ${config.serverId}`, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Start an existing ARK server
   */
  async start(serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`[ArkDocker] Starting server: ${serverId}`);

      const serverDataDir = join(this.dataDir, serverId);
      const composePath = join(serverDataDir, 'docker-compose.yml');

      if (!existsSync(composePath)) {
        throw new Error(`docker-compose.yml not found for server: ${serverId}`);
      }

      await this.executeCommand('docker-compose', ['-f', composePath, 'up', '-d'], {
        cwd: serverDataDir,
      });

      logger.info(`[ArkDocker] Server started: ${serverId}`);
      this.emit('server-started', { serverId });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(`[ArkDocker] Failed to start server ${serverId}`, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Stop an ARK server
   */
  async stop(serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`[ArkDocker] Stopping server: ${serverId}`);

      const serverDataDir = join(this.dataDir, serverId);
      const composePath = join(serverDataDir, 'docker-compose.yml');

      if (!existsSync(composePath)) {
        throw new Error(`docker-compose.yml not found for server: ${serverId}`);
      }

      await this.executeCommand('docker-compose', ['-f', composePath, 'down'], {
        cwd: serverDataDir,
      });

      logger.info(`[ArkDocker] Server stopped: ${serverId}`);
      this.emit('server-stopped', { serverId });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(`[ArkDocker] Failed to stop server ${serverId}`, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Restart an ARK server
   */
  async restart(serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`[ArkDocker] Restarting server: ${serverId}`);

      await this.stop(serverId);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const result = await this.start(serverId);

      if (result.success) {
        logger.info(`[ArkDocker] Server restarted: ${serverId}`);
        this.emit('server-restarted', { serverId });
      }

      return result;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(`[ArkDocker] Failed to restart server ${serverId}`, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete an ARK server and clean up resources
   */
  async delete(serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`[ArkDocker] Deleting server: ${serverId}`);

      // Stop the server first
      await this.stop(serverId);

      const serverDataDir = join(this.dataDir, serverId);
      const composePath = join(serverDataDir, 'docker-compose.yml');

      if (existsSync(composePath)) {
        // Remove volumes
        await this.executeCommand('docker-compose', ['-f', composePath, 'down', '-v'], {
          cwd: serverDataDir,
        });
      }

      // Remove server directory
      await rm(serverDataDir, { recursive: true, force: true });

      logger.info(`[ArkDocker] Server deleted: ${serverId}`);
      this.emit('server-deleted', { serverId });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(`[ArkDocker] Failed to delete server ${serverId}`, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get server logs
   */
  async getLogs(serverId: string, lines: number = 100): Promise<{ success: boolean; logs?: string; error?: string }> {
    try {
      logger.info(`[ArkDocker] Fetching logs for server: ${serverId}`);

      const containerId = await this.getContainerId(serverId);

      if (!containerId) {
        throw new Error(`Container not found for server: ${serverId}`);
      }

      const output = await this.executeCommand('docker', ['logs', '--tail', String(lines), containerId]);

      return { success: true, logs: output };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(`[ArkDocker] Failed to fetch logs for ${serverId}`, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get server status
   */
  async getStatus(serverId: string): Promise<ServerStatus> {
    try {
      const containerId = await this.getContainerId(serverId);

      if (!containerId) {
        return {
          status: 'stopped',
          lastUpdate: new Date(),
        };
      }

      const inspectOutput = await this.executeCommand('docker', ['inspect', containerId]);
      const containerData = JSON.parse(inspectOutput)[0];

      const stats = await this.executeCommand('docker', ['stats', '--no-stream', '--format', '{{json .}}', containerId]);
      const statsData = JSON.parse(stats);

      return {
        status: containerData.State.Running ? 'running' : 'stopped',
        containerId,
        memory: parseInt(statsData.MemUsage?.split('M')[0] || '0'),
        cpu: parseInt(statsData.CPUPerc?.replace('%', '')?.split('.')[0] || '0'),
        uptime: containerData.State.Running
          ? Math.floor((Date.now() - new Date(containerData.State.StartedAt).getTime()) / 1000)
          : 0,
        lastUpdate: new Date(),
      };
    } catch (error: any) {
      logger.error(`[ArkDocker] Failed to get status for ${serverId}`, error as Error);
      return {
        status: 'error',
        lastUpdate: new Date(),
      };
    }
  }

  /**
   * Execute a command inside container
   */
  async executeInContainer(serverId: string, command: string[]): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      const containerId = await this.getContainerId(serverId);

      if (!containerId) {
        throw new Error(`Container not found for server: ${serverId}`);
      }

      const output = await this.executeCommand('docker', ['exec', containerId, ...command]);

      return { success: true, output };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      logger.error(`[ArkDocker] Failed to execute command in ${serverId}`, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get container ID by server ID
   */
  private async getContainerId(serverId: string): Promise<string | null> {
    try {
      const output = await this.executeCommand('docker', [
        'ps',
        '--all',
        '--filter',
        `label=zed.server-id=${serverId}`,
        '--format',
        '{{.ID}}',
      ]);

      return output.trim() || null;
    } catch (error) {
      logger.warn(`[ArkDocker] Could not get container ID for ${serverId}`);
      return null;
    }
  }

  /**
   * Validate server configuration
   */
  private validateConfig(config: ArkServerConfig): void {
    if (!config.serverId || !config.serverName || !config.adminPassword) {
      throw new Error('Missing required configuration: serverId, serverName, adminPassword');
    }

    if (config.serverPort < 1024 || config.serverPort > 65535) {
      throw new Error('Invalid server port range');
    }

    if (config.queryPort < 1024 || config.queryPort > 65535) {
      throw new Error('Invalid query port range');
    }

    if (config.serverPort === config.queryPort) {
      throw new Error('Server port and query port must be different');
    }

    if (config.difficulty < 0.5 || config.difficulty > 4.0) {
      throw new Error('Difficulty must be between 0.5 and 4.0');
    }

    if (config.maxPlayers < 1 || config.maxPlayers > 1000) {
      throw new Error('Max players must be between 1 and 1000');
    }

    if (!['ark-ascended', 'ark-evolved'].includes(config.gameType)) {
      throw new Error('Invalid game type. Must be ark-ascended or ark-evolved');
    }
  }

  /**
   * Generate environment file content
   */
  private generateEnvFile(config: ArkServerConfig): string {
    return `# ARK Server Configuration - ${config.serverId}
# Generated: ${new Date().toISOString()}

# Server Configuration
SERVER_NAME=${this.escapeEnv(config.serverName)}
SERVER_PORT=${config.serverPort}
QUERY_PORT=${config.queryPort}
STEAM_API_KEY=${config.steamApiKey}

# Game Settings
MAP_NAME=${config.mapName}
MAX_PLAYERS=${config.maxPlayers}
DIFFICULTY=${config.difficulty}
SERVER_PASSWORD=${config.serverPassword || ''}
ADMIN_PASSWORD=${config.adminPassword}

# Cluster Configuration
CLUSTER_ID=${config.clusterId || ''}
CLUSTER_MODE=${config.clusterMode ? 'true' : 'false'}

# Server Options
ENABLE_PVP=${config.enablePvp !== false ? 'true' : 'false'}
ENABLE_CROSSHAIR=${config.enableCrosshair !== false ? 'true' : 'false'}
DISABLE_STRUCTURE_PLACEMENT_COLLISION=${config.customEngineIni ? 'true' : 'false'}
OVERRIDE_DIFFICULTY_OFFSET=${config.difficulty}

# Resource Limits
RAM_MB=${config.ramMb || 8192}

# Custom Configuration
CUSTOM_ENGINE_INI=${this.escapeEnv(config.customEngineIni || '')}
CUSTOM_GAME_INI=${this.escapeEnv(config.customGameIni || '')}
`;
  }

  /**
   * Generate docker-compose file content
   */
  private generateDockerCompose(config: ArkServerConfig): string {
    const serviceKey = `ark-${config.gameType.split('-')[1]}-${config.serverId}`;
    const imageName = `zedin-gaming/${config.gameType}:latest`;
    const volumeSuffix = `${config.serverId}`;

    return `version: '3.9'

services:
  ${serviceKey}:
    image: ${imageName}
    container_name: ${serviceKey}
    env_file:
      - .env
    ports:
      - "\${SERVER_PORT}:\${SERVER_PORT}/tcp"
      - "\${SERVER_PORT}:\${SERVER_PORT}/udp"
      - "\${QUERY_PORT}:\${QUERY_PORT}/tcp"
      - "\${QUERY_PORT}:\${QUERY_PORT}/udp"
    volumes:
      - ark-data-${volumeSuffix}:/data
      - ark-cluster:/cluster
    networks:
      - ark-network
    restart: unless-stopped
    mem_limit: \${RAM_MB}m
    cpu_shares: 1024
    labels:
      - "zed.game=${config.gameType}"
      - "zed.server-id=${config.serverId}"
      - "zed.cluster-id=\${CLUSTER_ID:-none}"
    healthcheck:
      test: ["CMD-SHELL", "ps aux | grep -i 'ArkAscendedServer\\|ShooterGameServer' | grep -v grep || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

volumes:
  ark-data-${volumeSuffix}:
    driver: local
  ark-cluster:
    driver: local

networks:
  ark-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
`;
  }

  /**
   * Parse environment file to object
   */
  private parseEnvFile(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');

      if (key && value) {
        env[key] = value;
      }
    }

    return env;
  }

  /**
   * Escape environment variable values
   */
  private escapeEnv(value: string): string {
    if (!value) return '';
    return value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * Execute system command
   */
  private executeCommand(
    command: string,
    args: string[] = [],
    options: any = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const output = execSync(`${command} ${args.join(' ')}`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          maxBuffer: 10 * 1024 * 1024,
          ...options,
        });

        resolve(output || '');
      } catch (error: any) {
        reject(
          new Error(
            `Command failed: ${command} ${args.join(' ')}\n${error.stderr || error.message}`
          )
        );
      }
    });
  }
}
