/**
 * ARK Ascended Game Installer
 * ~150 sor - tiszta, olvasható, moduláris
 */

import { BaseGameInstaller, InstallConfig, PortAllocation, InstallResult } from '../utils/BaseGameInstaller';
import { portManager } from '../utils/PortManager';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class ArkAscendedInstaller extends BaseGameInstaller {
  private serverDir: string;

  constructor(machineId: string) {
    super('ARK_ASCENDED', machineId);
    this.serverDir = `/opt/servers`;
  }

  async validateConfig(config: InstallConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    this.logger.debug('Validating ARK Ascended config', { config });

    if (!config.serverId) errors.push('serverId is required');
    if (!config.serverName) errors.push('serverName is required');
    if (config.maxPlayers < 1 || config.maxPlayers > 255) errors.push('maxPlayers must be 1-255');
    if (!config.adminPassword) errors.push('adminPassword is required');
    if (!config.port || config.port < 10000 || config.port > 65535) errors.push('port must be 10000-65535');

    if (errors.length > 0) {
      this.logger.error('Validation failed', undefined, { errors });
    }

    return { valid: errors.length === 0, errors };
  }

  async allocatePorts(basePort: number): Promise<PortAllocation> {
    this.logger.debug('Allocating ARK Ascended ports', { basePort });

    const ports = portManager.allocate('ARK_ASCENDED', basePort);

    // Validate
    if (!portManager.validate('ARK_ASCENDED', ports)) {
      throw new Error('Port allocation validation failed');
    }

    return ports;
  }

  buildDockerCompose(config: InstallConfig, ports: PortAllocation): string {
    this.logger.debug('Building Docker Compose', { config, ports });

    const serverId = config.serverId;
    const serverName = config.serverName;
    const serverPassword = config.serverPassword || '';
    const adminPassword = config.adminPassword;
    const maxPlayers = config.maxPlayers;
    const map = config.map || 'TheIsland_WP';
    const port = ports.port;
    const queryPort = ports.queryPort;
    const beaconPort = ports.beaconPort;
    const steamPeerPort = ports.steamPeerPort;
    const rconPort = ports.rconPort;

    const compose = `version: '3.8'

services:
  ark-ascended:
    image: zedin-gaming/ark-ascended:latest
    container_name: ark-${serverId}
    restart: unless-stopped
    ports:
      - "\${DOCKER_HOST_IP}:${port}:${port}/tcp"
      - "\${DOCKER_HOST_IP}:${port}:${port}/udp"
      - "\${DOCKER_HOST_IP}:${queryPort}:${queryPort}/tcp"
      - "\${DOCKER_HOST_IP}:${queryPort}:${queryPort}/udp"
      - "\${DOCKER_HOST_IP}:${beaconPort}:${beaconPort}/tcp"
      - "\${DOCKER_HOST_IP}:${steamPeerPort}:${steamPeerPort}/tcp"
      - "\${DOCKER_HOST_IP}:${steamPeerPort}:${steamPeerPort}/udp"
      - "\${DOCKER_HOST_IP}:${rconPort}:${rconPort}/tcp"
    environment:
      SERVER_NAME: "${serverName}"
      SERVER_PASSWORD: "${serverPassword}"
      ADMIN_PASSWORD: "${adminPassword}"
      MAX_PLAYERS: "${maxPlayers}"
      MAP: "${map}"
      PORT: "${port}"
      QUERY_PORT: "${queryPort}"
      RCON_PORT: "${rconPort}"
      SERVER_ID: "${serverId}"
    volumes:
      - ark-data:/mnt/ark
      - ark-cluster:/mnt/ark-cluster
    networks:
      - ark-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:27015/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  ark-data:
    driver: local
  ark-cluster:
    driver: local

networks:
  ark-network:
    driver: bridge
`.trim();

    return compose;
  }

  buildHealthCheck(ports: PortAllocation): string {
    return `
#!/bin/bash
# ARK Ascended Health Check
PORT=${ports.port}
QUERY_PORT=${ports.queryPort}

# TCP port check
if ! nc -z localhost $PORT; then
  echo "Game port not responding"
  exit 1
fi

# Query port check
if ! nc -z localhost $QUERY_PORT; then
  echo "Query port not responding"
  exit 1
fi

echo "ARK server is healthy"
exit 0
`;
  }

  async preInstall(config: InstallConfig): Promise<void> {
    this.logger.debug('Pre-install cleanup', { serverId: config.serverId });

    try {
      const serverPath = path.join(this.serverDir, config.serverId);

      // Cleanup régi szerver (ha van)
      try {
        await execAsync(`docker stop ark-${config.serverId} || true`);
        await execAsync(`docker rm ark-${config.serverId} || true`);
        this.logger.debug('Old container cleaned up');
      } catch (e) {
        this.logger.debug('No old container found');
      }

      // Server dir létrehozása
      await fs.mkdir(serverPath, { recursive: true });
      this.logger.debug('Server directory created', { serverPath });
    } catch (error: any) {
      this.logger.error('Pre-install failed', error);
      throw error;
    }
  }

  async startServer(config: InstallConfig): Promise<{ success: boolean; containerId?: string; error?: string }> {
    this.logger.debug('Starting Docker container', { serverId: config.serverId });

    try {
      const dockerCompose = this.buildDockerCompose(config, await this.allocatePorts(config.port));
      const serverPath = path.join(this.serverDir, config.serverId);
      const composePath = path.join(serverPath, 'docker-compose.yml');

      // Docker Compose fájl írása
      await fs.writeFile(composePath, dockerCompose);
      this.logger.debug('Docker Compose written', { composePath });

      // Container indítása
      const { stdout, stderr } = await execAsync(`cd ${serverPath} && docker-compose up -d`, {
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });

      this.logger.debug('Docker Compose executed', { stdout });

      if (stderr) {
        this.logger.warn('Docker Compose stderr', { stderr });
      }

      // Container ID lekérése
      const { stdout: containerId } = await execAsync(`docker ps --filter "name=ark-${config.serverId}" -q`);
      const id = containerId.trim();

      this.logger.info('Container started', { containerId: id });

      return {
        success: true,
        containerId: id,
      };
    } catch (error: any) {
      this.logger.error('Start server failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async stopServer(config: InstallConfig): Promise<{ success: boolean; error?: string }> {
    this.logger.debug('Stopping server', { serverId: config.serverId });

    try {
      await execAsync(`docker stop ark-${config.serverId}`);
      this.logger.info('Server stopped');
      return { success: true };
    } catch (error: any) {
      this.logger.error('Stop server failed', error);
      return { success: false, error: error.message };
    }
  }

  async postInstall(config: InstallConfig, containerId: string): Promise<void> {
    this.logger.debug('Post-install setup', { serverId: config.serverId, containerId });

    try {
      // Wait for container to stabilize
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Permissions setup
      await execAsync(`docker exec ${containerId} chmod -R 755 /mnt/ark`);

      this.logger.info('Post-install setup completed');
    } catch (error: any) {
      this.logger.warn('Post-install setup error (non-critical)', error);
    }
  }

  async healthCheck(config: InstallConfig, ports: PortAllocation): Promise<boolean> {
    this.logger.trace('Running health check', { port: ports.port });

    try {
      const { stdout } = await execAsync(
        `timeout 5 bash -c 'cat < /dev/null > /dev/tcp/127.0.0.1/${ports.port}' 2>/dev/null && echo "OK"`,
      );
      return true;
    } catch (error) {
      this.logger.trace('Health check failed', { port: ports.port });
      return false;
    }
  }
}
