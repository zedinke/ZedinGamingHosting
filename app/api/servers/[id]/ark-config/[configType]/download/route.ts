import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';

// GET - Konfigurációs fájl letöltése
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; configType: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { id, configType } = params;
    const userId = (session.user as any).id;

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

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Csak ARK ASCENDED szervereknél
    if (server.gameType !== 'ARK_ASCENDED') {
      return NextResponse.json(
        { error: 'Ez a funkció csak ARK Survival Ascended szervereknél érhető el' },
        { status: 400 }
      );
    }

    if (!server.agentId || !server.agent?.machine) {
      return NextResponse.json(
        { error: 'Szerver nincs telepítve vagy nincs hozzárendelve gép' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    
    // Konfigurációs fájl elérési út meghatározása
    const { getARKSharedPath } = await import('@/lib/ark-cluster');
    const sharedPath = getARKSharedPath(server.userId, server.machineId!);
    const serverPath = `${sharedPath}/instances/${server.id}`;
    
    const configFileName = configType === 'gameusersettings' 
      ? 'GameUserSettings.ini' 
      : 'Game.ini';
    const configPath = `${serverPath}/ShooterGame/Saved/Config/LinuxServer/${configFileName}`;

    // Konfigurációs fájl olvasása SSH-n keresztül
    try {
      const fileContent = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `cat "${configPath}" 2>/dev/null || echo ""`
      );

      const content = fileContent.stdout || '';

      // Return as downloadable file
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${configFileName}"`,
        },
      });
    } catch (error) {
      logger.error('Download ARK config file error', error as Error, {
        serverId: id,
        configType,
      });
      return NextResponse.json(
        { error: 'Hiba történt a fájl letöltése során' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Download ARK config file error', error as Error, {
      serverId: params.id,
      configType: params.configType,
    });
    return NextResponse.json(
      { error: 'Hiba történt a fájl letöltése során' },
      { status: 500 }
    );
  }
}


