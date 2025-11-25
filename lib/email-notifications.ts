import { prisma } from '@/lib/prisma';
import { sendEmail } from './email';

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
      const subject = `Szerver állapot változás: ${server.name}`;
      const message = `
        <h2>Szerver állapot változás</h2>
        <p>Kedves ${server.user.name || server.user.email},</p>
        <p>A(z) <strong>${server.name}</strong> szerver állapota megváltozott:</p>
        <ul>
          <li>Régi állapot: <strong>${oldStatus}</strong></li>
          <li>Új állapot: <strong>${newStatus}</strong></li>
        </ul>
        <p>Részletek: <a href="${process.env.NEXTAUTH_URL}/dashboard/servers/${server.id}">Szerver részletek</a></p>
      `;

      await sendEmail({
        to: server.user.email,
        subject,
        html: message,
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
      const subject = `Feladat sikertelen: ${task.type} - ${task.server.name}`;
      const message = `
        <h2>Feladat sikertelen</h2>
        <p>Kedves ${task.server.user.name || task.server.user.email},</p>
        <p>A(z) <strong>${task.server.name}</strong> szerveren végrehajtott <strong>${task.type}</strong> feladat sikertelen volt.</p>
        ${task.error ? `<p>Hibaüzenet: <strong>${task.error}</strong></p>` : ''}
        <p>Részletek: <a href="${process.env.NEXTAUTH_URL}/dashboard/servers/${task.server.id}">Szerver részletek</a></p>
      `;

      await sendEmail({
        to: task.server.user.email,
        subject,
        html: message,
      });
    }
  } catch (error) {
    console.error('Send task completion notification error:', error);
  }
}

