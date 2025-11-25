import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

function getProjectRoot(): string {
  let currentDir = process.cwd();
  
  // If in standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    currentDir = resolve(currentDir, '..', '..');
  }
  
  // Verify by checking for package.json
  if (existsSync(join(currentDir, 'package.json'))) {
    return currentDir;
  }
  
  // Try parent directory
  const parentDir = resolve(currentDir, '..');
  if (existsSync(join(parentDir, 'package.json'))) {
    return parentDir;
  }
  
  return currentDir;
}

const PROJECT_ROOT = getProjectRoot();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    // Get current commit
    let currentCommit = '';
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { 
        cwd: PROJECT_ROOT,
        timeout: 10000,
      });
      currentCommit = stdout.trim();
    } catch (error: any) {
      console.error('Error getting current commit:', error);
      return NextResponse.json({
        hasUpdate: false,
        error: 'Nem sikerült lekérni a jelenlegi commit-ot',
      });
    }

    // Fetch and get remote commit
    let remoteCommit = '';
    try {
      await execAsync('git fetch origin main', { 
        cwd: PROJECT_ROOT, 
        timeout: 30000 
      });
      const { stdout } = await execAsync('git rev-parse origin/main', { 
        cwd: PROJECT_ROOT,
        timeout: 10000,
      });
      remoteCommit = stdout.trim();
    } catch (error: any) {
      console.error('Error getting remote commit:', error);
      return NextResponse.json({
        hasUpdate: false,
        error: 'Nem sikerült lekérni a remote commit-ot',
      });
    }

    // Compare commits
    const hasUpdate = currentCommit !== remoteCommit;

    // Get commit info if update available
    let commitInfo = null;
    if (hasUpdate) {
      try {
        const { stdout } = await execAsync(
          `git log ${currentCommit}..${remoteCommit} --oneline --no-decorate`,
          { cwd: PROJECT_ROOT, timeout: 10000 }
        );
        const commits = stdout.trim().split('\n').filter(Boolean);
        commitInfo = {
          count: commits.length,
          commits: commits.slice(0, 10),
        };
      } catch (error) {
        // Not critical
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
      { 
        hasUpdate: false, 
        error: 'Hiba történt a frissítés ellenőrzése során: ' + (error.message || 'Ismeretlen hiba') 
      },
      { status: 500 }
    );
  }
}

