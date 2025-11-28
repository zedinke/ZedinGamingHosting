import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';

// GET - Konfigurációs fájl lekérése
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
      
      // Parse config values if needed
      const values = parseConfigFile(content, configType);

      return NextResponse.json({
        success: true,
        content,
        values,
        configPath,
        protectedFields: {
          ipAddress: server.ipAddress || '',
          port: server.port || 0,
          queryPort: server.port ? server.port + 1 : 0,
          maxPlayers: server.maxPlayers,
        },
      });
    } catch (error) {
      logger.warn('Config file not found or error reading', {
        serverId: id,
        configPath,
        error: (error as Error).message,
      });

      return NextResponse.json({
        success: true,
        content: '',
        values: {},
        configPath,
        protectedFields: {
          ipAddress: server.ipAddress || '',
          port: server.port || 0,
          queryPort: server.port ? server.port + 1 : 0,
          maxPlayers: server.maxPlayers,
        },
      });
    }
  } catch (error) {
    logger.error('Get ARK config file error', error as Error, {
      serverId: params.id,
      configType: params.configType,
    });
    return NextResponse.json(
      { error: 'Hiba történt a konfigurációs fájl lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Konfigurációs fájl mentése
export async function PUT(
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

    // IP, port és slot szám védelem
    const queryPort = server.port ? server.port + 1 : 27015;
    let protectedContent = protectARKConfigFields(
      content,
      configType,
      server.ipAddress,
      server.port,
      queryPort,
      server.maxPlayers
    );

    // Konfigurációs fájl írása SSH-n keresztül
    const escapedContent = protectedContent
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

    logger.info('ARK config file updated', {
      serverId: id,
      configType,
      configPath,
    });

    return NextResponse.json({
      success: true,
      message: 'Konfigurációs fájl sikeresen mentve',
    });
  } catch (error) {
    logger.error('Update ARK config file error', error as Error, {
      serverId: params.id,
      configType: params.configType,
    });
    return NextResponse.json(
      { error: 'Hiba történt a konfigurációs fájl mentése során' },
      { status: 500 }
    );
  }
}

/**
 * Konfigurációs fájl parse-olása értékekké
 */
function parseConfigFile(content: string, configType: string): Record<string, any> {
  const values: Record<string, any> = {};
  const lines = content.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Section detection
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      continue;
    }

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      continue;
    }

    // Key=Value parsing
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      
      // Store with section prefix if needed, but also store without prefix for easier access
      const fullKey = currentSection ? `${currentSection}.${key}` : key;
      
      // Try to parse as number or boolean
      let parsedValue: any = value;
      if (value === 'True' || value === 'true') {
        parsedValue = true;
      } else if (value === 'False' || value === 'false') {
        parsedValue = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        parsedValue = Number(value);
      }
      
      // Store both with and without section prefix for flexibility
      values[fullKey] = parsedValue;
      values[key] = parsedValue; // Also store without prefix for easier access
    }
    
    // Special handling for ConfigOverrideItemMaxQuantity entries (Game.ini)
    // Format: ConfigOverrideItemMaxQuantity=(ItemClassString="...",Quantity=...)
    if (trimmed.includes('ConfigOverrideItemMaxQuantity') && trimmed.includes('ItemClassString')) {
      const itemClassMatch = trimmed.match(/ItemClassString="([^"]+)"/);
      const quantityMatch = trimmed.match(/Quantity=([\d.]+)/);
      if (itemClassMatch && quantityMatch) {
        const itemClass = itemClassMatch[1];
        const quantity = parseFloat(quantityMatch[1]);
        if (!values['ItemOverrides']) {
          values['ItemOverrides'] = [];
        }
        (values['ItemOverrides'] as Array<any>).push({
          itemClass,
          quantity,
        });
      }
    }
  }

  return values;
}

/**
 * IP, port és slot szám védelem ARK konfigurációs fájlokhoz
 */
function protectARKConfigFields(
  content: string,
  configType: string,
  ipAddress: string | null,
  port: number | null,
  queryPort: number | null,
  maxPlayers: number
): string {
  let protectedContent = content;

  if (configType === 'gameusersettings') {
    // SessionSettings section protection - match within [SessionSettings] section
    const lines = protectedContent.split('\n');
    let inSessionSettings = false;
    const protectedLines = lines.map((line) => {
      const trimmed = line.trim();
      
      // Check if we're entering SessionSettings section
      if (trimmed === '[SessionSettings]') {
        inSessionSettings = true;
        return line;
      }
      
      // Check if we're leaving SessionSettings section (new section starts)
      if (trimmed.startsWith('[') && trimmed !== '[SessionSettings]') {
        inSessionSettings = false;
        return line;
      }
      
      // Protect fields within SessionSettings section
      if (inSessionSettings) {
        if (port && /^Port\s*=\s*\d+/i.test(trimmed)) {
          return line.replace(/^Port\s*=\s*\d+/i, `Port=${port}`);
        }
        if (queryPort && /^QueryPort\s*=\s*\d+/i.test(trimmed)) {
          return line.replace(/^QueryPort\s*=\s*\d+/i, `QueryPort=${queryPort}`);
        }
        if (/^MaxPlayers\s*=\s*\d+/i.test(trimmed)) {
          return line.replace(/^MaxPlayers\s*=\s*\d+/i, `MaxPlayers=${maxPlayers}`);
        }
      }
      
      return line;
    });
    
    protectedContent = protectedLines.join('\n');
  }

  return protectedContent;
}

