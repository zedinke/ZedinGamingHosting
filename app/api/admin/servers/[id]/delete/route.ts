import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';
import { deleteServer } from '@/lib/server-deletion';

// DELETE - Szerver törlése indoklással
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
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Indoklás kötelező a szerver törléséhez' },
        { status: 400 }
      );
    }

    // Szerver ellenőrzése (létezik-e)
    const server = await prisma.server.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Központi szerver törlési funkció használata
    // Ez tartalmazza az SFTP felhasználó törlését is
    const result = await deleteServer({
      serverId: id,
      reason,
      deletedBy: (session.user as any).id,
      skipNotification: false,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a szerver törlése során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Szerver sikeresen törölve',
    });
  } catch (error: any) {
    logger.error('Server deletion error', error as Error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Hiba történt a szerver törlése során' },
      { status: 500 }
    );
  }
}
