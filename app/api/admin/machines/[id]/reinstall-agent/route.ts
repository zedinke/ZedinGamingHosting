import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand, copyFileViaSSH } from '@/lib/ssh-client';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import os from 'os';

// POST - Agent újratelepítése egy szerver gépen (root-ként, minden root tulajdonban)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;

    const machine = await prisma.serverMachine.findUnique({
      where: { id },
      include: {
        agents: true,
      },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    // Manager URL meghatározása
    const managerUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Agent törlése az adatbázisból (ha van)
    if (machine.agents.length > 0) {
      await prisma.agent.deleteMany({
        where: { machineId: machine.id },
      });
    }

    // Agent könyvtárak törlése és újratelepítés root-ként
    // Először töröljük a meglévő agent-et
    const cleanupScript = `
#!/bin/bash
set -e

echo "=== Agent törlése és könyvtárak tisztítása ==="

# Agent leállítása (ha fut)
if systemctl is-active --quiet game-server-agent; then
  echo "Agent leállítása..."
  systemctl stop game-server-agent || true
  systemctl disable game-server-agent || true
fi

# Agent service fájl törlése
if [ -f /etc/systemd/system/game-server-agent.service ]; then
  echo "Agent service fájl törlése..."
  rm -f /etc/systemd/system/game-server-agent.service
  systemctl daemon-reload
fi

# Agent könyvtár törlése
if [ -d /opt/game-server-agent ]; then
  echo "Agent könyvtár törlése..."
  rm -rf /opt/game-server-agent
fi

echo "Tisztítás befejezve"
`;

    // Könyvtárak létrehozása root tulajdonban
    const setupDirsScript = `
#!/bin/bash
set -e

echo "=== Könyvtárak létrehozása root tulajdonban ==="

# Könyvtárak létrehozása
mkdir -p /opt/game-server-agent
mkdir -p /opt/steamcmd
mkdir -p /opt/servers
mkdir -p /opt/ark-shared
mkdir -p /opt/ark-clusters
mkdir -p /opt/backups

# Minden könyvtárat root tulajdonba teszünk
chown -R root:root /opt/game-server-agent
chown -R root:root /opt/steamcmd
chown -R root:root /opt/servers
chown -R root:root /opt/ark-shared
chown -R root:root /opt/ark-clusters
chown -R root:root /opt/backups

chmod 755 /opt/game-server-agent
chmod 755 /opt/steamcmd
chmod 755 /opt/servers
chmod 755 /opt/ark-shared
chmod 755 /opt/ark-clusters
chmod 755 /opt/backups

echo "Könyvtárak létrehozva root tulajdonban"
`;

    // Agent telepítési script (root-ként, minden root tulajdonban)
    const { generateInstallScript } = await import('@/lib/agent-installer');
    const installScript = generateInstallScript(managerUrl);
    
    // Módosítjuk a scriptet, hogy root-ként telepítse és mindent root tulajdonba tegyen
    const modifiedInstallScript = installScript
      .replace(/\$SUDO_CMD/g, '') // Sudo eltávolítása, mert root-ként futunk
      .replace(/AGENT_USER="gameserver"/g, 'AGENT_USER="root"') // Root user használata
      .replace(/AGENT_USER="\$USER"/g, 'AGENT_USER="root"') // Root user használata
      .replace(/chown \$AGENT_USER:\$AGENT_USER/g, 'chown root:root') // Root tulajdon
      .replace(/chown -R \$AGENT_USER:\$AGENT_USER/g, 'chown -R root:root'); // Root tulajdon

    // Összeállítjuk a teljes újratelepítési scriptet
    const reinstallScript = cleanupScript + setupDirsScript + modifiedInstallScript;
#!/bin/bash
set -e

echo "=== Agent újratelepítés root-ként ==="
echo "Szerver gép: ${machine.ipAddress}"

# Agent leállítása (ha fut)
if systemctl is-active --quiet game-server-agent; then
  echo "Agent leállítása..."
  systemctl stop game-server-agent || true
  systemctl disable game-server-agent || true
fi

# Agent service fájl törlése
if [ -f /etc/systemd/system/game-server-agent.service ]; then
  echo "Agent service fájl törlése..."
  rm -f /etc/systemd/system/game-server-agent.service
  systemctl daemon-reload
fi

# Agent könyvtár törlése
if [ -d /opt/game-server-agent ]; then
  echo "Agent könyvtár törlése..."
  rm -rf /opt/game-server-agent
fi

# Könyvtárak létrehozása root tulajdonban
echo "Könyvtárak létrehozása root tulajdonban..."
mkdir -p /opt/game-server-agent
mkdir -p /opt/steamcmd
mkdir -p /opt/servers
mkdir -p /opt/ark-shared
mkdir -p /opt/ark-clusters
mkdir -p /opt/backups

# Minden könyvtárat root tulajdonba teszünk
chown -R root:root /opt/game-server-agent
chown -R root:root /opt/steamcmd
chown -R root:root /opt/servers
chown -R root:root /opt/ark-shared
chown -R root:root /opt/ark-clusters
chown -R root:root /opt/backups

chmod 755 /opt/game-server-agent
chmod 755 /opt/steamcmd
chmod 755 /opt/servers
chmod 755 /opt/ark-shared
chmod 755 /opt/ark-clusters
chmod 755 /opt/backups

echo "Könyvtárak létrehozva root tulajdonban"

# Agent telepítési script letöltése és futtatása
cd /opt/game-server-agent

# Node.js telepítése (ha nincs)
if ! command -v node &> /dev/null; then
  echo "Node.js telepítése..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Agent kód letöltése
echo "Agent kód letöltése..."

# Agent fájlok létrehozása
AGENT_ID=$(openssl rand -hex 16)
echo "Agent ID generálva: $AGENT_ID"

cat > package.json << 'PKGEOF'
{
  "name": "game-server-agent",
  "version": "1.0.0",
  "main": "agent.js",
  "scripts": {
    "start": "node agent.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "ws": "^8.14.0"
  }
}
PKGEOF

cat > agent.js << 'AGENTEOF'
const axios = require('axios');
const WebSocket = require('ws');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const AGENT_ID = process.env.AGENT_ID || '';
const MANAGER_URL = process.env.MANAGER_URL || '';
const HEARTBEAT_INTERVAL = 30000; // 30 másodperc

let ws = null;
let reconnectTimeout = null;

async function sendHeartbeat() {
  try {
    const { stdout } = await execAsync('hostname');
    const hostname = stdout.trim();
    
    const { stdout: cpuInfo } = await execAsync("grep -c processor /proc/cpuinfo");
    const cpuCores = parseInt(cpuInfo.trim());
    
    const { stdout: memInfo } = await execAsync("free -b | grep Mem | awk '{print $2}'");
    const totalMem = parseInt(memInfo.trim());
    
    const { stdout: memUsed } = await execAsync("free -b | grep Mem | awk '{print $3}'");
    const usedMem = parseInt(memUsed.trim());
    
    const { stdout: diskInfo } = await execAsync("df -B1 / | tail -1 | awk '{print $2}'");
    const totalDisk = parseInt(diskInfo.trim());
    
    const { stdout: diskUsed } = await execAsync("df -B1 / | tail -1 | awk '{print $3}'");
    const usedDisk = parseInt(diskUsed.trim());

    await axios.post(\`\${MANAGER_URL}/api/agent/heartbeat\`, {
      agentId: AGENT_ID,
      hostname,
      resources: {
        cpu: {
          cores: cpuCores,
          usage: 0, // TODO: CPU usage számítás
        },
        ram: {
          total: totalMem,
          used: usedMem,
        },
        disk: {
          total: totalDisk,
          used: usedDisk,
        },
      },
    });
  } catch (error) {
    console.error('Heartbeat hiba:', error.message);
  }
}

function connect() {
  try {
    ws = new WebSocket(\`\${MANAGER_URL.replace('http', 'ws')}/api/agent/ws?agentId=\${AGENT_ID}\`);
    
    ws.on('open', () => {
      console.log('WebSocket kapcsolat létrejött');
      clearTimeout(reconnectTimeout);
    });
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Task kezelés
      } catch (error) {
        console.error('Üzenet feldolgozási hiba:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket hiba:', error);
    });
    
    ws.on('close', () => {
      console.log('WebSocket kapcsolat bezárva, újracsatlakozás 5 másodperc múlva...');
      reconnectTimeout = setTimeout(connect, 5000);
    });
  } catch (error) {
    console.error('Kapcsolódási hiba:', error);
    reconnectTimeout = setTimeout(connect, 5000);
  }
}

// Heartbeat indítása
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
sendHeartbeat();

// WebSocket kapcsolat
connect();

console.log(\`Agent indítva: \${AGENT_ID}\`);
AGENTEOF

# NPM telepítése (ha nincs)
if ! command -v npm &> /dev/null; then
  echo "NPM telepítése..."
  apt-get install -y npm
fi

# Függőségek telepítése
echo "Függőségek telepítése..."
npm install --production

# Systemd service létrehozása
cat > /etc/systemd/system/game-server-agent.service << SERVICEEOF
[Unit]
Description=Game Server Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/game-server-agent
Environment="AGENT_ID=$AGENT_ID"
Environment="MANAGER_URL=${managerUrlEscaped}"
ExecStart=/usr/bin/node /opt/game-server-agent/agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Service engedélyezése és indítása
systemctl daemon-reload
systemctl enable game-server-agent
systemctl start game-server-agent

echo "Agent sikeresen telepítve és elindítva!"
echo "Agent ID: $AGENT_ID"
`;

    // Script futtatása SSH-n keresztül (heredoc használatával)
    const { copyFileViaSSH } = await import('@/lib/ssh-client');
    const { writeFile, unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { randomBytes } = await import('crypto');
    const os = await import('os');
    
    // Ideiglenes fájl létrehozása lokálisan
    const tempLocalPath = join(os.tmpdir(), `agent-reinstall-${randomBytes(8).toString('hex')}.sh`);
    const tempRemotePath = `/tmp/agent-reinstall-${randomBytes(8).toString('hex')}.sh`;
    
    try {
      // Script írása lokális ideiglenes fájlba
      await writeFile(tempLocalPath, reinstallScript, { mode: 0o755 });
      
      // Script másolása a szerverre SCP-vel
      const copyResult = await copyFileViaSSH(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        tempLocalPath,
        tempRemotePath
      );
      
      if (copyResult.exitCode !== 0) {
        return NextResponse.json(
          {
            error: 'Script másolási hiba',
            details: copyResult.stderr,
          },
          { status: 500 }
        );
      }
      
      // Script futtatása
      const scriptResult = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `chmod +x ${tempRemotePath} && ${tempRemotePath} && rm -f ${tempRemotePath}`
      );
      
      // Lokális ideiglenes fájl törlése
      await unlink(tempLocalPath).catch(() => {});

      if (scriptResult.exitCode !== 0) {
        return NextResponse.json(
          {
            error: 'Agent újratelepítés sikertelen',
            details: scriptResult.stderr || scriptResult.stdout,
          },
          { status: 500 }
        );
      }
    } catch (fileError: any) {
      // Lokális fájl törlése hiba esetén is
      await unlink(tempLocalPath).catch(() => {});
      throw fileError;
    }

    // Agent ID kinyerése a kimenetből
    const agentIdMatch = scriptResult.stdout.match(/Agent ID: ([a-f0-9]+)/);
    const agentId = agentIdMatch ? agentIdMatch[1] : null;

    if (agentId) {
      // Agent létrehozása az adatbázisban
      await prisma.agent.create({
        data: {
          machineId: machine.id,
          agentId,
          version: '1.0.0',
          status: 'ONLINE',
          lastHeartbeat: new Date(),
        },
      });

      // Machine státusz frissítése
      await prisma.serverMachine.update({
        where: { id: machine.id },
        data: { status: 'ONLINE' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Agent sikeresen újratelepítve root-ként. Minden könyvtár root tulajdonban van.',
      agentId,
      logs: scriptResult.stdout,
    });
  } catch (error: any) {
    console.error('Agent reinstall error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt az agent újratelepítése során' },
      { status: 500 }
    );
  }
}

