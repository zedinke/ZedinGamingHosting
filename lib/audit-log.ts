import { prisma } from '@/lib/prisma';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SERVER_START = 'SERVER_START',
  SERVER_STOP = 'SERVER_STOP',
  SERVER_RESTART = 'SERVER_RESTART',
  BACKUP_CREATE = 'BACKUP_CREATE',
  BACKUP_DELETE = 'BACKUP_DELETE',
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit log létrehozása
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // TODO: Valós implementációban itt kellene az AuditLog modell használata
    // Jelenleg csak logoljuk a konzolra
    console.log('[AUDIT LOG]', {
      timestamp: new Date().toISOString(),
      ...data,
    });

    // Próbáljuk meg az adatbázisba menteni, ha létezik az AuditLog modell
    try {
      await (prisma as any).auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          details: data.details || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Ha nincs AuditLog modell, csak logoljuk
      // Ez normális, amíg nincs migráció
    }
  } catch (error) {
    console.error('Audit log error:', error);
    // Ne dobjunk hibát, mert az audit log nem kritikus
  }
}

/**
 * Audit logok lekérdezése
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.resourceType) where.resourceType = filters.resourceType;
    if (filters?.resourceId) where.resourceId = filters.resourceId;

    const logs = await (prisma as any).auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return logs || [];
  } catch (error) {
    console.error('Get audit logs error:', error);
    return [];
  }
}

