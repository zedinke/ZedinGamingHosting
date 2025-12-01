import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { ALL_GAME_SERVER_CONFIGS } from '@/lib/game-server-configs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const serverId = resolvedParams.id;

    // Szerver lekérése
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        machine: true,
      },
    });

    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa-e
    if (server.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    // Játék konfiguráció lekérése
    const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];
    if (!gameConfig || !gameConfig.requiresSteamCMD || !gameConfig.steamAppId) {
      return NextResponse.json({ 
        hasUpdate: false,
        currentVersion: null,
        availableVersion: null,
        message: 'Ez a játék nem támogatja a SteamCMD frissítés ellenőrzést'
      });
    }

    const machine = server.machine;
    if (!machine) {
      return NextResponse.json({ error: 'Gépet nem található' }, { status: 404 });
    }

    const serverPath = `/opt/servers/${serverId}`;
    const steamAppId = gameConfig.steamAppId;

    // SteamCMD parancs a verzió ellenőrzéshez
    // Az app_info parancs lekéri a jelenlegi és a legújabb verziót
    const checkCommand = `/opt/steamcmd/steamcmd.sh +login anonymous +app_info ${steamAppId} +quit 2>&1 | grep -E "buildid|version" | head -10 || echo "ERROR"`;

    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      checkCommand
    );

    // Ellenőrizzük a jelenlegi telepített verziót a szerver könyvtárból
    const currentVersionCheck = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `cat ${serverPath}/steamapps/appmanifest_${steamAppId}.acf 2>/dev/null | grep -E "buildid|LastUpdated" | head -2 || echo "NOT_FOUND"`
    );

    let currentVersion: string | null = null;
    let availableVersion: string | null = null;
    let hasUpdate = false;

    // Jelenlegi verzió kinyerése
    if (currentVersionCheck.stdout && !currentVersionCheck.stdout.includes('NOT_FOUND')) {
      const buildIdMatch = currentVersionCheck.stdout.match(/buildid\s+"(\d+)"/);
      if (buildIdMatch) {
        currentVersion = buildIdMatch[1];
      }
    }

    // Elérhető verzió kinyerése a SteamCMD kimenetből
    if (result.stdout && !result.stdout.includes('ERROR')) {
      const buildIdMatches = result.stdout.match(/buildid\s+"(\d+)"/g);
      if (buildIdMatches && buildIdMatches.length > 0) {
        // Az utolsó buildid az elérhető verzió
        const lastMatch = buildIdMatches[buildIdMatches.length - 1];
        const availableBuildId = lastMatch.match(/"(\d+)"/)?.[1];
        if (availableBuildId) {
          availableVersion = availableBuildId;
        }
      }
    }

    // Frissítés ellenőrzése
    if (currentVersion && availableVersion) {
      hasUpdate = currentVersion !== availableVersion;
    } else if (availableVersion && !currentVersion) {
      // Ha nincs telepített verzió, de van elérhető, akkor nincs frissítés (még nincs telepítve)
      hasUpdate = false;
    } else if (currentVersion && !availableVersion) {
      // Ha van telepített, de nem sikerült lekérni az elérhetőt, akkor nem tudjuk
      hasUpdate = false;
    }

    return NextResponse.json({
      hasUpdate,
      currentVersion,
      availableVersion,
      gameType: server.gameType,
    });
  } catch (error: any) {
    console.error('Update check error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a frissítés ellenőrzése során', details: error.message },
      { status: 500 }
    );
  }
}

