import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { testSSHConnection } from '@/lib/ssh-client';

// POST - SSH kapcsolat tesztelése
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
    const { password } = body; // Opcionális jelszó, ha nincs SSH kulcs

    const machine = await prisma.serverMachine.findUnique({
      where: { id },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    // SSH kapcsolat tesztelése
    const { testSSHConnection } = await import('@/lib/ssh-client');
    const connected = await testSSHConnection({
      host: machine.ipAddress,
      port: machine.sshPort,
      user: machine.sshUser,
      keyPath: machine.sshKeyPath || undefined,
      password: password || undefined,
    });

    if (connected) {
      return NextResponse.json({
        success: true,
        message: 'SSH kapcsolat sikeres',
      });
    } else {
      return NextResponse.json(
        { error: 'SSH kapcsolat sikertelen. Ellenőrizd a beállításokat.' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('SSH test error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt az SSH kapcsolat tesztelése során' },
      { status: 500 }
    );
  }
}

