/**
 * Rust Server Installer
 * Template method pattern - implements BaseGameInstaller for Rust
 */

import { BaseGameInstaller, InstallConfig, PortAllocation } from '../utils/BaseGameInstaller';
import { PortManager } from '../utils/PortManager';
import { DebugLogger } from '../utils/DebugLogger';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export class RustInstaller extends BaseGameInstaller {
  private portManager: PortManager;

  constructor(machineId: string) {
    super('RUST', machineId);
    this.portManager = new PortManager();
  }

  async validateConfig(config: InstallConfig): Promise<{ valid: boolean; errors: string[] }> {
    this.logger.debug('Validating Rust server config', { serverId: config.serverId });
    const errors: string[] = [];

    // Required fields
    if (!config.serverId) errors.push('serverId is required');
    if (!config.serverName) errors.push('serverName is required');
    if (!config.adminPassword) errors.push('adminPassword is required');

    // Rust specific validations
    if (config.maxPlayers < 10 || config.maxPlayers > 1000) {
      errors.push('maxPlayers must be between 10 and 1000');
    }

    if (config.port < 10000 || config.port > 65535) {
      errors.push('port must be between 10000 and 65535');
    }

    // Seed validation (optional, 0-2147483647)
    const seed = config.seed || 0;
    if (seed < 0 || seed > 2147483647) {
      errors.push('seed must be between 0 and 2147483647');
    }

    // World size (optional, 1000-6000)
    const worldSize = config.worldSize || 3000;
    if (worldSize < 1000 || worldSize > 6000) {
      errors.push('worldSize must be between 1000 and 6000');
    }

    if (errors.length === 0) {
      this.logger.debug('Rust config validation passed', {
        serverId: config.serverId,
        maxPlayers: config.maxPlayers,
        seed,
        worldSize,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async allocatePorts(basePort: number): Promise<PortAllocation> {
    this.logger.debug('Allocating Rust ports', { basePort });

    const ports = this.portManager.allocate('RUST', basePort);

    if (!this.portManager.validate('RUST', ports)) {
      throw new Error('Port allocation validation failed');
    }

    return ports;
  }

  buildDockerCompose(config: InstallConfig, ports: PortAllocation): string {
    this.logger.debug('Building Docker Compose for Rust', { config, ports });

    const serverId = config.serverId;
    const serverName = config.serverName;
    const maxPlayers = config.maxPlayers;
    const port = ports.port;
    const queryPort = ports.queryPort || port + 1;
    const rconPort = ports.telnetPort || 8080; // Fallback port for RCON
    const seed = config.seed || 0;
    const worldSize = config.worldSize || 3000;

    const compose = `version: '3.8'

services:
  rust:
    image: didstopia/rust-server:latest
    container_name: rust-${serverId}
    restart: unless-stopped
    ports:
      - "\${DOCKER_HOST_IP}:${port}:28015/tcp"
      - "\${DOCKER_HOST_IP}:${port}:28015/udp"
      - "\${DOCKER_HOST_IP}:${queryPort}:28016/udp"
      - "\${DOCKER_HOST_IP}:${rconPort}:8080/tcp"
    environment:
      RUST_SERVER_STARTUP_COMMAND: "oxide.load Teleportation"
      RUST_SERVER_BRANCH: "public"
      RUST_SERVER_SEED: "${seed}"
      RUST_SERVER_WORLD_SIZE: "${worldSize}"
      RUST_SERVER_NAME: "${serverName}"
      RUST_SERVER_IDENTITY: "rust-${serverId}"
      RUST_SERVER_MAXPLAYERS: "${maxPlayers}"
      RUST_SERVER_DESCRIPTION: "Hosted on ZedinGaming"
      RUST_SERVER_URL: "https://zedingaming.com"
      RUST_SERVER_BANNER_URL: ""
      RUST_RCON_PASSWORD: "${config.adminPassword}"
      RUST_RCON_WEB: "1"
      RUST_RCON_IP: "0.0.0.0"
      RUST_RCON_PORT: "8080"
      RUST_AUTOUPDATE: "1"
      RUST_AUTOUPDATE_CHECKING_INTERVAL: "60"
      RUST_AUTOUPDATE_NOTICE_ENABLED: "1"
      RUST_UPDATE_BRANCH: "public"
      PUID: "1000"
      PGID: "1000"
    volumes:
      - rust-data:/home/steam/rustserver
      - rust-logs:/home/steam/rustserver/logs
    networks:
      - rust-network
    healthcheck:
      test: ["CMD", "nc", "-zv", "localhost", "${port}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 90s
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 8000M
        reservations:
          cpus: '4'
          memory: 4000M

volumes:
  rust-data:
    driver: local
  rust-logs:
    driver: local

networks:
  rust-network:
    driver: bridge
`.trim();

    return compose;
  }

  buildHealthCheck(ports: PortAllocation): string {
    return `nc -zv localhost ${ports.port}`;
  }

  async preInstall(config: InstallConfig): Promise<void> {
    this.logger.debug('Rust pre-install cleanup', { serverId: config.serverId });

    try {
      // Stop old container if exists
      await execAsync(`docker stop rust-${config.serverId} 2>/dev/null || true`);
      await execAsync(`docker rm rust-${config.serverId} 2>/dev/null || true`);
      this.logger.debug('Old Rust container stopped/removed');
    } catch (error: any) {
      this.logger.warn('Error stopping old container', error as Error);
    }

    try {
      // Create server directory
      const serverDir = `/mnt/rust/${config.serverId}`;
      if (!existsSync(serverDir)) {
        await execAsync(`mkdir -p ${serverDir}`);
        this.logger.debug('Server directory created', { path: serverDir });
      }
    } catch (error: any) {
      this.logger.warn('Error creating server directory', error as Error);
    }
  }

  async startServer(config: InstallConfig): Promise<{ success: boolean; containerId?: string; error?: string }> {
    this.logger.debug('Starting Rust server', { serverId: config.serverId });

    try {
      // Write docker-compose file
      const composeFile = `/mnt/rust/${config.serverId}/docker-compose.yml`;
      const ports = await this.allocatePorts(config.port);
      const compose = this.buildDockerCompose(config, ports);

      await mkdir(`/mnt/rust/${config.serverId}`, { recursive: true });
      await writeFile(composeFile, compose);
      this.logger.debug('Docker Compose file written', { path: composeFile });

      // Start container
      const { stdout } = await execAsync(`cd /mnt/rust/${config.serverId} && docker-compose up -d`);
      const containerId = stdout.split('\\n')[0]?.match(/[a-f0-9]{12}/)?.[0] || 'rust-' + config.serverId;

      this.logger.info('Rust server started', { containerId });
      return { success: true, containerId };
    } catch (error: any) {
      const errorMsg = error.message || error.stderr || 'Unknown error';
      this.logger.error('Failed to start Rust server', error as Error, { errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  async stopServer(config: InstallConfig): Promise<{ success: boolean; error?: string }> {
    this.logger.debug('Stopping Rust server', { serverId: config.serverId });

    try {
      await execAsync(`docker stop rust-${config.serverId} 2>/dev/null || true`);
      this.logger.info('Rust server stopped');
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      this.logger.error('Failed to stop Rust server', error as Error);
      return { success: false, error: errorMsg };
    }
  }

  async postInstall(config: InstallConfig, containerId: string): Promise<void> {
    this.logger.debug('Rust post-install setup', { containerId });

    try {
      // Wait for server to stabilize
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Set permissions
      await execAsync(`chmod -R 755 /mnt/rust/${config.serverId}`);
      this.logger.debug('Permissions set for Rust directory');

      // Create backup directory
      await execAsync(`mkdir -p /mnt/rust/${config.serverId}/backups`);
      this.logger.debug('Backup directory created');

      // Create plugin directory
      await execAsync(`mkdir -p /mnt/rust/${config.serverId}/oxide/plugins`);
      this.logger.debug('Plugin directory created');
    } catch (error: any) {
      this.logger.warn('Error during post-install setup', error as Error);
    }
  }

  async healthCheck(config: InstallConfig, ports: PortAllocation): Promise<boolean> {
    this.logger.debug('Rust health check', { port: ports.port });

    try {
      await execAsync(`nc -zv localhost ${ports.port}`);
      this.logger.info('Rust health check passed');
      return true;
    } catch (error: any) {
      this.logger.warn('Rust health check failed', error as Error);
      return false;
    }
  }
}
