/**
 * Minecraft Server Installer
 * Template method pattern - implements BaseGameInstaller for Minecraft
 */

import { BaseGameInstaller, InstallConfig, PortAllocation } from '../utils/BaseGameInstaller';
import { PortManager } from '../utils/PortManager';
import { DebugLogger } from '../utils/DebugLogger';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export class MinecraftInstaller extends BaseGameInstaller {
  private portManager: PortManager;

  constructor(machineId: string) {
    super('MINECRAFT', machineId);
    this.portManager = new PortManager();
  }

  async validateConfig(config: InstallConfig): Promise<{ valid: boolean; errors: string[] }> {
    this.logger.debug('Validating Minecraft server config', { serverId: config.serverId });
    const errors: string[] = [];

    // Required fields
    if (!config.serverId) errors.push('serverId is required');
    if (!config.serverName) errors.push('serverName is required');
    if (!config.adminPassword) errors.push('adminPassword is required');

    // Minecraft specific validations
    if (config.maxPlayers < 1 || config.maxPlayers > 100) {
      errors.push('maxPlayers must be between 1 and 100');
    }

    if (config.port < 10000 || config.port > 65535) {
      errors.push('port must be between 10000 and 65535');
    }

    // RAM validation (default: 1GB, max: 32GB)
    const ram = config.ram || 1024; // MB
    if (ram < 512 || ram > 32768) {
      errors.push('RAM must be between 512MB and 32GB');
    }

    if (errors.length === 0) {
      this.logger.debug('Minecraft config validation passed', {
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
    this.logger.debug('Allocating Minecraft ports', { basePort });

    const ports = this.portManager.allocate('MINECRAFT', basePort);

    if (!this.portManager.validate('MINECRAFT', ports)) {
      throw new Error('Port allocation validation failed');
    }

    return ports;
  }

  buildDockerCompose(config: InstallConfig, ports: PortAllocation): string {
    this.logger.debug('Building Docker Compose for Minecraft', { config, ports });

    const serverId = config.serverId;
    const serverName = config.serverName;
    const maxPlayers = config.maxPlayers;
    const port = ports.port;
    const ram = config.ram || 1024; // MB
    const javaMemory = Math.floor(ram * 0.85); // 85% for JVM

    const compose = `version: '3.8'

services:
  minecraft:
    image: itzg/minecraft-server:latest
    container_name: minecraft-${serverId}
    restart: unless-stopped
    ports:
      - "\${DOCKER_HOST_IP}:${port}:25565/tcp"
      - "\${DOCKER_HOST_IP}:${port}:25565/udp"
    environment:
      EULA: "TRUE"
      MAX_PLAYERS: "${maxPlayers}"
      MEMORY: "${ram}M"
      INIT_MEMORY: "${Math.floor(javaMemory * 0.5)}M"
      MAX_MEMORY: "${javaMemory}M"
      SERVER_NAME: "${serverName}"
      MOTD: "${serverName}"
      DIFFICULTY: "2"
      GAMEMODE: "SURVIVAL"
      PVP: "true"
      SPAWN_PROTECTION: "16"
      VIEW_DISTANCE: "10"
      SERVER_PORT: "25565"
      RCON_PORT: "25575"
      RCON_ENABLED: "true"
      RCON_PASSWORD: "${config.adminPassword}"
      ENABLE_QUERY: "true"
      QUERY_PORT: "25565"
      ENABLE_COMMAND_BLOCK: "true"
      ENABLE_JMX_MONITORING: "false"
      ENABLE_RCON: "true"
      SYNC_CHUNK_WRITES: "true"
      NETWORK_COMPRESSION_THRESHOLD: "256"
    volumes:
      - minecraft-data:/data
      - minecraft-logs:/data/logs
    networks:
      - minecraft-network
    healthcheck:
      test: ["CMD", "nc", "-zv", "localhost", "25565"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: ${ram}M
        reservations:
          cpus: '2'
          memory: ${Math.floor(ram * 0.5)}M

volumes:
  minecraft-data:
    driver: local
  minecraft-logs:
    driver: local

networks:
  minecraft-network:
    driver: bridge
`.trim();

    return compose;
  }

  buildHealthCheck(ports: PortAllocation): string {
    return `nc -zv localhost ${ports.port}`;
  }

  async preInstall(config: InstallConfig): Promise<void> {
    this.logger.debug('Minecraft pre-install cleanup', { serverId: config.serverId });

    try {
      // Stop old container if exists
      await execAsync(`docker stop minecraft-${config.serverId} 2>/dev/null || true`);
      await execAsync(`docker rm minecraft-${config.serverId} 2>/dev/null || true`);
      this.logger.debug('Old Minecraft container stopped/removed');
    } catch (error: any) {
      this.logger.warn('Error stopping old container', error as Error);
    }

    try {
      // Create server directory
      const serverDir = `/mnt/minecraft/${config.serverId}`;
      if (!existsSync(serverDir)) {
        await execAsync(`mkdir -p ${serverDir}`);
        this.logger.debug('Server directory created', { path: serverDir });
      }
    } catch (error: any) {
      this.logger.warn('Error creating server directory', error as Error);
    }
  }

  async startServer(config: InstallConfig): Promise<{ success: boolean; containerId?: string; error?: string }> {
    this.logger.debug('Starting Minecraft server', { serverId: config.serverId });

    try {
      // Write docker-compose file
      const composeFile = `/mnt/minecraft/${config.serverId}/docker-compose.yml`;
      const compose = this.buildDockerCompose(config, await this.allocatePorts(config.port));

      await mkdir(`/mnt/minecraft/${config.serverId}`, { recursive: true });
      await writeFile(composeFile, compose);
      this.logger.debug('Docker Compose file written', { path: composeFile });

      // Start container
      const { stdout } = await execAsync(`cd /mnt/minecraft/${config.serverId} && docker-compose up -d`);
      const containerId = stdout.split('\\n')[0]?.match(/[a-f0-9]{12}/)?.[0] || 'minecraft-' + config.serverId;

      this.logger.info('Minecraft server started', { containerId });
      return { success: true, containerId };
    } catch (error: any) {
      const errorMsg = error.message || error.stderr || 'Unknown error';
      this.logger.error('Failed to start Minecraft server', error as Error, { errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  async stopServer(config: InstallConfig): Promise<{ success: boolean; error?: string }> {
    this.logger.debug('Stopping Minecraft server', { serverId: config.serverId });

    try {
      await execAsync(`docker stop minecraft-${config.serverId} 2>/dev/null || true`);
      this.logger.info('Minecraft server stopped');
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      this.logger.error('Failed to stop Minecraft server', error as Error);
      return { success: false, error: errorMsg };
    }
  }

  async postInstall(config: InstallConfig, containerId: string): Promise<void> {
    this.logger.debug('Minecraft post-install setup', { containerId });

    try {
      // Wait for server to stabilize
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Set permissions
      await execAsync(`chmod -R 755 /mnt/minecraft/${config.serverId}`);
      this.logger.debug('Permissions set for Minecraft directory');

      // Create world backup dir
      await execAsync(`mkdir -p /mnt/minecraft/${config.serverId}/backups`);
      this.logger.debug('Backup directory created');
    } catch (error: any) {
      this.logger.warn('Error during post-install setup', error as Error);
    }
  }

  async healthCheck(config: InstallConfig, ports: PortAllocation): Promise<boolean> {
    this.logger.debug('Minecraft health check', { port: ports.port });

    try {
      await execAsync(`nc -zv localhost ${ports.port}`);
      this.logger.info('Minecraft health check passed');
      return true;
    } catch (error: any) {
      this.logger.warn('Minecraft health check failed', error as Error);
      return false;
    }
  }
}
