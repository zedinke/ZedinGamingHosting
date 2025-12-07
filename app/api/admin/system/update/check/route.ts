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
  
  console.log('getProjectRoot: Starting from cwd:', currentDir);
  
  // If we're in .next/standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    // .next/standalone -> .next -> public_html (project root)
    // Go up 2 levels to get to public_html
    const searchDir = resolve(currentDir, '..', '..');
    console.log('getProjectRoot: In standalone, going up 2 levels to:', searchDir);
    
    // Check if this is the project root (has .git and package.json)
    if (existsSync(join(searchDir, '.git')) && existsSync(join(searchDir, 'package.json'))) {
      console.log('getProjectRoot: Found project root with .git at:', searchDir);
      return searchDir;
    }
    
    // If not found, try going up one more level and then into public_html
    const parentDir = resolve(searchDir, '..');
    const publicHtmlDir = join(parentDir, 'public_html');
    console.log('getProjectRoot: Trying public_html at:', publicHtmlDir);
    
    if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
      console.log('getProjectRoot: Found project root in public_html at:', publicHtmlDir);
      return publicHtmlDir;
    }
    
    // Fallback: use the directory we found (public_html)
    console.log('getProjectRoot: Using fallback directory:', searchDir);
    currentDir = searchDir;
  }
  
  // Verify it's the project root
  const checks = [
    join(currentDir, 'package.json'),
    join(currentDir, 'next.config.js'),
    join(currentDir, 'app'),
    join(currentDir, 'public'),
  ];
  
  const isValidRoot = checks.some(check => existsSync(check));
  console.log('getProjectRoot: isValidRoot:', isValidRoot, 'for:', currentDir);
  
  if (isValidRoot) {
    // Check if .git exists, if not, try public_html
    if (!existsSync(join(currentDir, '.git'))) {
      console.log('getProjectRoot: No .git in currentDir, trying public_html');
      const publicHtmlDir = join(currentDir, 'public_html');
      if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
        console.log('getProjectRoot: Found .git in public_html:', publicHtmlDir);
        return publicHtmlDir;
      }
      // Also try parent/public_html
      const parentPublicHtml = join(resolve(currentDir, '..'), 'public_html');
      if (existsSync(join(parentPublicHtml, '.git')) && existsSync(join(parentPublicHtml, 'package.json'))) {
        console.log('getProjectRoot: Found .git in parent/public_html:', parentPublicHtml);
        return parentPublicHtml;
      }
    } else {
      console.log('getProjectRoot: Found .git in currentDir:', currentDir);
    }
    return currentDir;
  }
  
  // Try parent directory
  const parentDir = resolve(currentDir, '..');
  const parentChecks = [
    join(parentDir, 'package.json'),
    join(parentDir, 'next.config.js'),
  ];
  
  if (parentChecks.some(check => existsSync(check))) {
    console.log('getProjectRoot: Trying parent directory:', parentDir);
    // Check if .git exists in parent
    if (existsSync(join(parentDir, '.git'))) {
      console.log('getProjectRoot: Found .git in parent:', parentDir);
      return parentDir;
    }
    // Try public_html in parent
    const publicHtmlDir = join(parentDir, 'public_html');
    if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
      console.log('getProjectRoot: Found .git in parent/public_html:', publicHtmlDir);
      return publicHtmlDir;
    }
    return parentDir;
  }
  
  // Try to find public_html directory from original cwd
  const possiblePublicHtml = resolve(originalCwd, '..', '..', 'public_html');
  console.log('getProjectRoot: Trying possiblePublicHtml:', possiblePublicHtml);
  if (existsSync(join(possiblePublicHtml, '.git')) && existsSync(join(possiblePublicHtml, 'package.json'))) {
    console.log('getProjectRoot: Found .git in possiblePublicHtml:', possiblePublicHtml);
    return possiblePublicHtml;
  }
  
  // Last resort: return current directory
  console.warn('getProjectRoot: Could not find project root with .git, using:', currentDir);
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

