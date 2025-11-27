import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';
import { ALL_GAME_SERVER_CONFIGS } from '@/lib/game-server-configs';

// GET - Teljes konfigurációs fájl lekérése
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { id } = params;
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

    if (!server.agentId || !server.agent?.machine) {
      return NextResponse.json(
        { error: 'Szerver nincs telepítve vagy nincs hozzárendelve gép' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];

    if (!gameConfig || !gameConfig.configPath) {
      return NextResponse.json(
        { error: 'Ehhez a játék típushoz nincs konfigurációs fájl' },
        { status: 400 }
      );
    }

    // Konfigurációs fájl elérési út meghatározása
    const isARK = server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED';
    let serverPath: string;
    
    if (isARK) {
      const { getARKSharedPath } = await import('@/lib/ark-cluster');
      const sharedPath = getARKSharedPath(server.userId, server.machineId!);
      serverPath = `${sharedPath}/instances/${server.id}`;
    } else {
      serverPath = `/opt/servers/${server.id}`;
    }

    const configPath = gameConfig.configPath.replace(/{serverId}/g, server.id);

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

      return NextResponse.json({
        success: true,
        content: fileContent.stdout || '',
        configPath,
        protectedFields: {
          ipAddress: server.ipAddress || '',
          port: server.port || 0,
          maxPlayers: server.maxPlayers,
        },
      });
    } catch (error) {
      // Ha a fájl nem létezik, üres tartalmat adunk vissza
      logger.warn('Config file not found or error reading', {
        serverId: id,
        configPath,
        error: (error as Error).message,
      });

      return NextResponse.json({
        success: true,
        content: '',
        configPath,
        protectedFields: {
          ipAddress: server.ipAddress || '',
          port: server.port || 0,
          maxPlayers: server.maxPlayers,
        },
      });
    }
  } catch (error) {
    logger.error('Get config file error', error as Error, {
      serverId: params.id,
    });
    return NextResponse.json(
      { error: 'Hiba történt a konfigurációs fájl lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Teljes konfigurációs fájl mentése
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const body = await request.json();
    const { content } = body;

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Érvénytelen tartalom' },
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

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    if (!server.agentId || !server.agent?.machine) {
      return NextResponse.json(
        { error: 'Szerver nincs telepítve vagy nincs hozzárendelve gép' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];

    if (!gameConfig || !gameConfig.configPath) {
      return NextResponse.json(
        { error: 'Ehhez a játék típushoz nincs konfigurációs fájl' },
        { status: 400 }
      );
    }

    // Konfigurációs fájl elérési út meghatározása
    const isARK = server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED';
    let serverPath: string;
    
    if (isARK) {
      const { getARKSharedPath } = await import('@/lib/ark-cluster');
      const sharedPath = getARKSharedPath(server.userId, server.machineId!);
      serverPath = `${sharedPath}/instances/${server.id}`;
    } else {
      serverPath = `/opt/servers/${server.id}`;
    }

    const configPath = gameConfig.configPath.replace(/{serverId}/g, server.id);

    // IP, port és slot szám védelem - ezeket ne lehessen módosítani
    // A tartalmat ellenőrizzük és kicseréljük a védett értékeket
    let protectedContent = protectConfigFields(
      content,
      server.gameType,
      server.ipAddress,
      server.port,
      server.maxPlayers
    );

    // Konfigurációs fájl írása SSH-n keresztül
    // Escape-elve a tartalmat a heredoc számára
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');

    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `mkdir -p $(dirname "${configPath}") && cat > "${configPath}" << 'CONFIG_FILE_EOF'\n${escapedContent}\nCONFIG_FILE_EOF`
    );

    logger.info('Config file updated', {
      serverId: id,
      gameType: server.gameType,
      configPath,
    });

    return NextResponse.json({
      success: true,
      message: 'Konfigurációs fájl sikeresen mentve',
    });
  } catch (error) {
    logger.error('Update config file error', error as Error, {
      serverId: params.id,
    });
    return NextResponse.json(
      { error: 'Hiba történt a konfigurációs fájl mentése során' },
      { status: 500 }
    );
  }
}

/**
 * IP, port és slot szám védelem - ezeket ne lehessen módosítani
 */
function protectConfigFields(
  content: string,
  gameType: string,
  ipAddress: string | null,
  port: number | null,
  maxPlayers: number
): string {
  let protected = content;

  // Játék specifikus védelem
  switch (gameType) {
    case 'MINECRAFT':
      // server-ip és server-port védelem
      if (ipAddress) {
        protected = protected.replace(/^server-ip=.*$/m, `server-ip=${ipAddress}`);
      }
      if (port) {
        protected = protected.replace(/^server-port=.*$/m, `server-port=${port}`);
      }
      protected = protected.replace(/^max-players=.*$/m, `max-players=${maxPlayers}`);
      break;

    case 'ARK_EVOLVED':
    case 'ARK_ASCENDED':
      // ServerIP és ServerPort védelem
      if (ipAddress) {
        protected = protected.replace(/^ServerIP=.*$/m, `ServerIP=${ipAddress}`);
      }
      if (port) {
        protected = protected.replace(/^ServerPort=.*$/m, `ServerPort=${port}`);
      }
      protected = protected.replace(/^MaxPlayers=.*$/m, `MaxPlayers=${maxPlayers}`);
      break;

    case 'RUST':
      // server.ip és server.port védelem
      if (ipAddress) {
        protected = protected.replace(/^server\.ip\s+".*"$/m, `server.ip "${ipAddress}"`);
      }
      if (port) {
        protected = protected.replace(/^server\.port\s+\d+$/m, `server.port ${port}`);
      }
      protected = protected.replace(/^server\.maxplayers\s+\d+$/m, `server.maxplayers ${maxPlayers}`);
      break;

    case 'PALWORLD':
      // PublicIP és PublicPort védelem
      if (ipAddress) {
        protected = protected.replace(/^PublicIP=.*$/m, `PublicIP=${ipAddress}`);
      }
      if (port) {
        protected = protected.replace(/^PublicPort=.*$/m, `PublicPort=${port}`);
      }
      protected = protected.replace(/^MaxPlayers=.*$/m, `MaxPlayers=${maxPlayers}`);
      break;

    case 'CSGO':
    case 'CS2':
      // ip és port védelem
      if (ipAddress) {
        protected = protected.replace(/^ip\s+".*"$/m, `ip "${ipAddress}"`);
      }
      if (port) {
        protected = protected.replace(/^hostport\s+\d+$/m, `hostport ${port}`);
      }
      protected = protected.replace(/^maxplayers\s+\d+$/m, `maxplayers ${maxPlayers}`);
      break;

    case 'SEVEN_DAYS_TO_DIE':
      // ServerPort védelem
      if (port) {
        protected = protected.replace(/<property\s+name="ServerPort"\s+value="[^"]*"\/>/g, `<property name="ServerPort" value="${port}"/>`);
      }
      protected = protected.replace(/<property\s+name="ServerMaxPlayerCount"\s+value="[^"]*"\/>/g, `<property name="ServerMaxPlayerCount" value="${maxPlayers}"/>`);
      break;

    case 'VALHEIM':
      // Port védelem a start script-ben
      if (port) {
        protected = protected.replace(/-port\s+\d+/g, `-port ${port}`);
      }
      break;

    case 'SATISFACTORY':
      // GamePort védelem
      if (port) {
        protected = protected.replace(/GamePort=\d+/g, `GamePort=${port}`);
      }
      protected = protected.replace(/MaxPlayers=\d+/g, `MaxPlayers=${maxPlayers}`);
      break;

    default:
      // Általános védelem - próbáljuk meg megtalálni az IP, port és maxPlayers mezőket
      if (ipAddress) {
        protected = protected.replace(/(?:ip|IP|server-ip|ServerIP|PublicIP)\s*[=:]\s*[^\s\n]+/gi, `IP=${ipAddress}`);
      }
      if (port) {
        protected = protected.replace(/(?:port|Port|server-port|ServerPort|PublicPort|hostport)\s*[=:]\s*\d+/gi, `Port=${port}`);
      }
      protected = protected.replace(/(?:max-players|MaxPlayers|maxplayers|server\.maxplayers)\s*[=:]\s*\d+/gi, `MaxPlayers=${maxPlayers}`);
  }

  return protected;
}

