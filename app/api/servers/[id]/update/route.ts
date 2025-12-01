import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { ALL_GAME_SERVER_CONFIGS } from '@/lib/game-server-configs';
import { logger } from '@/lib/logger';

export async function POST(
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
        error: 'Ez a játék nem támogatja a SteamCMD frissítést'
      }, { status: 400 });
    }

    const machine = server.machine;
    if (!machine) {
      return NextResponse.json({ error: 'Gépet nem található' }, { status: 404 });
    }

    const serverPath = `/opt/servers/${serverId}`;
    const steamAppId = gameConfig.steamAppId;

    // Szerver leállítása frissítés előtt
    logger.info('Stopping server before update', { serverId, gameType: server.gameType });
    
    const stopCommand = `systemctl stop server-${serverId}.service || true`;
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      stopCommand
    );

    // Várunk egy kicsit, hogy a szerver biztosan leálljon
    await new Promise(resolve => setTimeout(resolve, 3000));

    // SteamCMD frissítés futtatása
    logger.info('Running SteamCMD update', { serverId, steamAppId });
    
    const updateCommand = `/opt/steamcmd/steamcmd.sh +force_install_dir ${serverPath} +login anonymous +app_update ${steamAppId} validate +quit`;
    
    const updateResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      updateCommand
    );

    if (updateResult.exitCode !== 0) {
      logger.error('SteamCMD update failed', new Error(updateResult.stderr || 'Unknown error'), {
        serverId,
        steamAppId,
        stderr: updateResult.stderr,
        stdout: updateResult.stdout,
      });
      return NextResponse.json(
        { error: 'Frissítés sikertelen', details: updateResult.stderr },
        { status: 500 }
      );
    }

    // Ellenőrizzük, hogy a frissítés sikeres volt-e
    const verifyCommand = `test -f ${serverPath}/steamapps/appmanifest_${steamAppId}.acf && echo "OK" || echo "FAILED"`;
    const verifyResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      verifyCommand
    );

    if (verifyResult.stdout?.trim() !== 'OK') {
      logger.error('Update verification failed', new Error('Manifest file not found'), { serverId });
      return NextResponse.json(
        { error: 'Frissítés ellenőrzése sikertelen' },
        { status: 500 }
      );
    }

    // Szerver újraindítása
    logger.info('Restarting server after update', { serverId });
    
    const restartCommand = `systemctl restart server-${serverId}.service || systemctl start server-${serverId}.service`;
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      restartCommand
    );

    logger.info('Server update completed', { serverId, gameType: server.gameType });

    return NextResponse.json({
      success: true,
      message: 'Frissítés sikeresen befejezve',
    });
  } catch (error: any) {
    const resolvedParams = params instanceof Promise ? await params : params;
    const serverId = resolvedParams.id;
    logger.error('Update error', error, { serverId });
    return NextResponse.json(
      { error: 'Hiba történt a frissítés során', details: error.message },
      { status: 500 }
    );
  }
}

