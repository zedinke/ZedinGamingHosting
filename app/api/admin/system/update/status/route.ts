import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

function getProjectRoot(): string {
  let currentDir = process.cwd();
  const originalCwd = currentDir;
  
  // If we're in .next/standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    // .next/standalone -> .next -> public_html (project root)
    // Go up 2 levels to get to public_html
    const searchDir = resolve(currentDir, '..', '..');
    
    // Check if this is the project root (has .git and package.json)
    if (existsSync(join(searchDir, '.git')) && existsSync(join(searchDir, 'package.json'))) {
      return searchDir;
    }
    
    // If not found, try going up one more level and then into public_html
    const parentDir = resolve(searchDir, '..');
    const publicHtmlDir = join(parentDir, 'public_html');
    
    if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
      return publicHtmlDir;
    }
    
    // Fallback: use the directory we found (public_html)
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
  
  if (isValidRoot) {
    // Check if .git exists, if not, try public_html
    if (!existsSync(join(currentDir, '.git'))) {
      const publicHtmlDir = join(currentDir, 'public_html');
      if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
        return publicHtmlDir;
      }
      // Also try parent/public_html
      const parentPublicHtml = join(resolve(currentDir, '..'), 'public_html');
      if (existsSync(join(parentPublicHtml, '.git')) && existsSync(join(parentPublicHtml, 'package.json'))) {
        return parentPublicHtml;
      }
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
    // Check if .git exists in parent
    if (existsSync(join(parentDir, '.git'))) {
      return parentDir;
    }
    // Try public_html in parent
    const publicHtmlDir = join(parentDir, 'public_html');
    if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
      return publicHtmlDir;
    }
    return parentDir;
  }
  
  // Try to find public_html directory from original cwd
  const possiblePublicHtml = resolve(originalCwd, '..', '..', 'public_html');
  if (existsSync(join(possiblePublicHtml, '.git')) && existsSync(join(possiblePublicHtml, 'package.json'))) {
    return possiblePublicHtml;
  }
  
  // Last resort: return current directory
  console.warn('Could not find project root with .git, using:', currentDir);
  return currentDir;
}

export async function GET(request: NextRequest) {
  try {
    // Dinamikusan számoljuk ki a PROJECT_ROOT-ot minden kéréskor
    // Ez fontos, mert különben cache-elődhet az eredmény
    const projectRoot = getProjectRoot();
    const progressFile = join(projectRoot, '.update-progress.json');
    const logFile = join(projectRoot, '.update-log.txt');
    
    // Check if progress file exists
    if (!existsSync(progressFile)) {
      return NextResponse.json({
        status: 'idle',
        message: 'Nincs aktív frissítés',
        progress: 0,
        log: '',
        currentStep: null,
      });
    }

    // Read progress file
    const progressData = await readFile(progressFile, 'utf-8');
    const progress = JSON.parse(progressData);
    
    // Read log file if exists
    let log = '';
    if (existsSync(logFile)) {
      try {
        log = await readFile(logFile, 'utf-8');
      } catch {
        log = '';
      }
    }
    
    return NextResponse.json({
      ...progress,
      log,
    });
  } catch (error: any) {
    console.error('Status read error:', error);
    return NextResponse.json({
      status: 'idle',
      message: 'Nincs aktív frissítés',
      progress: 0,
      log: '',
      currentStep: null,
    });
  }
}

