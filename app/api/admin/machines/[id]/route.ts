import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Szerver gép részletei
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

    const machine = await prisma.serverMachine.findUnique({
      where: { id },
      include: {
        agents: {
          include: {
            _count: {
              select: {
                servers: true,
                tasks: true,
              },
            },
          },
        },
        servers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json({ machine });
  } catch (error) {
    console.error('Machine detail error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szerver gép lekérdezése során' },
      { status: 500 }
    );
  }
}

// PUT - Szerver gép frissítése
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
    const { name, sshPort, sshUser, sshKeyPath, sshPassword, notes, status } = body;

    const machine = await prisma.serverMachine.findUnique({
      where: { id },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    let finalSshKeyPath = sshKeyPath !== undefined ? sshKeyPath : machine.sshKeyPath;

    // Ha nincs SSH kulcs megadva, de van jelszó, generáljunk kulcsot és másoljuk át
    if (!finalSshKeyPath && sshPassword) {
      try {
        const { generateSSHKey, copyPublicKeyToServer, testSSHKeyConnection } = await import('@/lib/ssh-key-manager');

        // SSH kulcs generálása
        const keyResult = await generateSSHKey(machine.id, machine.ipAddress);
        
        if (!keyResult.success || !keyResult.keyPath || !keyResult.publicKey) {
          return NextResponse.json(
            { error: keyResult.error || 'SSH kulcs generálás sikertelen' },
            { status: 500 }
          );
        }

        // Publikus kulcs másolása a cél szerverre
        const copyResult = await copyPublicKeyToServer(
          keyResult.publicKey,
          machine.ipAddress,
          sshPort || machine.sshPort,
          sshUser || machine.sshUser,
          sshPassword
        );

        if (!copyResult.success) {
          // Kulcs törlése, ha a másolás sikertelen
          try {
            const { unlink } = await import('fs/promises');
            await unlink(keyResult.keyPath);
            await unlink(`${keyResult.keyPath}.pub`);
          } catch (unlinkError) {
            // Kulcs törlési hiba nem kritikus
          }
          return NextResponse.json(
            { error: copyResult.error || 'Publikus kulcs másolás sikertelen. Ellenőrizd az SSH jelszót és a kapcsolatot.' },
            { status: 500 }
          );
        }

        // SSH kapcsolat tesztelése kulcs alapú autentikációval
        const testResult = await testSSHKeyConnection(
          keyResult.keyPath,
          machine.ipAddress,
          sshPort || machine.sshPort,
          sshUser || machine.sshUser
        );

        if (!testResult) {
          console.warn('SSH kulcs másolva, de a kapcsolat tesztelése sikertelen');
        }

        finalSshKeyPath = keyResult.keyPath;
      } catch (error: any) {
        console.error('SSH kulcs automatikus beállítási hiba:', error);
        return NextResponse.json(
          { error: error.message || 'Hiba történt az SSH kulcs automatikus beállítása során' },
          { status: 500 }
        );
      }
    }

    const updated = await prisma.serverMachine.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sshPort && { sshPort }),
        ...(sshUser && { sshUser }),
        ...(finalSshKeyPath !== undefined && { sshKeyPath: finalSshKeyPath }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
      include: {
        _count: {
          select: {
            agents: true,
            servers: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      machine: updated,
      message: finalSshKeyPath && finalSshKeyPath !== machine.sshKeyPath 
        ? 'Szerver gép sikeresen frissítve. SSH kulcs automatikusan generálva és beállítva.'
        : 'Szerver gép sikeresen frissítve',
    });
  } catch (error) {
    console.error('Machine update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szerver gép frissítése során' },
      { status: 500 }
    );
  }
}

// DELETE - Szerver gép törlése
export async function DELETE(
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

    const machine = await prisma.serverMachine.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            agents: true,
            servers: true,
          },
        },
      },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    if (machine._count.agents > 0 || machine._count.servers > 0) {
      return NextResponse.json(
        { error: 'Nem törölhető, mert van hozzárendelt agent vagy szerver' },
        { status: 400 }
      );
    }

    await prisma.serverMachine.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Szerver gép sikeresen törölve',
    });
  } catch (error) {
    console.error('Machine delete error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szerver gép törlése során' },
      { status: 500 }
    );
  }
}

