import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Jelenlegi commit hash lekérése
    let currentCommit = '';
    try {
      const { stdout } = await execAsync('git rev-parse HEAD');
      currentCommit = stdout.trim();
    } catch (error) {
      return NextResponse.json({
        hasUpdate: false,
        error: 'Nem sikerült lekérni a jelenlegi commit-ot',
      });
    }

    // Remote commit hash lekérése
    let remoteCommit = '';
    try {
      // Fetch a legújabb információkért (nem pull, csak fetch)
      await execAsync('git fetch origin main');
      const { stdout } = await execAsync('git rev-parse origin/main');
      remoteCommit = stdout.trim();
    } catch (error) {
      return NextResponse.json({
        hasUpdate: false,
        error: 'Nem sikerült lekérni a remote commit-ot',
      });
    }

    // Összehasonlítás
    const hasUpdate = currentCommit !== remoteCommit;

    // Commit információk lekérése (ha van frissítés)
    let commitInfo = null;
    if (hasUpdate) {
      try {
        const { stdout } = await execAsync(
          `git log ${currentCommit}..${remoteCommit} --oneline --no-decorate`
        );
        const commits = stdout.trim().split('\n').filter(Boolean);
        commitInfo = {
          count: commits.length,
          commits: commits.slice(0, 10), // Legutóbbi 10 commit
        };
      } catch (error) {
        // Nem kritikus hiba
      }
    }

    return NextResponse.json({
      hasUpdate,
      currentCommit,
      remoteCommit,
      commitInfo,
    });
  } catch (error: any) {
    console.error('Update check error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a frissítés ellenőrzése során', hasUpdate: false },
      { status: 500 }
    );
  }
}

