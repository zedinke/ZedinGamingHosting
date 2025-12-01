import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createOrUpdateCronJob, validateCronExpression, executeCronJob } from '@/lib/cron-job-manager';
import { CronJobAction } from '@prisma/client';

/**
 * GET - Cron job részletei
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cronJobId: string }> | { id: string; cronJobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id, cronJobId } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    // Cron job lekérdezése
    const cronJob = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
      include: {
        executions: {
          take: 10,
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    });

    if (!cronJob) {
      return NextResponse.json(
        { error: 'Cron job nem található' },
        { status: 404 }
      );
    }

    // Ellenőrzés: a cron job a megadott szerverhez tartozik
    if (cronJob.serverId !== id) {
      return NextResponse.json(
        { error: 'Cron job nem tartozik ehhez a szerverhez' },
        { status: 400 }
      );
    }

    // Csak a szerver tulajdonosa láthatja
    if (cronJob.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      cronJob: {
        ...cronJob,
        executions: cronJob.executions.map((exec) => ({
          id: exec.id,
          status: exec.status,
          startedAt: exec.startedAt,
          completedAt: exec.completedAt,
          duration: exec.duration,
          result: exec.result,
          error: exec.error,
          emailSent: exec.emailSent,
          emailSentAt: exec.emailSentAt,
        })),
      },
    });
  } catch (error) {
    logger.error('Get cron job error', error as Error, {
      cronJobId: (await Promise.resolve(params)).cronJobId,
    });
    return NextResponse.json(
      { error: 'Hiba történt a cron job lekérdezése során' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Cron job frissítése
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cronJobId: string }> | { id: string; cronJobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id, cronJobId } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    // Cron job lekérdezése
    const existingCronJob = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
    });

    if (!existingCronJob) {
      return NextResponse.json(
        { error: 'Cron job nem található' },
        { status: 404 }
      );
    }

    // Ellenőrzés: a cron job a megadott szerverhez tartozik
    if (existingCronJob.serverId !== id) {
      return NextResponse.json(
        { error: 'Cron job nem tartozik ehhez a szerverhez' },
        { status: 400 }
      );
    }

    // Csak a szerver tulajdonosa módosíthatja
    if (existingCronJob.userId !== userId) {
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

    // Cron kifejezés validálása, ha van
    if (cronExpression) {
      const validation = validateCronExpression(cronExpression);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'Érvénytelen cron kifejezés' },
          { status: 400 }
        );
      }
    }

    // Művelet validálása, ha van
    if (action) {
      const validActions = Object.values(CronJobAction);
      if (!validActions.includes(action)) {
        return NextResponse.json(
          { error: 'Érvénytelen művelet' },
          { status: 400 }
        );
      }
    }

    // Cron job frissítése
    const result = await createOrUpdateCronJob({
      id: cronJobId,
      serverId: id,
      userId,
      name: name || existingCronJob.name,
      description: description !== undefined ? description : existingCronJob.description,
      cronExpression: cronExpression || existingCronJob.cronExpression,
      action: action || existingCronJob.action,
      gameType: gameType || existingCronJob.gameType || undefined,
      notifyOnSuccess: notifyOnSuccess !== undefined ? notifyOnSuccess : existingCronJob.notifyOnSuccess,
      notifyOnFailure: notifyOnFailure !== undefined ? notifyOnFailure : existingCronJob.notifyOnFailure,
      notifyAlways: notifyAlways !== undefined ? notifyAlways : existingCronJob.notifyAlways,
      timezone: timezone || existingCronJob.timezone,
      isActive: isActive !== undefined ? isActive : existingCronJob.isActive,
      enabled: enabled !== undefined ? enabled : existingCronJob.enabled,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Hiba történt a cron job frissítése során' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cronJob: result.cronJob,
    });
  } catch (error) {
    logger.error('Update cron job error', error as Error, {
      cronJobId: (await Promise.resolve(params)).cronJobId,
    });
    return NextResponse.json(
      { error: 'Hiba történt a cron job frissítése során' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cron job törlése
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cronJobId: string }> | { id: string; cronJobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    const { id, cronJobId } = await Promise.resolve(params);
    const userId = (session.user as any).id;

    // Cron job lekérdezése
    const cronJob = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
    });

    if (!cronJob) {
      return NextResponse.json(
        { error: 'Cron job nem található' },
        { status: 404 }
      );
    }

    // Ellenőrzés: a cron job a megadott szerverhez tartozik
    if (cronJob.serverId !== id) {
      return NextResponse.json(
        { error: 'Cron job nem tartozik ehhez a szerverhez' },
        { status: 400 }
      );
    }

    // Csak a szerver tulajdonosa törölheti
    if (cronJob.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Cron job törlése (a kapcsolatok miatt az executions is törlődnek)
    await prisma.cronJob.delete({
      where: { id: cronJobId },
    });

    return NextResponse.json({
      success: true,
      message: 'Cron job sikeresen törölve',
    });
  } catch (error) {
    logger.error('Delete cron job error', error as Error, {
      cronJobId: (await Promise.resolve(params)).cronJobId,
    });
    return NextResponse.json(
      { error: 'Hiba történt a cron job törlése során' },
      { status: 500 }
    );
  }
}

