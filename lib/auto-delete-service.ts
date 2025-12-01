import { prisma } from '@/lib/prisma';
import { logger } from './logger';
import { deleteServer } from './server-deletion';
import { isServerPaid } from './payment-check';

/**
 * Automatikus törlési beállítások lekérése
 */
export async function getAutoDeleteSettings(): Promise<{
  enabled: boolean;
  deleteAfterDays: number;
  deleteAfterHours: number;
  deleteAfterMinutes: number;
  totalMinutes: number; // Összesített perc
}> {
  try {
    const enabledSetting = await prisma.setting.findUnique({
      where: { key: 'auto_delete_enabled' },
    });

    const daysSetting = await prisma.setting.findUnique({
      where: { key: 'auto_delete_days' },
    });

    const hoursSetting = await prisma.setting.findUnique({
      where: { key: 'auto_delete_hours' },
    });

    const minutesSetting = await prisma.setting.findUnique({
      where: { key: 'auto_delete_minutes' },
    });

    const enabled = enabledSetting?.value === 'true';
    const deleteAfterDays = parseInt(daysSetting?.value || '0', 10);
    const deleteAfterHours = parseInt(hoursSetting?.value || '0', 10);
    const deleteAfterMinutes = parseInt(minutesSetting?.value || '0', 10);

    // Összesített perc számítása
    const totalMinutes =
      deleteAfterDays * 24 * 60 + deleteAfterHours * 60 + deleteAfterMinutes;

    return {
      enabled,
      deleteAfterDays,
      deleteAfterHours,
      deleteAfterMinutes,
      totalMinutes,
    };
  } catch (error) {
    logger.error('Error getting auto delete settings', error as Error);
    // Alapértelmezett értékek: kikapcsolva
    return {
      enabled: false,
      deleteAfterDays: 0,
      deleteAfterHours: 0,
      deleteAfterMinutes: 0,
      totalMinutes: 0,
    };
  }
}

/**
 * Automatikus törlési beállítások mentése
 */
export async function saveAutoDeleteSettings(data: {
  enabled: boolean;
  deleteAfterDays: number;
  deleteAfterHours: number;
  deleteAfterMinutes: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Minimum 5 perc validáció
    const totalMinutes = data.deleteAfterDays * 24 * 60 + data.deleteAfterHours * 60 + data.deleteAfterMinutes;
    if (data.enabled && totalMinutes < 5) {
      return {
        success: false,
        error: 'Az automatikus törlés minimum 5 perc lehet',
      };
    }

    // Beállítások mentése
    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'auto_delete_enabled' },
        update: { value: data.enabled ? 'true' : 'false', category: 'system' },
        create: {
          key: 'auto_delete_enabled',
          value: data.enabled ? 'true' : 'false',
          category: 'system',
        },
      }),
      prisma.setting.upsert({
        where: { key: 'auto_delete_days' },
        update: { value: data.deleteAfterDays.toString(), category: 'system' },
        create: {
          key: 'auto_delete_days',
          value: data.deleteAfterDays.toString(),
          category: 'system',
        },
      }),
      prisma.setting.upsert({
        where: { key: 'auto_delete_hours' },
        update: { value: data.deleteAfterHours.toString(), category: 'system' },
        create: {
          key: 'auto_delete_hours',
          value: data.deleteAfterHours.toString(),
          category: 'system',
        },
      }),
      prisma.setting.upsert({
        where: { key: 'auto_delete_minutes' },
        update: { value: data.deleteAfterMinutes.toString(), category: 'system' },
        create: {
          key: 'auto_delete_minutes',
          value: data.deleteAfterMinutes.toString(),
          category: 'system',
        },
      }),
    ]);

    logger.info('Auto delete settings saved', {
      enabled: data.enabled,
      deleteAfterDays: data.deleteAfterDays,
      deleteAfterHours: data.deleteAfterHours,
      deleteAfterMinutes: data.deleteAfterMinutes,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Error saving auto delete settings', error);
    return {
      success: false,
      error: error.message || 'Hiba történt a beállítások mentése során',
    };
  }
}

/**
 * Nem fizetett szerverek automatikus törlése
 * Ezt hívja a cron executor 5 percenként
 */
export async function cleanupUnpaidServers(): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    const settings = await getAutoDeleteSettings();

    // Ha nincs engedélyezve, nem csinálunk semmit
    if (!settings.enabled || settings.totalMinutes === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Számoljuk ki, hogy milyen időpont előtt készült szervereket kell törölni
    const now = new Date();
    const deleteBefore = new Date(
      now.getTime() - settings.totalMinutes * 60 * 1000
    );

    logger.info('Starting unpaid servers cleanup', {
      deleteBefore: deleteBefore.toISOString(),
      totalMinutes: settings.totalMinutes,
    });

    // Minden szervert lekérdezünk, ami a törlési időpont előtt készült
    // Csak azokat, amelyeknek nincs subscription-je vagy subscription státusza nem ACTIVE/TRIALING
    const servers = await prisma.server.findMany({
      where: {
        createdAt: {
          lte: deleteBefore,
        },
        OR: [
          { subscription: null },
          {
            subscription: {
              status: {
                notIn: ['ACTIVE', 'TRIALING'],
              },
            },
          },
        ],
      },
      include: {
        subscription: {
          include: {
            invoices: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    let deletedCount = 0;
    const errors: string[] = [];

    // Ellenőrizzük minden szervert, hogy fizetett-e (dupla ellenőrzés)
    for (const server of servers) {
      try {
        const paid = await isServerPaid(server.id);

        if (!paid) {
          logger.info('Deleting unpaid server', {
            serverId: server.id,
            serverName: server.name,
            createdAt: server.createdAt.toISOString(),
            ageMinutes: Math.floor((now.getTime() - server.createdAt.getTime()) / 60000),
          });

          // Szerver törlése
          const result = await deleteServer({
            serverId: server.id,
            reason: `Automatikus törlés: szerver nem fizetett ${settings.totalMinutes} perc után`,
            deletedBy: undefined, // Rendszer automatikus törlés
            skipNotification: false, // Küldünk értesítést
          });

          if (result.success) {
            deletedCount++;
            logger.info('Unpaid server deleted successfully', {
              serverId: server.id,
              serverName: server.name,
            });
          } else {
            errors.push(`Szerver ${server.name} (${server.id}): ${result.error}`);
            logger.error('Failed to delete unpaid server', new Error(result.error || 'Ismeretlen hiba'), {
              serverId: server.id,
            });
          }
        }
      } catch (error: any) {
        errors.push(`Szerver ${server.name} (${server.id}): ${error.message}`);
        logger.error('Error checking/deleting server during cleanup', error, {
          serverId: server.id,
        });
      }
    }

    if (errors.length > 0) {
      logger.warn('Some servers failed to delete during cleanup', {
        errors: errors.slice(0, 10), // Csak első 10 hibát logoljuk
        totalErrors: errors.length,
      });
    }

    logger.info('Unpaid servers cleanup completed', {
      deletedCount,
      totalChecked: servers.length,
      errors: errors.length,
    });

    return {
      success: true,
      deletedCount,
      error: errors.length > 0 ? `${errors.length} hiba történt` : undefined,
    };
  } catch (error: any) {
    logger.error('Error during unpaid servers cleanup', error);
    return {
      success: false,
      deletedCount: 0,
      error: error.message || 'Ismeretlen hiba',
    };
  }
}

