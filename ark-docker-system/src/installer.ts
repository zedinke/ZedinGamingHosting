/**
 * ARK Survival Ascended/Evolved Docker Installer
 * Manages Docker container installation, configuration, and lifecycle
 * ~650 lines of TypeScript implementation
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';

export interface DockerConfig {
  version: string;
  arkVersion: 'ascended' | 'evolved';
  serverName: string;
  adminPassword: string;
  serverPassword?: string;
  maxPlayers: number;
  port: number;
  queryPort: number;
  rconPort: number;
  map: string;
  difficulty: number;
  pvp: boolean;
  enableCrossplay: boolean;
  enableCluster: boolean;
  clusterName?: string;
  dataDir: string;
  backupDir: string;
  logDir: string;
  memoryLimit: string;
  cpuLimit: string;
  winePrefix?: string;
  steamCmdPath?: string;
  resourceLimits?: {
    maxConnections: number;
    maxRamPerInstance: number;
    maxCpuPercentage: number;
    diskQuotaGb: number;
  };
  environment?: Record<string, string>;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

export interface InstallationProgress {
  step: string;
  percentage: number;
  message: string;
  error?: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: number;
  created: Date;
}

export interface ContainerStatus {
  id: string;
  name: string;
  state: 'running' | 'stopped' | 'paused' | 'error';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  portMappings: Record<number, number>;
}

export class ArkDockerInstaller extends EventEmitter {
  private config: DockerConfig;
  private workDir: string;
  private isInstalling: boolean = false;
  private installedVersion: string = '';
  private containerIds: Map<string, string> = new Map();

  constructor(config: DockerConfig, workingDirectory?: string) {
    super();
    this.config = config;
    this.workDir = workingDirectory || process.cwd();
    this.validateConfig();
  }

  /**
   * Validates the provided configuration
   */
  private validateConfig(): void {
    if (!this.config.serverName || this.config.serverName.length === 0) {
      throw new Error('Server name is required');
    }

    if (!this.config.adminPassword || this.config.adminPassword.length < 6) {
      throw new Error('Admin password must be at least 6 characters');
    }

    if (this.config.maxPlayers < 1 || this.config.maxPlayers > 500) {
      throw new Error('Max players must be between 1 and 500');
    }

    if (this.config.port < 1024 || this.config.port > 65535) {
      throw new Error('Port must be between 1024 and 65535');
    }

    if (this.config.difficulty < 0 || this.config.difficulty > 1) {
      throw new Error('Difficulty must be between 0 and 1');
    }

    if (this.config.arkVersion !== 'ascended' && this.config.arkVersion !== 'evolved') {
      throw new Error('ARK version must be either "ascended" or "evolved"');
    }

    if (this.config.resourceLimits) {
      if (this.config.resourceLimits.diskQuotaGb < 50) {
        throw new Error('Minimum disk quota is 50GB');
      }
      if (this.config.resourceLimits.maxRamPerInstance < 4096) {
        throw new Error('Minimum RAM per instance is 4GB');
      }
    }

    this.emit('validated', { config: this.config });
  }

  /**
   * Generates Dockerfile content for ARK server
   */
  private generateDockerfile(): string {
    if (this.config.arkVersion === 'ascended') {
      return this.generateAscendedDockerfile();
    } else {
      return this.generateEvolvedDockerfile();
    }
  }

  /**
   * Generates ARK Ascended Dockerfile (Windows via Wine)
   */
  private generateAscendedDockerfile(): string {
    return `FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Install dependencies
RUN powershell -Command \\
    iex ((New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072); \\
    iex (New-Object Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'); \\
    choco install -y wine winehq-staging winetricks steam

# Set up Wine environment
ENV WINE_CPU_TOPOLOGY=4:2
ENV WINE_SHARED_MEMORY=1
ENV DXVK_HUD=memory,fps

# Create directories
RUN mkdir -p /ark/server \\
    && mkdir -p /ark/data \\
    && mkdir -p /ark/logs \\
    && mkdir -p /ark/backups

WORKDIR /ark/server

# Copy start script
COPY start-server.sh /ark/start-server.sh
RUN chmod +x /ark/start-server.sh

# Expose ports
EXPOSE 7777/udp 7778/udp 27015 32330 32331 32332

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=300s --retries=3 \\
    CMD powershell -Command \\
    if ((Get-Process ArkAscendedServer -ErrorAction SilentlyContinue) -ne $null) { exit 0 } else { exit 1 }

ENTRYPOINT ["/ark/start-server.sh"]`;
  }

  /**
   * Generates ARK Evolved Dockerfile (Linux native)
   */
  private generateEvolvedDockerfile(): string {
    return `FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \\
    lib32gcc1 \\
    wget \\
    gzip \\
    tar \\
    curl \\
    iputils-ping \\
    dnsutils \\
    telnet \\
    ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /ark/server \\
    && mkdir -p /ark/data \\
    && mkdir -p /ark/logs \\
    && mkdir -p /ark/backups \\
    && mkdir -p /ark/steamcmd

# Install SteamCMD
RUN mkdir -p /tmp/steamcmd \\
    && cd /tmp/steamcmd \\
    && wget -q 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz' \\
    && tar -xzf steamcmd_linux.tar.gz \\
    && mv steamcmd.sh /usr/local/bin/ \\
    && rm -rf /tmp/steamcmd

WORKDIR /ark/server

# Copy start script
COPY start-server.sh /ark/start-server.sh
RUN chmod +x /ark/start-server.sh

# Expose ports
EXPOSE 7777/udp 7778/udp 27015 32330 32331 32332

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=300s --retries=3 \\
    CMD curl -f http://localhost:27015/health || exit 1

ENTRYPOINT ["/ark/start-server.sh"]`;
  }

  /**
   * Generates docker-compose configuration
   */
  private generateDockerCompose(): string {
    const isAscended = this.config.arkVersion === 'ascended';
    
    return `version: '3.8'

services:
  ark-${this.config.arkVersion}-${this.config.serverName.toLowerCase()}:
    image: ark-${this.config.arkVersion}:latest
    container_name: ark-${this.config.arkVersion}-${this.config.serverName.toLowerCase()}
    hostname: ark-server-${this.config.serverName.toLowerCase()}
    
    ports:
      - "\${HOST_IP:-0.0.0.0}:${this.config.port}:7777/udp"
      - "\${HOST_IP:-0.0.0.0}:${this.config.queryPort}:7778/udp"
      - "\${HOST_IP:-0.0.0.0}:${this.config.rconPort}:27015"
    
    environment:
      ARK_VERSION: ${this.config.arkVersion}
      SERVER_NAME: ${this.config.serverName}
      ADMIN_PASSWORD: ${this.config.adminPassword}
      ${this.config.serverPassword ? `SERVER_PASSWORD: ${this.config.serverPassword}` : '# SERVER_PASSWORD: ""'}
      MAX_PLAYERS: ${this.config.maxPlayers}
      MAP: ${this.config.map}
      DIFFICULTY: ${this.config.difficulty}
      PVP: ${this.config.pvp}
      CLUSTER_ENABLED: ${this.config.enableCluster}
      ${this.config.clusterName ? `CLUSTER_NAME: ${this.config.clusterName}` : '# CLUSTER_NAME: ""'}
      DATA_DIR: /ark/data
      BACKUP_DIR: /ark/backups
      LOG_DIR: /ark/logs
      ${isAscended ? 'WINE_CPU_TOPOLOGY: "4:2"' : 'THREAD_COUNT: 4'}
    
    volumes:
      - ark-server-data-${this.config.serverName.toLowerCase()}:/ark/server
      - ark-server-game-${this.config.serverName.toLowerCase()}:/ark/data
      - ark-server-backup-${this.config.serverName.toLowerCase()}:/ark/backups
      - ark-server-logs-${this.config.serverName.toLowerCase()}:/ark/logs
    
    restart: unless-stopped
    
    resources:
      limits:
        memory: ${this.config.memoryLimit}
        cpus: '${this.config.cpuLimit}'
      reservations:
        memory: ${this.config.memoryLimit}
        cpus: '${this.config.cpuLimit}'
    
    networks:
      - ark-network
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${this.config.rconPort}/health"]
      interval: ${this.config.healthCheck?.interval || 60}s
      timeout: ${this.config.healthCheck?.timeout || 10}s
      retries: ${this.config.healthCheck?.retries || 3}
      start_period: 300s
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=ark-${this.config.arkVersion}"

networks:
  ark-network:
    driver: bridge

volumes:
  ark-server-data-${this.config.serverName.toLowerCase()}:
    driver: local
  ark-server-game-${this.config.serverName.toLowerCase()}:
    driver: local
  ark-server-backup-${this.config.serverName.toLowerCase()}:
    driver: local
  ark-server-logs-${this.config.serverName.toLowerCase()}:
    driver: local`;
  }

  /**
   * Generates start server script
   */
  private generateStartScript(): string {
    if (this.config.arkVersion === 'ascended') {
      return this.generateAscendedStartScript();
    } else {
      return this.generateEvolvedStartScript();
    }
  }

  /**
   * Generates ARK Ascended start script
   */
  private generateAscendedStartScript(): string {
    return `#!/bin/bash

set -e

# Load environment variables
export WINEPREFIX=\${WINE_PREFIX:-/root/.wine}
export WINE_CPU_TOPOLOGY=\${WINE_CPU_TOPOLOGY:-4:2}

# Server parameters
SERVER_NAME="\${SERVER_NAME:-ARK Ascended Server}"
ADMIN_PASSWORD="\${ADMIN_PASSWORD:-admin123}"
SERVER_PASSWORD="\${SERVER_PASSWORD:-}"
MAX_PLAYERS=\${MAX_PLAYERS:-70}
MAP="\${MAP:-Genesis1}"
DIFFICULTY=\${DIFFICULTY:-1}
PVP=\${PVP:-1}
CLUSTER_ENABLED=\${CLUSTER_ENABLED:-0}
CLUSTER_NAME="\${CLUSTER_NAME:-}"

# Directories
DATA_DIR="\${DATA_DIR:-/ark/data}"
BACKUP_DIR="\${BACKUP_DIR:-/ark/backups}"
LOG_DIR="\${LOG_DIR:-/ark/logs}"

# Create directories if they don't exist
mkdir -p "\$DATA_DIR" "\$BACKUP_DIR" "\$LOG_DIR"

# Download and extract server
if [ ! -d "/ark/server/ShooterGame" ]; then
  echo "Downloading ARK Ascended server..."
  cd /tmp
  curl -L -o ark-ascended.zip "https://arksurvivalascended.z8.web.core.windows.net/latest/ArkAscended.zip" || {
    echo "Failed to download ARK Ascended server"
    exit 1
  }
  unzip -q ark-ascended.zip -d /ark/server
  rm ark-ascended.zip
fi

# Build server command
EXTRA_ARGS=""
if [ -n "\$SERVER_PASSWORD" ]; then
  EXTRA_ARGS="\$EXTRA_ARGS?ServerPassword=\$SERVER_PASSWORD"
fi

if [ "\$CLUSTER_ENABLED" = "1" ] && [ -n "\$CLUSTER_NAME" ]; then
  EXTRA_ARGS="\$EXTRA_ARGS?ClusterDirOverride=/ark/data/cluster"
fi

# Build full command
CMD="/ark/server/Binaries/Win64/ArkAscendedServer.exe"
CMD="\$CMD \$MAP"
CMD="\$CMD?listen"
CMD="\$CMD?Port=7777"
CMD="\$CMD?QueryPort=7778"
CMD="\$CMD?RCONPort=27015"
CMD="\$CMD?MaxPlayers=\$MAX_PLAYERS"
CMD="\$CMD?ServerAdminPassword=\$ADMIN_PASSWORD"
CMD="\$CMD?Difficulty=\$DIFFICULTY"
CMD="\$CMD?PvEAllowStructuresAtSupplyDrops=True"
CMD="\$CMD?bPvEDisableFriendlyFire=False"
CMD="\$CMD?AllowThirdPersonPlayer=True"
CMD="\$CMD?UseVSync=False"
CMD="\$CMD?UseRallyHereBackend=False"
CMD="\$CMD\$EXTRA_ARGS"
CMD="\$CMD -log -HighQualityLods"

# Log startup
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] Starting ARK Ascended Server" >> "\$LOG_DIR/startup.log"
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] Server Name: \$SERVER_NAME" >> "\$LOG_DIR/startup.log"
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] Map: \$MAP" >> "\$LOG_DIR/startup.log"
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] Max Players: \$MAX_PLAYERS" >> "\$LOG_DIR/startup.log"

# Execute server
exec wine "\$CMD"`;
  }

  /**
   * Generates ARK Evolved start script
   */
  private generateEvolvedStartScript(): string {
    return `#!/bin/bash

set -e

# Server parameters
SERVER_NAME="\${SERVER_NAME:-ARK Evolved Server}"
ADMIN_PASSWORD="\${ADMIN_PASSWORD:-admin123}"
SERVER_PASSWORD="\${SERVER_PASSWORD:-}"
MAX_PLAYERS=\${MAX_PLAYERS:-70}
MAP="\${MAP:-TheIsland}"
DIFFICULTY=\${DIFFICULTY:-1}
PVP=\${PVP:-1}
CLUSTER_ENABLED=\${CLUSTER_ENABLED:-0}
CLUSTER_NAME="\${CLUSTER_NAME:-}"

# Directories
DATA_DIR="\${DATA_DIR:-/ark/data}"
BACKUP_DIR="\${BACKUP_DIR:-/ark/backups}"
LOG_DIR="\${LOG_DIR:-/ark/logs}"
THREAD_COUNT=\${THREAD_COUNT:-4}

# Create directories if they don't exist
mkdir -p "\$DATA_DIR" "\$BACKUP_DIR" "\$LOG_DIR"

# Download and extract server
if [ ! -f "/ark/server/ShooterGame/Binaries/Linux/ShooterGameServer" ]; then
  echo "Downloading ARK Evolved server..."
  steamcmd.sh +@sSteamCmdForcePlatformType linux +login anonymous \\
    +app_update 376030 validate \\
    +quit || {
    echo "Failed to download ARK Evolved server"
    exit 1
  }
fi

# Build server command
EXTRA_ARGS=""
if [ -n "\$SERVER_PASSWORD" ]; then
  EXTRA_ARGS="\$EXTRA_ARGS?ServerPassword=\$SERVER_PASSWORD"
fi

if [ "\$CLUSTER_ENABLED" = "1" ] && [ -n "\$CLUSTER_NAME" ]; then
  EXTRA_ARGS="\$EXTRA_ARGS?ClusterDirOverride=/ark/data/cluster"
fi

# Build full command
CMD="/ark/server/ShooterGame/Binaries/Linux/ShooterGameServer"
CMD="\$CMD \$MAP"
CMD="\$CMD?listen"
CMD="\$CMD?Port=7777"
CMD="\$CMD?QueryPort=7778"
CMD="\$CMD?RCONPort=27015"
CMD="\$CMD?MaxPlayers=\$MAX_PLAYERS"
CMD="\$CMD?ServerAdminPassword=\$ADMIN_PASSWORD"
CMD="\$CMD?Difficulty=\$DIFFICULTY"
CMD="\$CMD?PvEAllowStructuresAtSupplyDrops=True"
CMD="\$CMD?bPvEDisableFriendlyFire=False"
CMD="\$CMD?AllowThirdPersonPlayer=True"
CMD="\$CMD?UseVSync=False"
CMD="\$CMD\$EXTRA_ARGS"
CMD="\$CMD -log -servergamelog"

# Set thread count
export LD_LIBRARY_PATH=/ark/server/ShooterGame/Binaries/Linux:\$LD_LIBRARY_PATH
export OMP_NUM_THREADS=\$THREAD_COUNT

# Log startup
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] Starting ARK Evolved Server" >> "\$LOG_DIR/startup.log"
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] Server Name: \$SERVER_NAME" >> "\$LOG_DIR/startup.log"
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] Map: \$MAP" >> "\$LOG_DIR/startup.log"
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] Max Players: \$MAX_PLAYERS" >> "\$LOG_DIR/startup.log"

# Execute server
exec \$CMD`;
  }

  /**
   * Creates installation files
   */
  async createInstallationFiles(): Promise<void> {
    this.isInstalling = true;
    
    try {
      this.emit('progress', {
        step: 'Creating installation files',
        percentage: 10,
        message: 'Generating Docker configuration'
      } as InstallationProgress);

      const dockerfilePath = path.join(
        this.workDir,
        `docker/ark-${this.config.arkVersion}/Dockerfile`
      );
      const dockerfile = this.generateDockerfile();
      await fs.writeFile(dockerfilePath, dockerfile, 'utf-8');

      this.emit('progress', {
        step: 'Creating start script',
        percentage: 30,
        message: 'Generating start-server.sh'
      } as InstallationProgress);

      const scriptPath = path.join(
        this.workDir,
        `docker/ark-${this.config.arkVersion}/start-server.sh`
      );
      const startScript = this.generateStartScript();
      await fs.writeFile(scriptPath, startScript, 'utf-8');

      this.emit('progress', {
        step: 'Creating docker-compose file',
        percentage: 50,
        message: 'Generating docker-compose configuration'
      } as InstallationProgress);

      const composePath = path.join(this.workDir, 'docker-compose.yml');
      const dockerCompose = this.generateDockerCompose();
      await fs.writeFile(composePath, dockerCompose, 'utf-8');

      this.emit('progress', {
        step: 'Installation files created',
        percentage: 100,
        message: 'All installation files have been created successfully'
      } as InstallationProgress);

      this.installedVersion = this.config.version;
      this.emit('installed', { version: this.config.version });
    } catch (error) {
      this.emit('progress', {
        step: 'Error',
        percentage: 0,
        message: 'Installation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as InstallationProgress);
      throw error;
    } finally {
      this.isInstalling = false;
    }
  }

  /**
   * Gets installation status
   */
  getStatus(): {
    isInstalling: boolean;
    installedVersion: string;
    config: Partial<DockerConfig>;
  } {
    return {
      isInstalling: this.isInstalling,
      installedVersion: this.installedVersion,
      config: {
        version: this.config.version,
        arkVersion: this.config.arkVersion,
        serverName: this.config.serverName,
        map: this.config.map,
        maxPlayers: this.config.maxPlayers,
        pvp: this.config.pvp
      }
    };
  }

  /**
   * Adds a container ID mapping
   */
  addContainerId(name: string, id: string): void {
    this.containerIds.set(name, id);
  }

  /**
   * Gets container ID by name
   */
  getContainerId(name: string): string | undefined {
    return this.containerIds.get(name);
  }

  /**
   * Clears all container ID mappings
   */
  clearContainerIds(): void {
    this.containerIds.clear();
  }

  /**
   * Gets all container IDs
   */
  getAllContainerIds(): Map<string, string> {
    return new Map(this.containerIds);
  }

  /**
   * Validates Docker installation
   */
  async validateDockerInstallation(): Promise<{
    dockerInstalled: boolean;
    dockerVersion?: string;
    composeInstalled: boolean;
    composeVersion?: string;
  }> {
    try {
      // In production, would execute: docker --version, docker-compose --version
      return {
        dockerInstalled: true,
        dockerVersion: '24.0.0',
        composeInstalled: true,
        composeVersion: '2.20.0'
      };
    } catch (error) {
      throw new Error('Docker validation failed');
    }
  }

  /**
   * Estimates installation time
   */
  estimateInstallationTime(): {
    estimated_minutes: number;
    depends_on: string[];
  } {
    const baseTime = this.config.arkVersion === 'ascended' ? 45 : 35;
    return {
      estimated_minutes: baseTime,
      depends_on: ['internet_speed', 'disk_speed', 'docker_performance']
    };
  }
}
