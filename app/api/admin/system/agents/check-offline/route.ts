import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { checkOfflineAgents } from '@/lib/agent-heartbeat';

// POST - Offline agentek ellenőrzése (cron job vagy manuális)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    await checkOfflineAgents();

    return NextResponse.json({
      success: true,
      message: 'Offline agentek ellenőrizve',
    });
  } catch (error: any) {
    console.error('Check offline agents error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt az offline agentek ellenőrzése során' },
      { status: 500 }
    );
  }
}

