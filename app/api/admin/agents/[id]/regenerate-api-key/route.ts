import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createApiKeyForAgent } from '@/lib/api-key';

// POST - API kulcs újragenerálása
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;

    const agent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent nem található' },
        { status: 404 }
      );
    }

    const newApiKey = await createApiKeyForAgent(id);

    return NextResponse.json({
      success: true,
      apiKey: newApiKey,
      message: 'API kulcs sikeresen újragenerálva. Mentsd el az új kulcsot!',
    });
  } catch (error: any) {
    console.error('Regenerate API key error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt az API kulcs újragenerálása során' },
      { status: 500 }
    );
  }
}

