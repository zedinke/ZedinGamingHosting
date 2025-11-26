import { prisma } from '@/lib/prisma';
import { sendEmail } from './email';
import { getServerStatusEmailTemplate, getTaskCompletionEmailTemplate } from './email-templates';

/**
 * Email értesítés küldése szerver állapot változásról
 */
export async function sendServerStatusNotification(
  serverId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        user: true,
      },
    });

    if (!server || !server.user.email) {
      return;
    }

    // Csak fontos állapot változásoknál küldünk emailt
    if (
      (oldStatus === 'ONLINE' && newStatus === 'OFFLINE') ||
      (oldStatus === 'ONLINE' && newStatus === 'ERROR') ||
      (oldStatus === 'OFFLINE' && newStatus === 'ONLINE')
    ) {
      const html = getServerStatusEmailTemplate(
        server.name,
        oldStatus,
        newStatus,
        server.id,
        server.user.name || server.user.email,
        'hu' // TODO: Get locale from user preferences
      );

      await sendEmail({
        to: server.user.email,
        subject: `Szerver állapot változás: ${server.name}`,
        html,
      });
    }
  } catch (error) {
    console.error('Send server status notification error:', error);
  }
}

/**
 * Email értesítés küldése task befejezésről
 */
export async function sendTaskCompletionNotification(
  taskId: string
): Promise<void> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        server: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task || !task.server || !task.server.user.email) {
      return;
    }

    // Csak sikertelen feladatoknál küldünk emailt
    if (task.status === 'FAILED') {
      const html = getTaskCompletionEmailTemplate(
        task.type,
        task.server.name,
        task.server.id,
        task.server.user.name || task.server.user.email,
        task.error,
        'hu' // TODO: Get locale from user preferences
      );

      await sendEmail({
        to: task.server.user.email,
        subject: `Feladat sikertelen: ${task.type} - ${task.server.name}`,
        html,
      });
    }
  } catch (error) {
    console.error('Send task completion notification error:', error);
  }
}

