import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), '.update-log.txt');

async function readLog(): Promise<string> {
  try {
    const data = await readFile(LOG_FILE, 'utf-8');
    return data;
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const log = await readLog();
    return NextResponse.json({ log });
  } catch (error: any) {
    console.error('Log read error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a log olvasása során', log: '' },
      { status: 500 }
    );
  }
}

