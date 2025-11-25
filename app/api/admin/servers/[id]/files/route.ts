import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';

// GET - Fájlok listázása egy szerver könyvtárában
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
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';

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

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    // SSH-n keresztül fájlok lekérdezése
    const machine = server.agent.machine;
    if (!machine.sshKeyPath && !machine.sshUser) {
      return NextResponse.json(
        { error: 'SSH konfiguráció hiányzik a gépen' },
        { status: 400 }
      );
    }

    // Szerver könyvtár útvonala (általában /opt/servers/{serverId} vagy hasonló)
    const serverPath = `/opt/servers/${server.id}`;
    const fullPath = path === '/' ? serverPath : `${serverPath}${path}`;

    // Fájlok listázása SSH-n keresztül
    const listCommand = `ls -lah "${fullPath}" | tail -n +2 | awk '{print $9"|"$5"|"$1"|"$6" "$7" "$8}'`;
    
    const sshResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      listCommand
    );

    if (sshResult.exitCode !== 0) {
      // Ha a könyvtár nem létezik, próbáljuk létrehozni
      if (sshResult.stderr.includes('No such file')) {
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `mkdir -p "${serverPath}"`
        );
        return NextResponse.json({
          path,
          files: [],
          server: {
            id: server.id,
            name: server.name,
          },
        });
      }
      return NextResponse.json(
        { error: `SSH hiba: ${sshResult.stderr}` },
        { status: 500 }
      );
    }

    // Fájlok feldolgozása
    const files = sshResult.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [name, size, permissions, date] = line.split('|');
        const isDirectory = permissions?.startsWith('d');
        return {
          name: name.trim(),
          type: isDirectory ? 'directory' : 'file',
          size: isDirectory ? 0 : parseSize(size.trim()),
          permissions: permissions?.trim(),
          modified: parseDate(date?.trim() || ''),
        };
      })
      .filter((file) => file.name && file.name !== '.' && file.name !== '..');

    return NextResponse.json({
      path,
      files,
      server: {
        id: server.id,
        name: server.name,
      },
    });
  } catch (error) {
    console.error('Files list error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a fájlok lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * Fájlméret parse-olása (ls -lh formátumból)
 */
function parseSize(size: string): number {
  if (!size) return 0;
  const units: Record<string, number> = {
    B: 1,
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
  };
  const match = size.match(/^(\d+\.?\d*)([KMGT]?)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase() || 'B';
  return Math.round(value * (units[unit] || 1));
}

/**
 * Dátum parse-olása (ls formátumból)
 */
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Próbáljuk meg parse-olni a dátumot
  // ls formátum: "Jan 1 12:00" vagy "Jan 1 2024"
  try {
    const now = new Date();
    const parts = dateStr.split(' ');
    if (parts.length >= 3) {
      const month = parts[0];
      const day = parts[1];
      const timeOrYear = parts[2];
      
      // Ha van idő (óra:perc), akkor ez az év
      if (timeOrYear.includes(':')) {
        const [hour, minute] = timeOrYear.split(':');
        const date = new Date(now.getFullYear(), getMonthIndex(month), parseInt(day), parseInt(hour), parseInt(minute));
        return date.toISOString();
      } else {
        // Ha van év
        const date = new Date(parseInt(timeOrYear), getMonthIndex(month), parseInt(day));
        return date.toISOString();
      }
    }
  } catch (error) {
    // Ha nem sikerül parse-olni, visszaadjuk az aktuális dátumot
  }
  return new Date().toISOString();
}

function getMonthIndex(month: string): number {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  return months[month] || 0;
}

// POST - Fájl műveletek (létrehozás, törlés, átnevezés)
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
    const body = await request.json();
    const { action, path, content, newPath } = body;

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

    if (!server || !server.agent) {
      return NextResponse.json(
        { error: 'Szerver vagy agent nem található' },
        { status: 404 }
      );
    }

    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    const fullPath = path === '/' ? serverPath : `${serverPath}${path}`;
    let command = '';
    let result: any;

    // SSH-n keresztül műveletek végrehajtása
    switch (action) {
      case 'create_file':
        command = `touch "${fullPath}/${content || 'newfile.txt'}"`;
        break;
      case 'create_directory':
        command = `mkdir -p "${fullPath}/${content || 'newdir'}"`;
        break;
      case 'delete':
        command = `rm -rf "${fullPath}"`;
        break;
      case 'rename':
        if (!newPath) {
          return NextResponse.json(
            { error: 'newPath szükséges az átnevezéshez' },
            { status: 400 }
          );
        }
        const newFullPath = `${serverPath}${newPath}`;
        command = `mv "${fullPath}" "${newFullPath}"`;
        break;
      case 'write':
        if (content === undefined) {
          return NextResponse.json(
            { error: 'content szükséges az íráshoz' },
            { status: 400 }
          );
        }
        // Fájl írása (base64 encode-olva, hogy speciális karaktereket is kezeljünk)
        const encodedContent = Buffer.from(content).toString('base64');
        command = `echo "${encodedContent}" | base64 -d > "${fullPath}"`;
        break;
      case 'read':
        // Fájl olvasása
        command = `cat "${fullPath}"`;
        result = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          command
        );
        if (result.exitCode !== 0) {
          return NextResponse.json(
            { error: `SSH hiba: ${result.stderr}` },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          content: result.stdout,
        });
      default:
        return NextResponse.json(
          { error: 'Érvénytelen művelet' },
          { status: 400 }
        );
    }

    if (command) {
      result = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        command
      );

      if (result.exitCode !== 0) {
        return NextResponse.json(
          { error: `SSH hiba: ${result.stderr}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Művelet sikeresen végrehajtva',
    });
  } catch (error) {
    console.error('File operation error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a művelet végrehajtása során' },
      { status: 500 }
    );
  }
}

