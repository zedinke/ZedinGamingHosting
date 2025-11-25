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

    // Agent telepítési script létrehozása
    const installScript = generateInstallScript(managerUrl);
    const scriptPath = join('/tmp', `install-agent-${Date.now()}.sh`);
    
    // Script feltöltése SSH-n keresztül
    const uploadCommand = config.keyPath
      ? `scp -i ${config.keyPath} -P ${config.port} ${scriptPath} ${config.user}@${config.host}:/tmp/install-agent.sh`
      : `sshpass -p '${config.password}' scp -P ${config.port} ${scriptPath} ${config.user}@${config.host}:/tmp/install-agent.sh`;

    // TODO: Valós implementációban a scriptet közvetlenül SSH-n keresztül kellene futtatni
    // Jelenleg csak a logikát mutatjuk be

    logs.push('Agent telepítési script előkészítve');
    logs.push('TODO: Script feltöltése és végrehajtása SSH-n keresztül');

    // Agent ID generálása
    const agentId = `agent-${config.host.replace(/\./g, '-')}-${Date.now()}`;

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

# Agent letöltése és telepítése
cd $AGENT_DIR
# TODO: Agent kód letöltése (git clone vagy npm install)

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

