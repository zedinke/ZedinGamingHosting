import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const PROGRESS_FILE = join(process.cwd(), '.update-progress.json');
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
    const data = await readFile(PROGRESS_FILE, 'utf-8');
    const progress = JSON.parse(data);
    
    // Log hozzáadása
    const log = await readLog();
    progress.log = log;
    
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({
      status: 'idle',
      message: 'Nincs aktív frissítés',
      progress: 0,
      log: '',
    });
  }
}

