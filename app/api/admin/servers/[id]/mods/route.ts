import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getArkMods, getCategorizedArkMods } from '@/lib/services/curseforge-client';
import { executeSSHCommand } from '@/lib/ssh-client';

// GET - Modok és szerver mod konfiguráció
export async function GET(
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

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        gameType: true,
        configuration: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Csak Ark szerverekhez
    if (!server.gameType.includes('ARK')) {
      return NextResponse.json(
        { error: 'Mod menedzser csak Ark szerverekhez elérhető' },
        { status: 400 }
      );
    }

    // CurseForge modok lekérése
    const mods = await getArkMods();
    
    // Szerver jelenlegi mod konfigurációja
    const config = server.configuration as any || {};
    const activeMods = parseModString(config.mods || '');
    const passiveMods = parseModString(config.passivemods || '');

    return NextResponse.json({
      success: true,
      mods: mods.map((mod) => ({
        ...mod,
        active: activeMods.includes(mod.id),
        passive: passiveMods.includes(mod.id),
      })),
      activeMods,
      passiveMods,
      totalMods: mods.length,
    });
  } catch (error) {
    console.error('Get mods error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a modok lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Modok mentése a szerver konfigurációba
export async function PUT(
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
    const body = await request.json();
    const { activeMods, passiveMods } = body;

    if (!Array.isArray(activeMods) || !Array.isArray(passiveMods)) {
      return NextResponse.json(
        { error: 'Érvénytelen mod lista' },
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

    if (!server.gameType.includes('ARK')) {
      return NextResponse.json(
        { error: 'Mod menedzser csak Ark szerverekhez elérhető' },
        { status: 400 }
      );
    }

    // Mod stringek generálása
    const modsString = activeMods.join(',');
    const passiveModsString = passiveMods.join(',');

    // Szerver konfiguráció frissítése
    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        configuration: {
          ...(server.configuration as any),
          mods: modsString,
          passivemods: passiveModsString,
        },
      },
    });

    // GameUserSettings.ini frissítése az SSH-n keresztül (ha szükséges)
    if (server.agent && server.agent.machine) {
      try {
        const machine = server.agent.machine;
        const serverPath = `/opt/servers/${server.id}`;
        const configPath = `${serverPath}/ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini`;

        // Mod sorok frissítése az ini fájlban
        const updateCommand = `
if [ -f "${configPath}" ]; then
  # Biztonsági mentés
  cp "${configPath}" "${configPath}.backup.$(date +%s)"
  
  # Mod sorok frissítése vagy hozzáadása
  grep -v "^ActiveMods=" "${configPath}" | grep -v "^PassiveMods=" > "${configPath}.tmp"
  echo "ActiveMods=${modsString}" >> "${configPath}.tmp"
  echo "PassiveMods=${passiveModsString}" >> "${configPath}.tmp"
  mv "${configPath}.tmp" "${configPath}"
fi
`;

        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          updateCommand
        );
      } catch (error) {
        console.error('Error updating config on server:', error);
        // Ne fallunk le, csak loga az errort
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Modok sikeresen mentve',
      activeMods: modsString,
      passiveMods: passiveModsString,
    });
  } catch (error) {
    console.error('Save mods error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a modok mentése során' },
      { status: 500 }
    );
  }
}

/**
 * Mod string parsálása vesszővel elválasztott ID-kra
 */
function parseModString(modString: string): string[] {
  if (!modString || typeof modString !== 'string') {
    return [];
  }
  return modString
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id && /^\d+$/.test(id));
}
