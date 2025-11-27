import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Progress fájl elérési út
function getProgressFilePath(serverId: string): string {
  return join(process.cwd(), 'logs', 'install', `server-${serverId}.progress.json`);
}

function getLogFilePath(serverId: string): string {
  return join(process.cwd(), 'logs', 'install', `server-${serverId}.log`);
}

// GET - Telepítési progress lekérése
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
    const progressPath = getProgressFilePath(id);
    const logPath = getLogFilePath(id);

    // Ha nincs progress fájl, akkor még nem kezdődött el
    if (!existsSync(progressPath)) {
      return NextResponse.json({
        status: 'not_started',
        message: 'Telepítés még nem kezdődött el',
        progress: 0,
        log: '',
      });
    }

    // Progress fájl olvasása
    try {
      const progressData = JSON.parse(await readFile(progressPath, 'utf-8'));
      
      // Log fájl olvasása (ha van)
      let logContent = '';
      if (existsSync(logPath)) {
        try {
          logContent = await readFile(logPath, 'utf-8');
        } catch (logError) {
          // Log fájl olvasási hiba nem kritikus
          console.warn('Could not read log file:', logError);
        }
      }

      return NextResponse.json({
        status: progressData.status || 'in_progress',
        message: progressData.message || 'Telepítés folyamatban...',
        progress: progressData.progress || 0,
        currentStep: progressData.currentStep,
        totalSteps: progressData.totalSteps,
        log: logContent,
        error: progressData.error || null,
      });
    } catch (error: any) {
      console.error('Error reading progress file:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Hiba a progress fájl olvasása során',
        progress: 0,
        log: '',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Install progress error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a progress lekérése során' },
      { status: 500 }
    );
  }
}

