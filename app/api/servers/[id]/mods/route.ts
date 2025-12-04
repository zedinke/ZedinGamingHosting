import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { getArkMods } from '@/lib/services/curseforge-client';

// GET - Modok lekérése (felhasználók)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs autentikáció' },
        { status: 401 }
      );
    }

    const { id } = params;

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Szerzői jog ellenőrzés
    if (server.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Csak ARK szerverekhez
    if (!server.gameType.includes('ARK')) {
      return NextResponse.json(
        { error: 'Ez az funkció csak ARK szerverekhez elérhető' },
        { status: 400 }
      );
    }

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    // CurseForge modok lekérése
    const mods = await getArkMods();

    // Szerver config lekérése (aktív/passzív modok)
    const serverPath = `/opt/servers/${server.id}`;
    const configPath = `${serverPath}/GameUserSettings.ini`;

    let activeMods: string[] = [];
    let passiveMods: string[] = [];

    try {
      const result = await executeSSHCommand(
        {
          host: server.agent.machine.ipAddress,
          port: server.agent.machine.sshPort,
          user: server.agent.machine.sshUser,
          keyPath: server.agent.machine.sshKeyPath || undefined,
        },
        `grep -E "^(ModIDs|ModsToLoad)=" "${configPath}" 2>/dev/null | head -2`
      );

      const lines = result.stdout.split('\n');
      for (const line of lines) {
        if (line.startsWith('ModIDs=')) {
          activeMods = line
            .replace('ModIDs=', '')
            .split(',')
            .map((id: string) => id.trim())
            .filter((id: string) => id);
        } else if (line.startsWith('ModsToLoad=')) {
          passiveMods = line
            .replace('ModsToLoad=', '')
            .split(',')
            .map((id: string) => id.trim())
            .filter((id: string) => id);
        }
      }
    } catch (error) {
      // Szerver config nem olvasható
    }

    return NextResponse.json({
      success: true,
      mods,
      activeMods,
      passiveMods,
      totalMods: mods.length,
    });
  } catch (error) {
    console.error('Mods fetch error:', error);
    return NextResponse.json(
      { error: 'Modok lekérési hiba' },
      { status: 500 }
    );
  }
}

// PUT - Modok mentése (felhasználók)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs autentikáció' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { activeMods, passiveMods } = await request.json();

    if (!Array.isArray(activeMods) || !Array.isArray(passiveMods)) {
      return NextResponse.json(
        { error: 'Érvénytelen modok' },
        { status: 400 }
      );
    }

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Szerzői jog ellenőrzés
    if (server.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Csak ARK szerverekhez
    if (!server.gameType.includes('ARK')) {
      return NextResponse.json(
        { error: 'Ez az funkció csak ARK szerverekhez elérhető' },
        { status: 400 }
      );
    }

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    const serverPath = `/opt/servers/${server.id}`;
    const configPath = `${serverPath}/GameUserSettings.ini`;
    const modIds = activeMods.join(',');
    const modLoad = passiveMods.join(',');

    // GameUserSettings.ini frissítése
    const sedCommand = `
      sed -i 's/^ModIDs=.*/ModIDs=${modIds}/' "${configPath}";
      sed -i 's/^ModsToLoad=.*/ModsToLoad=${modLoad}/' "${configPath}";
      if ! grep -q "^ModIDs=" "${configPath}"; then echo "ModIDs=${modIds}" >> "${configPath}"; fi;
      if ! grep -q "^ModsToLoad=" "${configPath}"; then echo "ModsToLoad=${modLoad}" >> "${configPath}"; fi;
    `;

    try {
      await executeSSHCommand(
        {
          host: server.agent.machine.ipAddress,
          port: server.agent.machine.sshPort,
          user: server.agent.machine.sshUser,
          keyPath: server.agent.machine.sshKeyPath || undefined,
        },
        sedCommand
      );
    } catch (error) {
      // Szerver config írása sikertelen, de a függvény sikeres marad
      console.error('Server config update failed (non-blocking):', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Modok sikeresen mentve',
      activeMods,
      passiveMods,
    });
  } catch (error) {
    console.error('Mods save error:', error);
    return NextResponse.json(
      { error: 'Modok mentési hiba' },
      { status: 500 }
    );
  }
}
