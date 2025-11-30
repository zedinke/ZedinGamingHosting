import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, createUnauthorizedError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      throw createUnauthorizedError('Admin jogosultság szükséges');
    }

    const configs = await prisma.gameConfig.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    return NextResponse.json({ configs });
  } catch (error: any) {
    return handleApiError(error);
  }
}

