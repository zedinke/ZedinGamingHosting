import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

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
const PROGRESS_FILE = join(PROJECT_ROOT, '.update-progress.json');
const LOG_FILE = join(PROJECT_ROOT, '.update-log.txt');

export async function GET(request: NextRequest) {
  try {
    // Check if progress file exists
    if (!existsSync(PROGRESS_FILE)) {
      return NextResponse.json({
        status: 'idle',
        message: 'Nincs aktív frissítés',
        progress: 0,
        log: '',
        currentStep: null,
      });
    }

    // Read progress file
    const progressData = await readFile(PROGRESS_FILE, 'utf-8');
    const progress = JSON.parse(progressData);
    
    // Read log file if exists
    let log = '';
    if (existsSync(LOG_FILE)) {
      try {
        log = await readFile(LOG_FILE, 'utf-8');
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

