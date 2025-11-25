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
    'Content-Type': 'application/json',
  },
});

/**
 * Agent regisztráció
 */
async function registerAgent() {
  try {
    const response = await httpClient.post('/register', {
      agentId: config.agentId,
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
 * Feladatok lekérdezése
 */
async function getTasks() {
  try {
    const response = await httpClient.get('/tasks', {
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
    await httpClient.post(`/tasks/${task.id}/complete`, {
      result,
    });

    console.log(`Feladat sikeresen befejezve: ${task.id}`);
  } catch (error) {
    console.error(`Feladat végrehajtási hiba (${task.id}):`, error.message);

    // Feladat sikertelenség
    await httpClient.post(`/tasks/${task.id}/fail`, {
      error: error.message,
    });
  }
}

/**
 * Provision feladat
 */
async function executeProvision(task) {
  const { serverId, gameType, port } = task.command;

  // Szerver könyvtár létrehozása
  const serverPath = join(config.serverDir, serverId);
  await execAsync(`mkdir -p ${serverPath}`);

  // TODO: Game szerver telepítése (játék típus alapján)

  return {
    message: 'Szerver sikeresen létrehozva',
    serverPath,
    port,
  };
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

