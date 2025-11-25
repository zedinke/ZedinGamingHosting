import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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
    const { name, ipAddress, sshPort, sshUser, sshKeyPath, notes } = body;

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

    const machine = await prisma.serverMachine.create({
      data: {
        name,
        ipAddress,
        sshPort: sshPort || 22,
        sshUser,
        sshKeyPath: sshKeyPath || null,
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

