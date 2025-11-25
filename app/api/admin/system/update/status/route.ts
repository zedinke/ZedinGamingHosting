import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const PROGRESS_FILE = join(process.cwd(), '.update-progress.json');

export async function GET(request: NextRequest) {
  try {
    const data = await readFile(PROGRESS_FILE, 'utf-8');
    const progress = JSON.parse(data);
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({
      status: 'idle',
      message: 'Nincs aktív frissítés',
      progress: 0,
    });
  }
}

