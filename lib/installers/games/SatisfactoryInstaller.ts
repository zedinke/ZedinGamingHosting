/**
 * Satisfactory Server Installer
 * Template method pattern - implements BaseGameInstaller for Satisfactory
 */

import { BaseGameInstaller, InstallConfig, PortAllocation } from '../utils/BaseGameInstaller';
import { PortManager } from '../utils/PortManager';
import { DebugLogger } from '../utils/DebugLogger';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export class SatisfactoryInstaller extends BaseGameInstaller {
  private portManager: PortManager;

  constructor(machineId: string) {
    super('SATISFACTORY', machineId);
    this.portManager = new PortManager();
  }

  async validateConfig(config: InstallConfig): Promise<{ valid: boolean; errors: string[] }> {
    this.logger.debug('Validating Satisfactory server config', { serverId: config.serverId });
    const errors: string[] = [];

    // Required fields
    if (!config.serverId) errors.push('serverId is required');
    if (!config.serverName) errors.push('serverName is required');
    if (!config.adminPassword) errors.push('adminPassword is required');

    // Satisfactory specific validations
    if (config.maxPlayers < 1 || config.maxPlayers > 16) {
      errors.push('maxPlayers must be between 1 and 16 for Satisfactory');
    }

    if (config.port < 10000 || config.port > 65535) {
      errors.push('port must be between 10000 and 65535');
    }

    // RAM validation (default: 4GB, Satisfactory needs at least 8GB)
    const ram = config.ram || 8192; // MB
    if (ram < 8192 || ram > 32768) {
      errors.push('Satisfactory requires at least 8GB RAM, maximum 32GB');
    }

    if (errors.length === 0) {
      this.logger.debug('Satisfactory config validation passed', {
        serverId: config.serverId,
        maxPlayers: config.maxPlayers,
        ram: `${ram}MB`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async allocatePorts(basePort: number): Promise<PortAllocation> {
    this.logger.debug('Allocating Satisfactory ports', { basePort });

    const ports = this.portManager.allocate('SATISFACTORY', basePort);

    if (!this.portManager.validate('SATISFACTORY', ports)) {
      throw new Error('Port allocation validation failed');
    }

    return ports;
  }

  buildDockerCompose(config: InstallConfig, ports: PortAllocation): string {
    this.logger.debug('Building Docker Compose for Satisfactory', { config, ports });

    const serverId = config.serverId;
    const serverName = config.serverName;
    const maxPlayers = config.maxPlayers;
    const port = ports.port;
    const beaconPort = ports.beaconPort || port + 1;
    const queryPort = ports.queryPort || port + 2;
    const ram = config.ram || 8192; // MB

    const compose = `version: '3.8'

services:
  satisfactory:
    image: wolveix/satisfactory-server:latest
    container_name: satisfactory-${serverId}
    restart: unless-stopped
    ports:
      - "\${DOCKER_HOST_IP}:${port}:7777/tcp"
      - "\${DOCKER_HOST_IP}:${port}:7777/udp"
      - "\${DOCKER_HOST_IP}:${beaconPort}:15000/tcp"
      - "\${DOCKER_HOST_IP}:${queryPort}:15777/udp"
    environment:
      PUID: "1000"
      PGID: "1000"
      TZ: "UTC"
      MAXPLAYERS: "${maxPlayers}"
      PGPORT: "${port}"
      PGBEACONPORT: "${beaconPort}"
      PGQUERYPORT: "${queryPort}"
      GAMEPASSWORD: "${config.adminPassword}"
      SERVERPASSWORD: "${config.adminPassword}"
      SERVERNAME: "${serverName}"
      SERVERID: "${serverId}"
      AUTOPAUSING: "true"
      AUTOSAVEINTERVAL: "900"
      MGSSERVER: "true"
      EXPERIMENTAL: "false"
      VALIDATE: "true"
      MAXFPS: "60"
      NUMWORKERS: "4"
    volumes:
      - satisfactory-data:/config
      - satisfactory-saves:/config/saved-games
    networks:
      - satisfactory-network
    healthcheck:
      test: ["CMD", "nc", "-zv", "localhost", "${port}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: ${ram}M
        reservations:
          cpus: '4'
          memory: ${Math.floor(ram * 0.5)}M

volumes:
  satisfactory-data:
    driver: local
  satisfactory-saves:
    driver: local

networks:
  satisfactory-network:
    driver: bridge
`.trim();

    return compose;
  }

  buildHealthCheck(ports: PortAllocation): string {
    return `nc -zv localhost ${ports.port}`;
  }

  async preInstall(config: InstallConfig): Promise<void> {
    this.logger.debug('Satisfactory pre-install cleanup', { serverId: config.serverId });

    try {
      // Stop old container if exists
      await execAsync(`docker stop satisfactory-${config.serverId} 2>/dev/null || true`);
      await execAsync(`docker rm satisfactory-${config.serverId} 2>/dev/null || true`);
      this.logger.debug('Old Satisfactory container stopped/removed');
    } catch (error: any) {
      this.logger.warn('Error stopping old container', error as Error);
    }

    try {
      // Create server directory
      const serverDir = `/mnt/satisfactory/${config.serverId}`;
      if (!existsSync(serverDir)) {
        await execAsync(`mkdir -p ${serverDir}`);
        this.logger.debug('Server directory created', { path: serverDir });
      }
    } catch (error: any) {
      this.logger.warn('Error creating server directory', error as Error);
    }
  }

  async startServer(config: InstallConfig): Promise<{ success: boolean; containerId?: string; error?: string }> {
    this.logger.debug('Starting Satisfactory server', { serverId: config.serverId });

    try {
      // Write docker-compose file
      const composeFile = `/mnt/satisfactory/${config.serverId}/docker-compose.yml`;
      const ports = await this.allocatePorts(config.port);
      const compose = this.buildDockerCompose(config, ports);

      await mkdir(`/mnt/satisfactory/${config.serverId}`, { recursive: true });
      await writeFile(composeFile, compose);
      this.logger.debug('Docker Compose file written', { path: composeFile });

      // Start container
      const { stdout } = await execAsync(`cd /mnt/satisfactory/${config.serverId} && docker-compose up -d`);
      const containerId = stdout.split('\\n')[0]?.match(/[a-f0-9]{12}/)?.[0] || 'satisfactory-' + config.serverId;

      this.logger.info('Satisfactory server started', { containerId });
      return { success: true, containerId };
    } catch (error: any) {
      const errorMsg = error.message || error.stderr || 'Unknown error';
      this.logger.error('Failed to start Satisfactory server', error as Error, { errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  async stopServer(config: InstallConfig): Promise<{ success: boolean; error?: string }> {
    this.logger.debug('Stopping Satisfactory server', { serverId: config.serverId });

    try {
      await execAsync(`docker stop satisfactory-${config.serverId} 2>/dev/null || true`);
      this.logger.info('Satisfactory server stopped');
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      this.logger.error('Failed to stop Satisfactory server', error as Error);
      return { success: false, error: errorMsg };
    }
  }

  async postInstall(config: InstallConfig, containerId: string): Promise<void> {
    this.logger.debug('Satisfactory post-install setup', { containerId });

    try {
      // Wait for server to stabilize (Satisfactory takes longer)
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Set permissions
      await execAsync(`chmod -R 755 /mnt/satisfactory/${config.serverId}`);
      this.logger.debug('Permissions set for Satisfactory directory');

      // Create backup directory
      await execAsync(`mkdir -p /mnt/satisfactory/${config.serverId}/backups`);
      this.logger.debug('Backup directory created');

      // Create mod directory
      await execAsync(`mkdir -p /mnt/satisfactory/${config.serverId}/mods`);
      this.logger.debug('Mod directory created');
    } catch (error: any) {
      this.logger.warn('Error during post-install setup', error as Error);
    }
  }

  async healthCheck(config: InstallConfig, ports: PortAllocation): Promise<boolean> {
    this.logger.debug('Satisfactory health check', { port: ports.port });

    try {
      await execAsync(`nc -zv localhost ${ports.port}`);
      this.logger.info('Satisfactory health check passed');
      return true;
    } catch (error: any) {
      this.logger.warn('Satisfactory health check failed', error as Error);
      return false;
    }
  }
}
