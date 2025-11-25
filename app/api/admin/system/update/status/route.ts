import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
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

export async function GET(request: NextRequest) {
  try {
    if (!existsSync(PROGRESS_FILE)) {
      return NextResponse.json({
        status: 'idle',
        message: 'Nincs aktív frissítés',
        progress: 0,
        log: '',
      });
    }

    const data = await readFile(PROGRESS_FILE, 'utf-8');
    const progress = JSON.parse(data);
    
    // Add log to progress
    try {
      if (existsSync(LOG_FILE)) {
        const log = await readFile(LOG_FILE, 'utf-8');
        progress.log = log;
      } else {
        progress.log = '';
      }
    } catch {
      progress.log = '';
    }
    
    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Status read error:', error);
    return NextResponse.json({
      status: 'idle',
      message: 'Nincs aktív frissítés',
      progress: 0,
      log: '',
    });
  }
}
