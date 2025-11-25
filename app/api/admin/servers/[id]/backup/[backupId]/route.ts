import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { deleteBackup, listBackups } from '@/lib/backup-storage';

// DELETE - Backup törlése
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; backupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id, backupId } = params;

    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Backup keresése
    const backups = await listBackups(id);
    const backup = backups.find((b) => b.name === backupId);

    if (!backup) {
      return NextResponse.json(
        { error: 'Backup nem található' },
        { status: 404 }
      );
    }

    // Backup törlése
    const result = await deleteBackup(id, backup.path);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a backup törlése során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Backup sikeresen törölve',
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a backup törlése során' },
      { status: 500 }
    );
  }
}

