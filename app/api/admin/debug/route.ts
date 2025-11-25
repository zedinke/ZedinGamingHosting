import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { isDebugModeEnabled, setDebugMode, readDebugLogs, clearDebugLogs } from '@/lib/debug';

/**
 * GET - Get debug mode status and logs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100');
    const level = searchParams.get('level') as 'info' | 'warn' | 'error' | 'debug' | undefined;

    if (action === 'logs') {
      const logs = await readDebugLogs(limit, level);
      return NextResponse.json({ logs });
    }

    const enabled = await isDebugModeEnabled();
    return NextResponse.json({ enabled });
  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Hiba történt' },
      { status: 500 }
    );
  }
}

/**
 * POST - Enable/disable debug mode or clear logs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, enabled } = body;

    if (action === 'toggle') {
      await setDebugMode(enabled);
      return NextResponse.json({ 
        success: true, 
        enabled,
        message: enabled ? 'Debug mód bekapcsolva' : 'Debug mód kikapcsolva'
      });
    }

    if (action === 'clear') {
      await clearDebugLogs();
      return NextResponse.json({ 
        success: true,
        message: 'Debug logok törölve'
      });
    }

    return NextResponse.json(
      { error: 'Érvénytelen művelet' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Hiba történt' },
      { status: 500 }
    );
  }
}

