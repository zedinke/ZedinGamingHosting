import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createOrUpdateCronJob, validateCronExpression } from '@/lib/cron-job-manager';
import { CronJobAction } from '@prisma/client';

/**
 * GET - Cron job-ok listája egy szerverhez
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    // Szerver ellenőrzése
    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Csak a szerver tulajdonosa láthatja
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Cron job-ok lekérdezése
    const cronJobs = await prisma.cronJob.findMany({
      where: {
        serverId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      cronJobs: cronJobs.map((job) => ({
        id: job.id,
        name: job.name,
        description: job.description,
        cronExpression: job.cronExpression,
        action: job.action,
        gameType: job.gameType,
        notifyOnSuccess: job.notifyOnSuccess,
        notifyOnFailure: job.notifyOnFailure,
        notifyAlways: job.notifyAlways,
        isActive: job.isActive,
        enabled: job.enabled,
        lastRun: job.lastRun,
        lastResult: job.lastResult,
        lastError: job.lastError,
        nextRun: job.nextRun,
        runCount: job.runCount,
        successCount: job.successCount,
        failureCount: job.failureCount,
        timezone: job.timezone,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        executionCount: job._count.executions,
      })),
    });
  } catch (error) {
    logger.error('Get cron jobs error', error as Error, {
      serverId: (await Promise.resolve(params)).id,
    });
    return NextResponse.json(
      { error: 'Hiba történt a cron job-ok lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * POST - Új cron job létrehozása
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    // Szerver ellenőrzése
    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Csak a szerver tulajdonosa hozhat létre cron job-ot
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      cronExpression,
      action,
      gameType,
      notifyOnSuccess,
      notifyOnFailure,
      notifyAlways,
      timezone,
      isActive,
      enabled,
    } = body;

    // Validáció
    if (!name || !cronExpression || !action) {
      return NextResponse.json(
        { error: 'Név, cron kifejezés és művelet megadása kötelező' },
        { status: 400 }
      );
    }

    // Cron kifejezés validálása
    const validation = validateCronExpression(cronExpression);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Érvénytelen cron kifejezés' },
        { status: 400 }
      );
    }

    // Művelet validálása
    const validActions = Object.values(CronJobAction);
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Érvénytelen művelet' },
        { status: 400 }
      );
    }

    // Cron job létrehozása
    const result = await createOrUpdateCronJob({
      serverId: id,
      userId,
      name,
      description,
      cronExpression,
      action,
      gameType,
      notifyOnSuccess: notifyOnSuccess || false,
      notifyOnFailure: notifyOnFailure || false,
      notifyAlways: notifyAlways || false,
      timezone: timezone || 'Europe/Budapest',
      isActive: isActive !== undefined ? isActive : true,
      enabled: enabled !== undefined ? enabled : true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a cron job létrehozása során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cronJob: result.cronJob,
    });
  } catch (error) {
    logger.error('Create cron job error', error as Error, {
      serverId: (await Promise.resolve(params)).id,
    });
    return NextResponse.json(
      { error: 'Hiba történt a cron job létrehozása során' },
      { status: 500 }
    );
  }
}

