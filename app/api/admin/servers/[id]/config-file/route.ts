import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';

// GET - Config fájl tartalma
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
    const file = searchParams.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'Fájlnév megadása szükséges' },
        { status: 400 }
      );
    }

    // Biztonsági ellenőrzés - csak megengedett fájlok
    const allowedFiles = [
      'GameUserSettings.ini',
      'Game.ini',
      'server.properties',
      'config.json',
    ];

    if (!allowedFiles.includes(file)) {
      return NextResponse.json(
        { error: 'Ez a fájl nem szerkeszthető' },
        { status: 403 }
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

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    
    // Fájl útvonala (játék típus alapján)
    const filePaths: Record<string, string> = {
      'GameUserSettings.ini': `${serverPath}/ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini`,
      'Game.ini': `${serverPath}/ShooterGame/Saved/Config/WindowsServer/Game.ini`,
      'server.properties': `${serverPath}/server.properties`,
    };
    
    const filePath = filePaths[file];
    if (!filePath) {
      return NextResponse.json(
        { error: 'Fájl útvonal nem definiálva' },
        { status: 400 }
      );
    }
    
    // Fájl tartalmának lekérdezése
    const sshResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `cat "${filePath}" 2>/dev/null || echo "Fájl nem található"`
    );

    return NextResponse.json({
      success: true,
      file,
      content: sshResult.stdout.trim(),
    });
  } catch (error) {
    console.error('Config file read error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a fájl betöltése során' },
      { status: 500 }
    );
  }
}

// PUT - Config fájl mentése
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
    const { file, content } = body;

    if (!file || !content) {
      return NextResponse.json(
        { error: 'Fájlnév és tartalom megadása szükséges' },
        { status: 400 }
      );
    }

    // Biztonsági ellenőrzés - csak megengedett fájlok
    const allowedFiles = [
      'GameUserSettings.ini',
      'Game.ini',
      'server.properties',
      'config.json',
    ];

    if (!allowedFiles.includes(file)) {
      return NextResponse.json(
        { error: 'Ez a fájl nem szerkeszthető' },
        { status: 403 }
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

    if (!server.agent) {
      return NextResponse.json(
        { error: 'Szerverhez nincs hozzárendelt agent' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const serverPath = `/opt/servers/${server.id}`;
    
    // Fájl útvonala
    const filePaths: Record<string, string> = {
      'GameUserSettings.ini': `${serverPath}/ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini`,
      'Game.ini': `${serverPath}/ShooterGame/Saved/Config/WindowsServer/Game.ini`,
      'server.properties': `${serverPath}/server.properties`,
    };
    
    const filePath = filePaths[file];
    if (!filePath) {
      return NextResponse.json(
        { error: 'Fájl útvonal nem definiálva' },
        { status: 400 }
      );
    }

    // Backup készítése
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `cp "${filePath}" "${filePath}.backup.$(date +%s)" 2>/dev/null || true`
    );

    // Fájl mentése (bash escape)
    const escapedContent = content.replace(/\$/g, '\\$').replace(/"/g, '\\"').replace(/`/g, '\\`');
    const writeCommand = `cat > "${filePath}" << 'EOF'\n${content}\nEOF`;
    
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      writeCommand
    );

    return NextResponse.json({
      success: true,
      message: 'Fájl sikeresen mentve',
      file,
    });
  } catch (error) {
    console.error('Config file write error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a fájl mentése során' },
      { status: 500 }
    );
  }
}
