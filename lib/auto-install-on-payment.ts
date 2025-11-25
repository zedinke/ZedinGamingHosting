/**
 * Automatikus játékszerver telepítés fizetés után
 */

import { prisma } from './prisma';
import { installGameServer } from './game-server-installer';
import { provisionServer } from './server-provisioning';
import { sendNotification } from './notifications';
import { sendEmail } from './email';
import { logger } from './logger';

/**
 * Automatikus telepítés triggerelése fizetés után
 */
export async function triggerAutoInstallOnPayment(
  serverId: string,
  invoiceId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Triggering auto-install on payment', { serverId, invoiceId });

    // Szerver lekérdezése
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: {
          include: {
            invoices: {
              where: {
                status: 'PAID',
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!server) {
      return {
        success: false,
        error: 'Szerver nem található',
      };
    }

    // Ellenőrizzük, hogy van-e már fizetett számla
    const hasPaidInvoice = server.subscription?.invoices.length > 0 || invoiceId;

    if (!hasPaidInvoice) {
      logger.warn('No paid invoice found for server', { serverId });
      return {
        success: false,
        error: 'Nincs fizetett számla',
      };
    }

    // Ha már telepítve van, ne telepítsük újra
    if (server.status !== 'OFFLINE' && server.machineId && server.agentId) {
      logger.info('Server already provisioned', { serverId });
      return {
        success: true,
      };
    }

    // Szerver provisioning (gép és agent kiválasztása)
    const provisioningResult = await provisionServer(serverId, {
      gameType: server.gameType,
      maxPlayers: server.maxPlayers,
      planId: server.subscription?.id || undefined,
    });

    if (!provisioningResult.success) {
      logger.error('Server provisioning failed', {
        serverId,
        error: provisioningResult.error,
      });

      // Értesítés küldése a felhasználónak
      await sendNotification(server.userId, {
        type: 'server_provisioning_failed',
        title: 'Szerver telepítési hiba',
        message: `A(z) "${server.name}" szerver telepítése sikertelen volt. Kérjük, lépjen kapcsolatba az ügyfélszolgálattal.`,
        priority: 'high',
        data: {
          serverId: server.id,
          error: provisioningResult.error,
        },
      });

      // Email küldése
      await sendEmail({
        to: server.user.email || '',
        subject: 'Szerver telepítési hiba - ZedinGamingHosting',
        html: `
          <h2>Szerver telepítési hiba</h2>
          <p>Kedves ${server.user.name || 'Felhasználó'}!</p>
          <p>A(z) "${server.name}" szerver telepítése sikertelen volt.</p>
          <p>Hiba: ${provisioningResult.error || 'Ismeretlen hiba'}</p>
          <p>Kérjük, lépjen kapcsolatba az ügyfélszolgálattal a probléma megoldásához.</p>
          <p>Üdvözlettel,<br>ZedinGamingHosting Csapat</p>
        `,
      });

      return {
        success: false,
        error: provisioningResult.error,
      };
    }

    // Szerver frissítése
    const updatedServer = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!updatedServer || !updatedServer.agent) {
      return {
        success: false,
        error: 'Szerver vagy agent nem található a provisioning után',
      };
    }

    // Játékszerver telepítése
    const installResult = await installGameServer(serverId, server.gameType, {
      maxPlayers: server.maxPlayers,
      ram: 2048, // TODO: Get from plan
      port: server.port || 25565,
      name: server.name,
      adminPassword: `admin_${serverId.substring(0, 8)}`, // Generált admin jelszó
    });

    if (!installResult.success) {
      logger.error('Game server installation failed', {
        serverId,
        error: installResult.error,
      });

      // Szerver státusz frissítése hibára
      await prisma.server.update({
        where: { id: serverId },
        data: { status: 'ERROR' },
      });

      // Értesítés küldése
      await sendNotification(server.userId, {
        type: 'server_installation_failed',
        title: 'Játékszerver telepítési hiba',
        message: `A(z) "${server.name}" játékszerver telepítése sikertelen volt. Kérjük, lépjen kapcsolatba az ügyfélszolgálattal.`,
        priority: 'high',
        data: {
          serverId: server.id,
          error: installResult.error,
        },
      });

      // Email küldése
      await sendEmail({
        to: server.user.email || '',
        subject: 'Játékszerver telepítési hiba - ZedinGamingHosting',
        html: `
          <h2>Játékszerver telepítési hiba</h2>
          <p>Kedves ${server.user.name || 'Felhasználó'}!</p>
          <p>A(z) "${server.name}" játékszerver telepítése sikertelen volt.</p>
          <p>Hiba: ${installResult.error || 'Ismeretlen hiba'}</p>
          <p>Kérjük, lépjen kapcsolatba az ügyfélszolgálattal a probléma megoldásához.</p>
          <p>Üdvözlettel,<br>ZedinGamingHosting Csapat</p>
        `,
      });

      return {
        success: false,
        error: installResult.error,
      };
    }

    // Szerver státusz frissítése ONLINE-ra
    await prisma.server.update({
      where: { id: serverId },
      data: { status: 'ONLINE' },
    });

    // Sikeres telepítés értesítés
    await sendNotification(server.userId, {
      type: 'server_installed',
      title: 'Szerver sikeresen telepítve!',
      message: `A(z) "${server.name}" szervered sikeresen telepítve és elindítva. IP: ${updatedServer.agent.machine.ipAddress}:${server.port}`,
      priority: 'high',
      data: {
        serverId: server.id,
        ipAddress: updatedServer.agent.machine.ipAddress,
        port: server.port,
      },
    });

    // Email küldése
    await sendEmail({
      to: server.user.email || '',
      subject: 'Szerver sikeresen telepítve - ZedinGamingHosting',
      html: `
        <h2>Szerver sikeresen telepítve!</h2>
        <p>Kedves ${server.user.name || 'Felhasználó'}!</p>
        <p>A(z) "${server.name}" szervered sikeresen telepítve és elindítva.</p>
        <h3>Szerver információk:</h3>
        <ul>
          <li><strong>Név:</strong> ${server.name}</li>
          <li><strong>Játék:</strong> ${server.gameType}</li>
          <li><strong>IP cím:</strong> ${updatedServer.agent.machine.ipAddress}</li>
          <li><strong>Port:</strong> ${server.port}</li>
          <li><strong>Max játékosok:</strong> ${server.maxPlayers}</li>
        </ul>
        <p>Most már csatlakozhatsz a szerverhez!</p>
        <p>Üdvözlettel,<br>ZedinGamingHosting Csapat</p>
      `,
    });

    logger.info('Auto-install completed successfully', {
      serverId,
      ipAddress: updatedServer.agent.machine.ipAddress,
      port: server.port,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error('Auto-install error', error as Error, { serverId });
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba az automatikus telepítés során',
    };
  }
}

