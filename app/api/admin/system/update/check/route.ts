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
  const originalCwd = currentDir;
  
  // If we're in .next/standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    // .next/standalone -> .next -> project root
    currentDir = resolve(currentDir, '..', '..', '..');
  }
  
  // Verify it's the project root
  const checks = [
    join(currentDir, 'package.json'),
    join(currentDir, 'next.config.js'),
    join(currentDir, 'app'),
    join(currentDir, 'public'),
  ];
  
  const isValidRoot = checks.some(check => existsSync(check));
  
  if (isValidRoot) {
    return currentDir;
  }
  
  // Try parent directory
  const parentDir = resolve(currentDir, '..');
  const parentChecks = [
    join(parentDir, 'package.json'),
    join(parentDir, 'next.config.js'),
  ];
  
  if (parentChecks.some(check => existsSync(check))) {
    return parentDir;
  }
  
  // Last resort: return current directory
  console.warn('Could not find project root, using:', currentDir);
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

