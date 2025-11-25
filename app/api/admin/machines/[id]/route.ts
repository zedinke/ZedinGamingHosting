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
    const { name, sshPort, sshUser, sshKeyPath, notes, status } = body;

    const machine = await prisma.serverMachine.findUnique({
      where: { id },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    const updated = await prisma.serverMachine.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sshPort && { sshPort }),
        ...(sshUser && { sshUser }),
        ...(sshKeyPath !== undefined && { sshKeyPath }),
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
      message: 'Szerver gép sikeresen frissítve',
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

