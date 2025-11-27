/**
 * Automatikus játékszerver telepítés fizetés után
 */

import { prisma } from './prisma';
import { installGameServer } from './game-server-installer';
import { provisionServer } from './server-provisioning';
import { sendNotification } from './notifications';
import { sendEmail } from './email';
import { logger } from './logger';
import { 
  getServerProvisioningFailedEmailTemplate,
  getServerInstallationFailedEmailTemplate,
  getServerInstallationSuccessEmailTemplate
} from './email-templates';

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

    // Ellenőrizzük, hogy van-e már fizetett számla VAGY az előfizetés ACTIVE státuszú
    const hasPaidInvoice = (server.subscription?.invoices?.length ?? 0) > 0 || invoiceId;
    const isSubscriptionActive = server.subscription?.status === 'ACTIVE';

    if (!hasPaidInvoice && !isSubscriptionActive) {
      logger.warn('No paid invoice or active subscription found for server', { 
        serverId,
        subscriptionStatus: server.subscription?.status,
        hasInvoices: (server.subscription?.invoices?.length ?? 0) > 0,
      });
      return {
        success: false,
        error: 'Nincs fizetett számla vagy aktív előfizetés',
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
      planId: server.subscription?.id,
    });

    if (!provisioningResult.success) {
      logger.error('Server provisioning failed', new Error(provisioningResult.error || 'Unknown error'), {
        serverId,
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
      const html = getServerProvisioningFailedEmailTemplate(
        server.name,
        server.user.name || 'Felhasználó',
        provisioningResult.error || 'Ismeretlen hiba',
        'hu' // TODO: Get locale from user preferences
      );

      await sendEmail({
        to: server.user.email || '',
        subject: 'Szerver telepítési hiba - ZedinGamingHosting',
        html,
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

    // Plan információk lekérdezése RAM számításhoz
    let ram = 2048; // Alapértelmezett
    if (server.subscription?.id) {
      const plan = await prisma.pricingPlan.findUnique({
        where: { id: server.subscription.id },
      });
      if (plan?.features) {
        const features = plan.features as any;
        // RAM lehet GB-ban vagy MB-ban
        if (features.ram) {
          ram = typeof features.ram === 'number' 
            ? (features.ram > 1000 ? features.ram : features.ram * 1024) // Ha < 1000, akkor GB, egyébként MB
            : 2048;
        }
      }
    }

    // Játékszerver telepítése
    const installResult = await installGameServer(serverId, server.gameType, {
      maxPlayers: server.maxPlayers,
      ram: ram,
      port: server.port || 25565,
      name: server.name,
      adminPassword: `admin_${serverId.substring(0, 8)}`, // Generált admin jelszó
    });

    if (!installResult.success) {
      logger.error('Game server installation failed', new Error(installResult.error || 'Unknown error'), {
        serverId,
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
      const html = getServerInstallationFailedEmailTemplate(
        server.name,
        server.user.name || 'Felhasználó',
        installResult.error || 'Ismeretlen hiba',
        'hu' // TODO: Get locale from user preferences
      );

      await sendEmail({
        to: server.user.email || '',
        subject: 'Játékszerver telepítési hiba - ZedinGamingHosting',
        html,
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
    const html = getServerInstallationSuccessEmailTemplate(
      server.name,
      server.gameType,
      updatedServer.agent.machine.ipAddress,
      server.port || 25565,
      server.maxPlayers,
      server.user.name || 'Felhasználó',
      server.id,
      'hu' // TODO: Get locale from user preferences
    );

    await sendEmail({
      to: server.user.email || '',
      subject: 'Szerver sikeresen telepítve - ZedinGamingHosting',
      html,
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

