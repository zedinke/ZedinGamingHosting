import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  generateSFTPPassword,
  createSFTPUser,
  hashSFTPPassword,
} from '@/lib/sftp-user-manager';

/**
 * GET - SFTP információk lekérdezése
 * Visszaadja az SFTP kapcsolati adatokat (host, port, username)
 * A jelszó NINCS benne a válaszban biztonsági okokból
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = await Promise.resolve(params);
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Szerver lekérdezése machine információkkal
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        machine: true,
        user: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Csak a szerver tulajdonosa vagy admin láthatja
    if (server.userId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Ha nincs SFTP felhasználó, akkor nincs SFTP hozzáférés
    if (!server.sftpUsername || !server.machine) {
      return NextResponse.json(
        { error: 'SFTP hozzáférés nincs beállítva' },
        { status: 404 }
      );
    }

    // SFTP információk visszaadása (jelszó NINCS benne)
    return NextResponse.json({
      success: true,
      sftp: {
        host: server.machine.ipAddress,
        port: server.sftpPort || 22,
        username: server.sftpUsername,
        path: `/opt/servers/${server.id}`,
        note: 'A jelszó megtekintéséhez használd a jelszó újragenerálás funkciót',
      },
    });
  } catch (error) {
    logger.error('Get SFTP info error', error as Error, {
      serverId: (await Promise.resolve(params)).id,
    });
    return NextResponse.json(
      { error: 'Hiba történt az SFTP információk lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * POST - SFTP jelszó újragenerálása
 * Generál egy új SFTP jelszót és frissíti a gépen is
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = await Promise.resolve(params);
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Szerver lekérdezése machine információkkal
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        machine: true,
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

    // Csak a szerver tulajdonosa vagy admin újragenerálhatja a jelszót
    if (server.userId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    if (!server.machine) {
      return NextResponse.json(
        { error: 'A szerver gépe nem található' },
        { status: 404 }
      );
    }

    // Új SFTP jelszó generálása
    const newPassword = generateSFTPPassword();
    const hashedPassword = await hashSFTPPassword(newPassword);

    // SFTP felhasználónév generálása, ha még nincs
    const sftpUsername = server.sftpUsername || `sftp_${server.id.substring(0, 8)}`;
    const serverPath = `/opt/servers/${server.id}`;

    // SSH konfiguráció
    const sshConfig = {
      host: server.machine.ipAddress,
      port: server.machine.sshPort,
      user: server.machine.sshUser,
      keyPath: server.machine.sshKeyPath || undefined,
    };

    // SFTP felhasználó frissítése a gépen (jelszó változtatás)
    const result = await createSFTPUser(
      server.id,
      serverPath,
      sftpUsername,
      newPassword,
      sshConfig
    );

    if (!result.success) {
      logger.error('SFTP jelszó frissítési hiba', new Error(result.error || 'Ismeretlen hiba'), {
        serverId: server.id,
      });
      return NextResponse.json(
        { error: result.error || 'SFTP jelszó frissítése sikertelen' },
        { status: 500 }
      );
    }

    // Adatbázis frissítése
    await prisma.server.update({
      where: { id: server.id },
      data: {
        sftpUsername,
        sftpPassword: hashedPassword,
        sftpPort: 22,
      },
    });

    logger.info('SFTP jelszó újragenerálva', {
      serverId: server.id,
      sftpUsername,
    });

    // Új jelszó visszaadása (csak egyszer, utána már nincs elérhető)
    return NextResponse.json({
      success: true,
      sftp: {
        host: server.machine.ipAddress,
        port: server.sftpPort || 22,
        username: sftpUsername,
        password: newPassword, // Csak most, újrageneráláskor
        path: serverPath,
        warning: 'Mentsd el ezt a jelszót biztonságos helyre! Ez az egyetlen alkalom, amikor látható.',
      },
    });
  } catch (error) {
    logger.error('Reset SFTP password error', error as Error, {
      serverId: (await Promise.resolve(params)).id,
    });
    return NextResponse.json(
      { error: 'Hiba történt az SFTP jelszó újragenerálása során' },
      { status: 500 }
    );
  }
}

