import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { generateSSHKey, copyPublicKeyToServer, testSSHKeyConnection } from '@/lib/ssh-key-manager';

// GET - Szerver gépek listája
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [machines, total] = await Promise.all([
      prisma.serverMachine.findMany({
        where,
        include: {
          agents: {
            select: {
              id: true,
              agentId: true,
              status: true,
              lastHeartbeat: true,
            },
          },
          servers: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              agents: true,
              servers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serverMachine.count({ where }),
    ]);

    return NextResponse.json({
      machines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Machines list error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szerver gépek lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Új szerver gép hozzáadása
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, ipAddress, sshPort, sshUser, sshKeyPath, sshPassword, notes } = body;

    if (!name || !ipAddress || !sshUser) {
      return NextResponse.json(
        { error: 'Név, IP cím és SSH felhasználó kötelező' },
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy létezik-e már ilyen IP
    const existing = await prisma.serverMachine.findUnique({
      where: { ipAddress },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ez az IP cím már regisztrálva van' },
        { status: 400 }
      );
    }

    let finalSshKeyPath = sshKeyPath || null;

    // Ha nincs SSH kulcs megadva, de van jelszó, generáljunk kulcsot és másoljuk át
    if (!finalSshKeyPath && sshPassword) {
      try {
        // Először létrehozzuk a gépet az adatbázisban, hogy legyen ID
        const tempMachine = await prisma.serverMachine.create({
          data: {
            name,
            ipAddress,
            sshPort: sshPort || 22,
            sshUser,
            sshKeyPath: null, // Ideiglenesen null
            notes: notes || null,
            status: 'OFFLINE',
          },
        });

        // SSH kulcs generálása
        const keyResult = await generateSSHKey(tempMachine.id, ipAddress);
        
        if (!keyResult.success || !keyResult.keyPath || !keyResult.publicKey) {
          // Ha a kulcs generálás sikertelen, töröljük a gépet
          await prisma.serverMachine.delete({ where: { id: tempMachine.id } });
          return NextResponse.json(
            { error: keyResult.error || 'SSH kulcs generálás sikertelen' },
            { status: 500 }
          );
        }

        // Publikus kulcs másolása a cél szerverre
        const copyResult = await copyPublicKeyToServer(
          keyResult.publicKey,
          ipAddress,
          sshPort || 22,
          sshUser,
          sshPassword
        );

        if (!copyResult.success) {
          // Ha a másolás sikertelen, töröljük a gépet és a kulcsot
          await prisma.serverMachine.delete({ where: { id: tempMachine.id } });
          // Kulcs törlése (opcionális)
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
          ipAddress,
          sshPort || 22,
          sshUser
        );

        if (!testResult) {
          // Ha a teszt sikertelen, de a másolás sikeres volt, csak figyelmeztetünk
          console.warn('SSH kulcs másolva, de a kapcsolat tesztelése sikertelen');
        }

        // Frissítjük a gépet az SSH kulcs elérési útjával
        const machine = await prisma.serverMachine.update({
          where: { id: tempMachine.id },
          data: {
            sshKeyPath: keyResult.keyPath,
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
          machine,
          message: 'Szerver gép sikeresen hozzáadva. SSH kulcs automatikusan generálva és beállítva.',
        });
      } catch (error: any) {
        console.error('SSH kulcs automatikus beállítási hiba:', error);
        return NextResponse.json(
          { error: error.message || 'Hiba történt az SSH kulcs automatikus beállítása során' },
          { status: 500 }
        );
      }
    }

    // Ha van SSH kulcs megadva, vagy nincs jelszó, normál módon hozzáadjuk
    const machine = await prisma.serverMachine.create({
      data: {
        name,
        ipAddress,
        sshPort: sshPort || 22,
        sshUser,
        sshKeyPath: finalSshKeyPath,
        notes: notes || null,
        status: 'OFFLINE',
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
      machine,
      message: 'Szerver gép sikeresen hozzáadva',
    });
  } catch (error) {
    console.error('Machine create error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szerver gép hozzáadása során' },
      { status: 500 }
    );
  }
}

