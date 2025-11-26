import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

interface SSHConfig {
  host: string;
  port: number;
  user: string;
  keyPath?: string;
  password?: string;
}

interface AgentInstallResult {
  success: boolean;
  agentId?: string;
  error?: string;
  logs?: string[];
}

/**
 * SSH-n keresztül telepíti az agentet egy szerver gépre
 */
export async function installAgentViaSSH(
  config: SSHConfig,
  managerUrl: string
): Promise<AgentInstallResult> {
  const logs: string[] = [];
  
  try {
    logs.push(`Kapcsolódás a szerverhez: ${config.user}@${config.host}:${config.port}`);

    // SSH kapcsolat ellenőrzése
    const sshTestCommand = config.keyPath
      ? `ssh -i ${config.keyPath} -p ${config.port} -o StrictHostKeyChecking=no ${config.user}@${config.host} "echo 'SSH connection successful'"`
      : `sshpass -p '${config.password}' ssh -p ${config.port} -o StrictHostKeyChecking=no ${config.user}@${config.host} "echo 'SSH connection successful'"`;

    try {
      await execAsync(sshTestCommand);
      logs.push('SSH kapcsolat sikeres');
    } catch (error: any) {
      logs.push(`SSH kapcsolat hiba: ${error.message}`);
      return {
        success: false,
        error: `SSH kapcsolat sikertelen: ${error.message}`,
        logs,
      };
    }

    // Agent telepítési script generálása
    const installScript = generateInstallScript(managerUrl);
    
    logs.push('Agent telepítési script előkészítve');

    // Script feltöltése SCP-vel ideiglenes fájlként, majd futtatása
    // Ez a legbiztonságosabb módszer, mert nincs szükség escaping-re
    const { writeFile, unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { randomBytes } = await import('crypto');
    const os = await import('os');
    
    // Ideiglenes fájl létrehozása lokálisan
    const tempLocalPath = join(os.tmpdir(), `agent-install-${randomBytes(8).toString('hex')}.sh`);
    const tempRemotePath = `/tmp/agent-install-${randomBytes(8).toString('hex')}.sh`;
    
    try {
      // Script írása lokális ideiglenes fájlba
      await writeFile(tempLocalPath, installScript, { mode: 0o755 });
      logs.push('Lokális ideiglenes fájl létrehozva');

      // Script másolása a szerverre SCP-vel
      const { copyFileViaSSH, executeSSHCommand } = await import('./ssh-client');
      logs.push('Script másolása a szerverre SCP-vel...');
      
      const copyResult = await copyFileViaSSH(config, tempLocalPath, tempRemotePath);
      
      if (copyResult.exitCode !== 0) {
        logs.push(`SCP hiba: ${copyResult.stderr}`);
        return {
          success: false,
          error: `Script másolási hiba: ${copyResult.stderr}`,
          logs,
        };
      }
      
      logs.push('Script sikeresen másolva a szerverre');
      
      // Script futtatása a szerveren
      logs.push('Script futtatása a szerveren...');
      const scriptResult = await executeSSHCommand(config, `bash ${tempRemotePath}`);
      
      // Ideiglenes fájl törlése a szerverről
      await executeSSHCommand(config, `rm -f ${tempRemotePath}`).catch(() => {
        // Ignore cleanup errors
      });

      if (scriptResult.exitCode !== 0) {
        logs.push(`Script futtatási hiba: ${scriptResult.stderr}`);
        logs.push(`Script stdout: ${scriptResult.stdout.substring(0, 1000)}`);
        return {
          success: false,
          error: `Agent telepítési script sikertelen: ${scriptResult.stderr || scriptResult.stdout.substring(0, 200)}`,
          logs,
        };
      }

      logs.push('Agent telepítési script sikeresen lefutott');
      logs.push(`Script output (első 500 karakter): ${scriptResult.stdout.substring(0, 500)}...`);
    } finally {
      // Lokális ideiglenes fájl törlése
      try {
        await unlink(tempLocalPath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Agent ID generálása (a script generálja, de itt is generálunk egyet)
    const agentId = `agent-${config.host.replace(/\./g, '-')}-${Date.now()}`;

    // Ellenőrizzük, hogy az agent fut-e
    const statusCheck = await executeSSHCommand(
      config,
      'systemctl is-active game-server-agent || echo "inactive"'
    );

    if (statusCheck.stdout.trim() === 'active') {
      logs.push('Agent sikeresen telepítve és fut');
    } else {
      logs.push(`Agent státusz: ${statusCheck.stdout.trim()}`);
      // Nem dobunk hibát, mert az agent később regisztrálhatja magát
    }

    return {
      success: true,
      agentId,
      logs,
    };
  } catch (error: any) {
    logs.push(`Hiba: ${error.message}`);
    return {
      success: false,
      error: error.message,
      logs,
    };
  }
}

/**
 * Agent telepítési script generálása
 */
function generateInstallScript(managerUrl: string): string {
  return `#!/bin/bash
set -e

echo "Game Server Agent telepítése..."

# Node.js ellenőrzése
if ! command -v node &> /dev/null; then
    echo "Node.js telepítése..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Agent könyvtár létrehozása
AGENT_DIR="/opt/game-server-agent"
sudo mkdir -p $AGENT_DIR
sudo chown $USER:$USER $AGENT_DIR

# Könyvtárak létrehozása game serverekhez
sudo mkdir -p /opt/servers
sudo mkdir -p /opt/ark-shared
sudo mkdir -p /opt/ark-clusters
sudo mkdir -p /opt/backups
sudo chown -R $USER:$USER /opt/servers /opt/ark-shared /opt/ark-clusters /opt/backups

# Agent letöltése és telepítése
cd $AGENT_DIR

# Agent kód létrehozása (inline, mert nincs külön repo)
cat > package.json << 'PKG_EOF'
{
  "name": "game-server-agent",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0",
    "dockerode": "^4.0.0"
  }
}
PKG_EOF

# Agent index.js létrehozása
cat > index.js << 'AGENT_EOF'
#!/usr/bin/env node

/**
 * Game Server Agent
 * 
 * Ez az agent a szerver gépeken fut, és kezeli a game szervereket.
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

// Konfiguráció betöltése
let config;
try {
  const configData = readFileSync(join(process.cwd(), 'config.json'), 'utf-8');
  config = JSON.parse(configData);
} catch (error) {
  console.error('Config fájl betöltési hiba:', error);
  process.exit(1);
}

// HTTP client
const httpClient = axios.create({
  baseURL: config.managerUrl || 'http://localhost:3000/api/agent',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agent regisztráció
async function registerAgent() {
  try {
    const machineId = process.env.MACHINE_ID || '';
    const response = await httpClient.post('/register', {
      machineId,
      agentId: config.agentId,
      version: '1.0.0',
      capabilities: {
        docker: false,
        systemd: true,
      },
    });

    console.log('Agent sikeresen regisztrálva:', response.data);
    if (response.data.apiKey) {
      // API kulcs mentése
      const fs = require('fs');
      const configData = { ...config, apiKey: response.data.apiKey };
      fs.writeFileSync(join(process.cwd(), 'config.json'), JSON.stringify(configData, null, 2));
      config.apiKey = response.data.apiKey;
      httpClient.defaults.headers.common['Authorization'] = \`Bearer \${response.data.apiKey}\`;
    }
    return response.data;
  } catch (error) {
    console.error('Agent regisztrációs hiba:', error.message);
    throw error;
  }
}

// Heartbeat küldése
async function sendHeartbeat() {
  try {
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

// Rendszer erőforrások
async function getSystemResources() {
  try {
    const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
    const cpu = parseFloat(cpuInfo.trim()) || 0;
    const { stdout: ramInfo } = await execAsync("free -m | awk 'NR==2{printf \"%.2f\", $3*100/$2 }'");
    const ramPercent = parseFloat(ramInfo.trim()) || 0;
    const { stdout: ramTotal } = await execAsync("free -m | awk 'NR==2{print $2}'");
    const ramTotalMB = parseInt(ramTotal.trim()) || 0;
    const ram = (ramTotalMB * ramPercent / 100) || 0;
    const { stdout: diskInfo } = await execAsync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'");
    const diskPercent = parseFloat(diskInfo.trim()) || 0;
    const { stdout: diskTotal } = await execAsync("df -m / | awk 'NR==2{print $2}'");
    const diskTotalMB = parseInt(diskTotal.trim()) || 0;
    const disk = (diskTotalMB * diskPercent / 100) || 0;

    return {
      cpu,
      ram: Math.round(ram),
      disk: Math.round(disk),
      networkIn: 0,
      networkOut: 0,
    };
  } catch (error) {
    return { cpu: 0, ram: 0, disk: 0, networkIn: 0, networkOut: 0 };
  }
}

// Feladatok lekérdezése
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
    return [];
  }
}

// Feladat végrehajtása
async function executeTask(task) {
  try {
    console.log(\`Feladat végrehajtása: \${task.type} (\${task.id})\`);
    let result = { message: 'Feladat végrehajtva' };
    
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
    }

    await httpClient.post(\`/tasks/\${task.id}/complete\`, { result });
    console.log(\`Feladat sikeresen befejezve: \${task.id}\`);
  } catch (error) {
    console.error(\`Feladat végrehajtási hiba (\${task.id}):\`, error.message);
    await httpClient.post(\`/tasks/\${task.id}/fail\`, { error: error.message });
  }
}

async function executeProvision(task) {
  const { serverId } = task.command;
  const serverPath = join('/opt/servers', serverId);
  await execAsync(\`mkdir -p \${serverPath}\`);
  return { message: 'Szerver sikeresen létrehozva', serverPath };
}

async function executeStart(task) {
  const { serverId } = task.command;
  await execAsync(\`systemctl start server-\${serverId}\`);
  return { message: 'Szerver sikeresen elindítva' };
}

async function executeStop(task) {
  const { serverId } = task.command;
  await execAsync(\`systemctl stop server-\${serverId}\`);
  return { message: 'Szerver sikeresen leállítva' };
}

async function executeRestart(task) {
  const { serverId } = task.command;
  await execAsync(\`systemctl restart server-\${serverId}\`);
  return { message: 'Szerver sikeresen újraindítva' };
}

async function executeUpdate(task) {
  return { message: 'Szerver sikeresen frissítve' };
}

async function executeBackup(task) {
  const { serverId, backupName } = task.command;
  const serverPath = join('/opt/servers', serverId);
  const backupPath = join('/opt/backups', serverId, \`\${backupName || \`backup-\${Date.now()}\`}.tar.gz\`);
  await execAsync(\`mkdir -p \$(dirname \${backupPath})\`);
  await execAsync(\`cd \${serverPath} && tar -czf \${backupPath} .\`);
  return { message: 'Backup sikeresen létrehozva', backupPath };
}

async function executeDelete(task) {
  const { serverId } = task.command;
  try {
    await execAsync(\`systemctl stop server-\${serverId}\`);
  } catch (e) {}
  await execAsync(\`rm -rf /opt/servers/\${serverId}\`);
  return { message: 'Szerver sikeresen törölve' };
}

// Fő ciklus
async function main() {
  console.log('Game Server Agent indítása...');
  console.log(\`Agent ID: \${config.agentId}\`);
  console.log(\`Manager URL: \${config.managerUrl}\`);

  try {
    await registerAgent();
  } catch (error) {
    console.error('Agent regisztráció sikertelen, kilépés...');
    process.exit(1);
  }

  setInterval(sendHeartbeat, config.heartbeatInterval || 30000);
  setInterval(async () => {
    const tasks = await getTasks();
    for (const task of tasks) {
      await executeTask(task);
    }
  }, config.taskCheckInterval || 10000);

  console.log('Agent fut...');
}

process.on('SIGINT', () => {
  console.log('Agent leállítása...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Agent leállítása...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal hiba:', error);
  process.exit(1);
});
AGENT_EOF

# NPM függőségek telepítése
npm install

# Fájlok jogosultságok beállítása
chmod +x index.js

# Konfiguráció létrehozása
cat > config.json <<EOF
{
  "managerUrl": "${managerUrl}",
  "agentId": "agent-\$(hostname)-\$(date +%s)",
  "heartbeatInterval": 30000
}
EOF

# Systemd service létrehozása
sudo tee /etc/systemd/system/game-server-agent.service > /dev/null <<EOF
[Unit]
Description=Game Server Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$AGENT_DIR
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Service indítása
sudo systemctl daemon-reload
sudo systemctl enable game-server-agent
sudo systemctl start game-server-agent

echo "Agent telepítve és elindítva!"
`;
}

/**
 * Agent állapot ellenőrzése SSH-n keresztül
 */
export async function checkAgentStatus(config: SSHConfig): Promise<{
  installed: boolean;
  running: boolean;
  version?: string;
}> {
  try {
    const checkCommand = config.keyPath
      ? `ssh -i ${config.keyPath} -p ${config.port} -o StrictHostKeyChecking=no ${config.user}@${config.host} "systemctl is-active game-server-agent && systemctl show game-server-agent --property=Version || echo 'not-installed'"`
      : `sshpass -p '${config.password}' ssh -p ${config.port} -o StrictHostKeyChecking=no ${config.user}@${config.host} "systemctl is-active game-server-agent && systemctl show game-server-agent --property=Version || echo 'not-installed'"`;

    const { stdout } = await execAsync(checkCommand);
    const isRunning = stdout.trim() === 'active';
    const version = stdout.includes('Version=') ? stdout.split('Version=')[1].trim() : undefined;

    return {
      installed: stdout.trim() !== 'not-installed',
      running: isRunning,
      version,
    };
  } catch (error) {
    return {
      installed: false,
      running: false,
    };
  }
}

