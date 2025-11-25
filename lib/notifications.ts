import { prisma } from '@/lib/prisma';

/**
 * Értesítés típusok
 */
export type NotificationType = 
  | 'SERVER_STATUS_CHANGE'
  | 'SERVER_CREATED'
  | 'SERVER_DELETED'
  | 'BACKUP_CREATED'
  | 'BACKUP_FAILED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'INVOICE_PAID'
  | 'INVOICE_OVERDUE'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUPPORT_TICKET_CREATED'
  | 'SUPPORT_TICKET_UPDATED';

/**
 * Értesítés prioritás
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Értesítés létrehozása
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  priority: NotificationPriority = 'medium',
  data?: any
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        priority,
        data: data || {},
        read: false,
      },
    });
  } catch (error) {
    console.error('Create notification error:', error);
    // Ne dobjunk hibát, mert az értesítések nem kritikusak
  }
}

/**
 * Felhasználó értesítéseinek lekérdezése
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<any[]> {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
}

/**
 * Értesítés olvasottnak jelölése
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return {
        success: false,
        error: 'Értesítés nem található vagy nincs jogosultság',
      };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return {
      success: false,
      error: error.message || 'Hiba történt',
    };
  }
}

/**
 * Összes értesítés olvasottnak jelölése
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean }> {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return { success: false };
  }
}

/**
 * Olvasatlan értesítések száma
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
}

