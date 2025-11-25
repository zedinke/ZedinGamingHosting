import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Get project root directory (same logic as update route)
function getProjectRoot(): string {
  let currentDir = process.cwd();
  
  if (currentDir.includes('.next/standalone')) {
    currentDir = resolve(currentDir, '..', '..');
  }
  
  if (existsSync(join(currentDir, 'package.json'))) {
    return currentDir;
  }
  
  const parentDir = resolve(currentDir, '..');
  if (existsSync(join(parentDir, 'package.json'))) {
    return parentDir;
  }
  
  return currentDir;
}

const PROJECT_ROOT = getProjectRoot();
const PROGRESS_FILE = join(PROJECT_ROOT, '.update-progress.json');
const LOG_FILE = join(PROJECT_ROOT, '.update-log.txt');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    // Delete progress and log files
    try {
      if (existsSync(PROGRESS_FILE)) {
        await unlink(PROGRESS_FILE);
      }
    } catch (error: any) {
      console.error('Error deleting progress file:', error);
    }

    try {
      if (existsSync(LOG_FILE)) {
        await unlink(LOG_FILE);
      }
    } catch (error: any) {
      console.error('Error deleting log file:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Progress fájlok törölve',
    });
  } catch (error: any) {
    console.error('Update reset error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a progress törlése során: ' + (error.message || 'Ismeretlen hiba') },
      { status: 500 }
    );
  }
}
