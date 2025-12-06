#!/usr/bin/env node

/**
 * Game Server Agent
 * 
 * Ez az agent a szerver gépeken fut, és kezeli a game szervereket.
 */

import axios from 'axios';
import Docker from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Konfiguráció
const config = {
  managerUrl: process.env.MANAGER_URL || 'http://localhost:3000/api/agent',
  agentId: process.env.AGENT_ID || `agent-${Date.now()}`,
  apiKey: process.env.API_KEY || '',
  serverDir: process.env.SERVER_DIR || '/opt/servers',
  backupDir: process.env.BACKUP_DIR || '/opt/backups',
  dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  systemdPrefix: process.env.SYSTEMD_PREFIX || 'server-',
  heartbeatInterval: 30000, // 30 másodperc
  taskCheckInterval: 10000, // 10 másodperc
};

// Docker client
let docker;
try {
  docker = new Docker({ socketPath: config.dockerSocket });
} catch (error) {
  console.warn('Docker nem elérhető, csak systemd használható');
}

// HTTP client
const httpClient = axios.create({
  baseURL: config.managerUrl,
  headers: {
    'X-API-Key': config.apiKey,
    'X-Registration-Token': process.env.REGISTRATION_TOKEN || 'zed_gaming_secret_123456789',
    'Content-Type': 'application/json',
  },
});

/**
 * Agent regisztráció
 */
async function registerAgent() {
  try {
    // IP-cím meghatározása
    const interfaces = os.networkInterfaces();
    let agentIp = 'localhost';
    
    // Keresünk az első nem-loopback IPv4 címet
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      for (const addr of iface) {
        // IPv4 és nem loopback
        if (addr.family === 'IPv4' && !addr.address.startsWith('127.')) {
          agentIp = addr.address;
          break;
        }
      }
      if (agentIp !== 'localhost') break;
    }

    console.log(`Agent IP-cím: ${agentIp}`);

    const response = await httpClient.post('/register', {
      agentId: config.agentId,
      agentIp: agentIp,
      version: '1.0.0',
      capabilities: {
        docker: docker !== undefined,
        systemd: true,
      },
    });

    console.log('Agent sikeresen regisztrálva:', response.data);
    return response.data;
  } catch (error) {
    console.error('Agent regisztrációs hiba:', error.message);
    throw error;
  }
}

/**
 * Heartbeat küldése
 */
async function sendHeartbeat() {
  try {
    // Erőforrás használat lekérdezése
    const resources = await getSystemResources();

    const response = await httpClient.post('/heartbeat', {
      agentId: config.agentId,
      status: 'ONLINE',
      resources,
    });

    return response.data;
  } catch (error) {
    console.error('Heartbeat hiba:', error.message);
  }
}

/**
 * Rendszer erőforrások lekérdezése
 */
async function getSystemResources() {
  try {
    // CPU használat
    const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
    const cpu = parseFloat(cpuInfo.trim()) || 0;

    // RAM használat
    const { stdout: ramInfo } = await execAsync("free -m | awk 'NR==2{printf \"%.2f\", $3*100/$2 }'");
    const ramPercent = parseFloat(ramInfo.trim()) || 0;
    const { stdout: ramTotal } = await execAsync("free -m | awk 'NR==2{print $2}'");
    const ramTotalMB = parseInt(ramTotal.trim()) || 0;
    const ram = (ramTotalMB * ramPercent / 100) || 0;

    // Disk használat
    const { stdout: diskInfo } = await execAsync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'");
    const diskPercent = parseFloat(diskInfo.trim()) || 0;
    const { stdout: diskTotal } = await execAsync("df -m / | awk 'NR==2{print $2}'");
    const diskTotalMB = parseInt(diskTotal.trim()) || 0;
    const disk = (diskTotalMB * diskPercent / 100) || 0;

    return {
      cpu,
      ram: Math.round(ram),
      disk: Math.round(disk),
      networkIn: 0, // TODO: network statisztikák
      networkOut: 0,
    };
  } catch (error) {
    console.error('Rendszer erőforrások lekérdezése hiba:', error);
    return {
      cpu: 0,
      ram: 0,
      disk: 0,
      networkIn: 0,
      networkOut: 0,
    };
  }
}

/**
 * Feladatok lekérdezése az API-ról
 */
async function getTasks() {
  try {
    const response = await api.get('/api/agent/tasks', {
      params: {
        agentId: config.agentId,
        status: 'PENDING',
      },
    });

    return response.data.tasks || [];
  } catch (error) {
    console.error('Feladatok lekérdezése hiba:', error.message);
    return [];
  }
}

/**
 * Feladat teljesítésének jelzése az API felé
 */
async function reportTaskStatus(taskId, status, result = null, error = null) {
  try {
    const response = await api.post(`/api/agent/tasks/${taskId}/complete`, {
      taskId,
      status,
      result,
      error,
    });

    return response.data;
  } catch (error) {
    console.error(`Task status report failed for ${taskId}:`, error.message);
  }
}

/**
 * Feladat végrehajtása
 */
async function executeTask(task) {
  try {
    console.log(`Feladat végrehajtása: ${task.type} (${task.id})`);

    let result;

    switch (task.type) {
      case 'PROVISION':
        result = await executeProvision(task);
        break;
      case 'DOCKER_START':
        result = await executeDockerStart(task);
        break;
      case 'DOCKER_STOP':
        result = await executeDockerStop(task);
        break;
      case 'DOCKER_DELETE':
        result = await executeDockerDelete(task);
        break;
      case 'START':
        result = await executeStart(task);
        break;
      case 'STOP':
        result = await executeStop(task);
        break;
      case 'RESTART':
        result = await executeRestart(task);
        break;
      case 'UPDATE':
        result = await executeUpdate(task);
        break;
      case 'BACKUP':
        result = await executeBackup(task);
        break;
      case 'DELETE':
        result = await executeDelete(task);
        break;
      default:
        throw new Error(`Ismeretlen feladat típus: ${task.type}`);
    }

    // Feladat befejezése
    if (result.success) {
      await reportTaskStatus(task.id, 'COMPLETED', result);
    } else {
      await reportTaskStatus(task.id, 'FAILED', result, result.error);
    }

    console.log(`Feladat sikeresen befejezve: ${task.id}`);
  } catch (error) {
    console.error(`Feladat végrehajtási hiba (${task.id}):`, error.message);

    // Feladat sikertelenség
    await reportTaskStatus(task.id, 'FAILED', null, error.message);
  }
}

/**
 * Provision feladat
 */
async function executeProvision(task) {
  const { serverId, gameType, command } = task;
  const cmdData = command || {};

  try {
    // ARK szerverek speciális kezelése
    if (gameType === 'ARK_ASCENDED' || gameType === 'ARK_EVOLVED') {
      return await provisionARKServer(serverId, gameType, cmdData);
    }

    // Egyéb játéktípusok
    const serverPath = join(config.serverDir, serverId);
    await execAsync(`mkdir -p ${serverPath}`);

    return {
      success: true,
      message: 'Szerver sikeresen létrehozva',
      serverPath,
      port: cmdData.port,
      gameType,
    };
  } catch (error) {
    console.error(`Provision failed for ${serverId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * ARK szerver telepítése Docker-ben
 */
async function provisionARKServer(serverId, gameType, cmdData) {
  try {
    const imageType = gameType === 'ARK_ASCENDED' ? 'ark-ascended' : 'ark-evolved';
    const imageName = `zedin-gaming/${imageType}:latest`;
    const containerName = `ark-${serverId}`;
    const workDir = join(config.serverDir, `ark-docker-${serverId}`);
    const serverPort = cmdData.port || 27015;
    const queryPort = serverPort + 1;

    console.log(`[ARK] Provisioning ${gameType} server: ${serverId}`);

    // 1. Könyvtár létrehozása
    await execAsync(`mkdir -p ${workDir}`);
    console.log(`[ARK] Created directory: ${workDir}`);

    // 2. Docker image pull (automatikus, docker-ből)
    console.log(`[ARK] Pulling Docker image: ${imageName}...`);
    try {
      await execAsync(`docker pull ${imageName}`);
    } catch (pullError) {
      console.warn(`[ARK] Docker pull warning (image may already exist):`, pullError.message);
    }

    // 3. docker-compose.yml generálása
    const dockerCompose = generateARKDockerCompose(serverId, gameType, cmdData, serverPort, queryPort);
    const composeFile = join(workDir, 'docker-compose.yml');
    await execAsync(`cat > ${composeFile}`, { input: dockerCompose });
    console.log(`[ARK] Generated docker-compose.yml`);

    // 4. Container indítása
    console.log(`[ARK] Starting container: ${containerName}...`);
    await execAsync(`cd ${workDir} && docker compose up -d`);

    // 5. Healthcheck: várjunk, hogy az ARK process induljon (max 2 perc)
    console.log(`[ARK] Waiting for game server process to start...`);
    let processStarted = false;
    for (let i = 0; i < 24; i++) {
      try {
        const { stdout } = await execAsync(`docker exec ${containerName} ps aux | grep -i ArkAscendedServer | grep -v grep`);
        if (stdout) {
          processStarted = true;
          console.log(`[ARK] Game server process detected!`);
          break;
        }
      } catch (e) {
        // Process nem fut még
      }
      await new Promise(r => setTimeout(r, 5000)); // 5 másodperc várakozás
    }

    if (!processStarted) {
      console.warn(`[ARK] Warning: Game server process not detected after 2 minutes`);
    }

    // 6. Port binding ellenőrzése
    try {
      const { stdout: ports } = await execAsync(`netstat -tlnup | grep ${serverPort} || ss -tlnup | grep ${serverPort}`);
      console.log(`[ARK] Port binding verified:`, ports.split('\n')[0]);
    } catch (e) {
      console.warn(`[ARK] Port binding verification skipped`);
    }

    return {
      success: true,
      message: `ARK ${gameType} server provisioned successfully`,
      serverId,
      gameType,
      containerName,
      workDir,
      serverPort,
      queryPort,
      status: processStarted ? 'running' : 'starting',
    };
  } catch (error) {
    console.error(`[ARK] Provision failed:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * ARK server docker-compose.yml generálása
 */
function generateARKDockerCompose(serverId, gameType, cmdData, serverPort, queryPort) {
  const imageType = gameType === 'ARK_ASCENDED' ? 'ark-ascended' : 'ark-evolved';
  const mapName = cmdData.mapName || (gameType === 'ARK_ASCENDED' ? 'TheIsland_WP' : 'TheIsland');
  const maxPlayers = cmdData.maxPlayers || 70;
  const serverName = cmdData.serverName || `ARK ${gameType} Server`;
  const adminPassword = cmdData.adminPassword || `admin_${serverId.substring(0, 8)}`;
  const serverPassword = cmdData.serverPassword || '';

  return `version: '3.9'
services:
  ark-server:
    image: zedin-gaming/${imageType}:latest
    container_name: ark-${serverId}
    ports:
      - '${serverPort}:${serverPort}/tcp'
      - '${serverPort}:${serverPort}/udp'
      - '${queryPort}:${queryPort}/tcp'
      - '${queryPort}:${queryPort}/udp'
    environment:
      SERVER_NAME: '${serverName}'
      SERVER_PORT: '${serverPort}'
      QUERY_PORT: '${queryPort}'
      STEAM_API_KEY: 'placeholder'
      MAP_NAME: '${mapName}'
      MAX_PLAYERS: '${maxPlayers}'
      DIFFICULTY: '1.0'
      SERVER_PASSWORD: '${serverPassword}'
      ADMIN_PASSWORD: '${adminPassword}'
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
 * Start feladat
 */
async function executeStart(task) {
  const { serverId } = task.command;
  const containerName = `server-${serverId}`;

  if (docker) {
    // Docker container indítása
    const container = docker.getContainer(containerName);
    await container.start();
  } else {
    // Systemd service indítása
    await execAsync(`systemctl start ${config.systemdPrefix}${serverId}`);
  }

  return {
    message: 'Szerver sikeresen elindítva',
  };
}

/**
 * Stop feladat
 */
async function executeStop(task) {
  const { serverId } = task.command;
  const containerName = `server-${serverId}`;

  if (docker) {
    // Docker container leállítása
    const container = docker.getContainer(containerName);
    await container.stop();
  } else {
    // Systemd service leállítása
    await execAsync(`systemctl stop ${config.systemdPrefix}${serverId}`);
  }

  return {
    message: 'Szerver sikeresen leállítva',
  };
}

/**
 * Restart feladat
 */
async function executeRestart(task) {
  const { serverId } = task.command;
  const containerName = `server-${serverId}`;

  if (docker) {
    // Docker container újraindítása
    const container = docker.getContainer(containerName);
    await container.restart();
  } else {
    // Systemd service újraindítása
    await execAsync(`systemctl restart ${config.systemdPrefix}${serverId}`);
  }

  return {
    message: 'Szerver sikeresen újraindítva',
  };
}

/**
 * Update feladat
 */
async function executeUpdate(task) {
  const { serverId } = task.command;
  // TODO: Szerver frissítés implementáció
  return {
    message: 'Szerver sikeresen frissítve',
  };
}

/**
 * Backup feladat
 */
async function executeBackup(task) {
  const { serverId, backupName } = task.command;
  const serverPath = join(config.serverDir, serverId);
  const backupPath = join(config.backupDir, serverId, `${backupName || `backup-${Date.now()}`}.tar.gz`);

  // Backup könyvtár létrehozása
  await execAsync(`mkdir -p ${join(config.backupDir, serverId)}`);

  // Backup készítése
  await execAsync(`cd ${serverPath} && tar -czf ${backupPath} .`);

  return {
    message: 'Backup sikeresen létrehozva',
    backupPath,
  };
}

/**
 * Delete feladat
 */
async function executeDelete(task) {
  const { serverId } = task.command;
  const serverPath = join(config.serverDir, serverId);

  // Szerver leállítása
  try {
    await executeStop(task);
  } catch (error) {
    // Ignore
  }

  // Szerver könyvtár törlése
  await execAsync(`rm -rf ${serverPath}`);

  return {
    message: 'Szerver sikeresen törölve',
  };
}

/**
 * Fő ciklus
 */
async function main() {
  console.log('Game Server Agent indítása...');
  console.log(`Agent ID: ${config.agentId}`);
  console.log(`Manager URL: ${config.managerUrl}`);

  // Agent regisztráció
  try {
    await registerAgent();
  } catch (error) {
    console.error('Agent regisztráció sikertelen, kilépés...');
    process.exit(1);
  }

  // Heartbeat küldése rendszeresen
  setInterval(sendHeartbeat, config.heartbeatInterval);

  // Feladatok ellenőrzése rendszeresen
  setInterval(async () => {
    const tasks = await getTasks();
    for (const task of tasks) {
      await executeTask(task);
    }
  }, config.taskCheckInterval);

  console.log('Agent fut...');
}

/**
 * Docker konténer indítása
 */
async function executeDockerStart(task) {
  const { serverId } = task;
  const containerName = `ark-${serverId}`;

  try {
    console.log(`[DOCKER_START] Starting container: ${containerName}`);

    // Container indítása
    await execAsync(`docker start ${containerName}`);
    console.log(`[DOCKER_START] Container started: ${containerName}`);

    // Healthcheck: 30 másodpercig várunk az ARK processre
    let processRunning = false;
    for (let i = 0; i < 6; i++) {
      try {
        const { stdout } = await execAsync(`docker exec ${containerName} ps aux | grep -i ArkAscendedServer | grep -v grep`);
        if (stdout) {
          processRunning = true;
          console.log(`[DOCKER_START] Game server process is running`);
          break;
        }
      } catch (e) {
        // Process nem fut még
      }
      await new Promise(r => setTimeout(r, 5000));
    }

    return {
      success: true,
      message: 'Container started successfully',
      containerName,
      processRunning,
    };
  } catch (error) {
    console.error(`[DOCKER_START] Error:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Docker konténer leállítása
 */
async function executeDockerStop(task) {
  const { serverId } = task;
  const containerName = `ark-${serverId}`;

  try {
    console.log(`[DOCKER_STOP] Stopping container: ${containerName}`);

    // Container leállítása (graceful: 30 másodperc timeout)
    await execAsync(`docker stop -t 30 ${containerName}`);
    console.log(`[DOCKER_STOP] Container stopped: ${containerName}`);

    return {
      success: true,
      message: 'Container stopped successfully',
      containerName,
    };
  } catch (error) {
    // Ha már leállt a container, ez nem hiba
    if (error.message.includes('No such container')) {
      console.warn(`[DOCKER_STOP] Container not found (already stopped?): ${containerName}`);
      return {
        success: true,
        message: 'Container not running',
        containerName,
      };
    }

    console.error(`[DOCKER_STOP] Error:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Docker konténer és adatok törlése
 */
async function executeDockerDelete(task) {
  const { serverId } = task;
  const containerName = `ark-${serverId}`;
  const volumeName = `ark-server-data`;
  const workDir = join(config.serverDir, `ark-docker-${serverId}`);

  try {
    console.log(`[DOCKER_DELETE] Deleting container and data: ${containerName}`);

    // 1. Container leállítása (ha fut)
    try {
      await execAsync(`docker stop -t 10 ${containerName}`);
      console.log(`[DOCKER_DELETE] Container stopped`);
    } catch (e) {
      console.warn(`[DOCKER_DELETE] Container already stopped`);
    }

    // 2. Container törlése
    try {
      await execAsync(`docker rm ${containerName}`);
      console.log(`[DOCKER_DELETE] Container removed`);
    } catch (e) {
      console.warn(`[DOCKER_DELETE] Container removal failed (may already be removed)`);
    }

    // 3. Volume törlése
    try {
      await execAsync(`docker volume rm ${containerName}-data`);
      console.log(`[DOCKER_DELETE] Volume removed`);
    } catch (e) {
      console.warn(`[DOCKER_DELETE] Volume removal skipped`);
    }

    // 4. Könyvtár törlése
    try {
      await execAsync(`rm -rf ${workDir}`);
      console.log(`[DOCKER_DELETE] Work directory removed`);
    } catch (e) {
      console.warn(`[DOCKER_DELETE] Directory removal failed`);
    }

    return {
      success: true,
      message: 'Container and data deleted successfully',
      containerName,
    };
  } catch (error) {
    console.error(`[DOCKER_DELETE] Error:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Signal kezelés
process.on('SIGINT', () => {
  console.log('Agent leállítása...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Agent leállítása...');
  process.exit(0);
});

// Fő ciklus indítása
main().catch((error) => {
  console.error('Fatal hiba:', error);
  process.exit(1);
});

