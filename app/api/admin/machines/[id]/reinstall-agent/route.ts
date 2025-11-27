import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand, copyFileViaSSH } from '@/lib/ssh-client';

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
    const cleanupScript = `set -e

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
    const setupDirsScript = `echo "=== Könyvtárak létrehozása root tulajdonban ==="

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
    // Eltávolítjuk a shebang sort, mert már lesz egy az elején
    const installScriptWithoutShebang = installScript.replace(/^#!/, '');
    
    const modifiedInstallScript = installScriptWithoutShebang
      .replace(/\$SUDO_CMD/g, '') // Sudo eltávolítása, mert root-ként futunk
      .replace(/AGENT_USER="gameserver"/g, 'AGENT_USER="root"') // Root user használata
      .replace(/AGENT_USER="\$USER"/g, 'AGENT_USER="root"') // Root user használata
      .replace(/chown \$AGENT_USER:\$AGENT_USER/g, 'chown root:root') // Root tulajdon
      .replace(/chown -R \$AGENT_USER:\$AGENT_USER/g, 'chown -R root:root'); // Root tulajdon

    // Összeállítjuk a teljes újratelepítési scriptet (egy shebang az elején)
    const reinstallScript = `#!/bin/bash
${cleanupScript}

${setupDirsScript}

${modifiedInstallScript}`;

    // Script futtatása SSH-n keresztül
    const { writeFile, unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { randomBytes } = await import('crypto');
    const os = await import('os');
    
    // Ideiglenes fájl létrehozása lokálisan
    const tempLocalPath = join(os.tmpdir(), `agent-reinstall-${randomBytes(8).toString('hex')}.sh`);
    const tempRemotePath = `/tmp/agent-reinstall-${randomBytes(8).toString('hex')}.sh`;
    
    let scriptResult;
    
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
        // Lokális fájl törlése
        await unlink(tempLocalPath).catch(() => {});
        return NextResponse.json(
          {
            error: 'Script másolási hiba',
            details: copyResult.stderr,
          },
          { status: 500 }
        );
      }
      
      // Script futtatása
      scriptResult = await executeSSHCommand(
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
      return NextResponse.json(
        { error: fileError.message || 'Hiba történt az agent újratelepítése során' },
        { status: 500 }
      );
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

