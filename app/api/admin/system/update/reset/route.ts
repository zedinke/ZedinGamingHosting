import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';

const PROGRESS_FILE = join(process.cwd(), '.update-progress.json');
const LOG_FILE = join(process.cwd(), '.update-log.txt');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Progress fájl törlése
    try {
      await unlink(PROGRESS_FILE).catch(() => {
        // Ha nincs fájl, nem probléma
      });
    } catch (error) {
      // Nem kritikus hiba
    }

    // Log fájl törlése
    try {
      await unlink(LOG_FILE).catch(() => {
        // Ha nincs fájl, nem probléma
      });
    } catch (error) {
      // Nem kritikus hiba
    }

    return NextResponse.json({
      success: true,
      message: 'Progress fájlok törölve',
    });
  } catch (error) {
    console.error('Update reset error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a progress törlése során' },
      { status: 500 }
    );
  }
}
