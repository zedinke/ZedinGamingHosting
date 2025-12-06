/**
 * ARK Server SSH Installation Helper
 * Handles remote Docker-based ARK installation via SSH
 */

import { executeSSHCommand } from './ssh-client';
import { prisma } from './prisma';
import { logger } from './logger';

export interface ARKInstallOptions {
  serverId: string;
  serverName: string;
  port: number;
  adminPassword: string;
  serverPassword?: string;
  maxPlayers: number;
  gameType: 'ark-ascended' | 'ark-evolved';
  mapName: string;
}

/**
 * Install ARK server remotely via SSH on dedica game machine
 */
export async function installARKServerRemote(
  machineId: string,
  options: ARKInstallOptions
): Promise<{ success: boolean; error?: string; containerId?: string }> {
  try {
    logger.info('[ARK-SSH] Installing ARK server remotely', { machineId, serverId: options.serverId });

    const machine = await prisma.serverMachine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      throw new Error(`Machine not found: ${machineId}`);
    }

    const dockerComposFile = generateDockerCompose(options);

    // SSH install script
    const installScript = `
#!/bin/bash
set -e

SERVER_ID="${options.serverId}"
GAME_TYPE="${options.gameType}"
CONTAINER_NAME="ark-\${SERVER_ID}"
WORK_DIR="/opt/ark-docker-\${SERVER_ID}"

echo "[$(date)] Starting ARK Docker installation..."

# Create working directory
mkdir -p \$WORK_DIR
cd \$WORK_DIR

# Write docker-compose.yml
cat > docker-compose.yml << 'EOFCOMPOSE'
${dockerComposFile}
EOFCOMPOSE

# Pull/ensure image exists
docker pull zedin-gaming/\${GAME_TYPE}:latest || true

# Start container
docker compose up -d

# Wait for container to be healthy (max 2 minutes)
echo "[$(date)] Waiting for container to be ready..."
for i in {1..24}; do
  if docker exec \$CONTAINER_NAME ps aux | grep -i ArkAscendedServer | grep -v grep > /dev/null 2>&1; then
    echo "[$(date)] ARK server process started successfully"
    break
  fi
  echo "Waiting... (\$i/24)"
  sleep 5
done

echo "[$(date)] Installation complete. Container: \$CONTAINER_NAME"
docker ps | grep \$CONTAINER_NAME
    `;

    logger.info('[ARK-SSH] Executing install script on remote machine', { ipAddress: machine.ipAddress });

    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort || 22,
        user: machine.sshUser || 'root',
        keyPath: machine.sshKeyPath || undefined,
      },
      installScript,
      7200000 // 2 hours timeout in milliseconds
    );

    if (result.exitCode !== 0) {
      throw new Error(`SSH installation failed: ${result.stderr || 'Unknown error'}`);
    }

    logger.info('[ARK-SSH] ARK installation completed successfully', {
      serverId: options.serverId,
      machineId,
      ipAddress: machine.ipAddress,
    });

    return {
      success: true,
      containerId: `ark-${options.serverId}`,
    };
  } catch (error: any) {
    const message = error.message || String(error);
    logger.error('[ARK-SSH] Installation failed', new Error(message));
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generate docker-compose.yml content for ARK server
 */
function generateDockerCompose(options: ARKInstallOptions): string {
  return `version: '3.9'
services:
  ark-server:
    image: zedin-gaming/${options.gameType}:latest
    container_name: ark-${options.serverId}
    ports:
      - '${options.port}:${options.port}/tcp'
      - '${options.port}:${options.port}/udp'
      - '${options.port + 1}:${options.port + 1}/tcp'
      - '${options.port + 1}:${options.port + 1}/udp'
    environment:
      SERVER_NAME: '${options.serverName}'
      SERVER_PORT: '${options.port}'
      QUERY_PORT: '${options.port + 1}'
      STEAM_API_KEY: 'placeholder'
      MAP_NAME: '${options.mapName}'
      MAX_PLAYERS: '${options.maxPlayers}'
      DIFFICULTY: '1.0'
      SERVER_PASSWORD: '${options.serverPassword || ''}'
      ADMIN_PASSWORD: '${options.adminPassword}'
    volumes:
      - ark-server-data:/data
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'ps aux | grep -i ArkAscendedServer | grep -v grep || exit 1']
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s
volumes:
  ark-server-data:
    driver: local
`;
}

/**
 * Stop ARK server remotely
 */
export async function stopARKServerRemote(
  machineId: string,
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const machine = await prisma.serverMachine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      throw new Error(`Machine not found: ${machineId}`);
    }

    const cmd = `docker stop ark-${serverId} 2>/dev/null || true`;

    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort || 22,
        user: machine.sshUser || 'root',
        keyPath: machine.sshKeyPath || undefined,
      },
      cmd,
      30000 // 30 seconds
    );

    if (result.exitCode !== 0) {
      throw new Error(result.stderr || 'Command failed');
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete ARK server remotely
 */
export async function deleteARKServerRemote(
  machineId: string,
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const machine = await prisma.serverMachine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      throw new Error(`Machine not found: ${machineId}`);
    }

    const cmd = `
cd /opt/ark-docker-${serverId} 2>/dev/null && docker compose down -v 2>/dev/null || true
rm -rf /opt/ark-docker-${serverId}
    `;

    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort || 22,
        user: machine.sshUser || 'root',
        keyPath: machine.sshKeyPath || undefined,
      },
      cmd,
      60000 // 60 seconds
    );

    if (result.exitCode !== 0) {
      throw new Error(result.stderr || 'Command failed');
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
