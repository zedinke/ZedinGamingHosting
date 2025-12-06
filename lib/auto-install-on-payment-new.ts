/**
 * ÚJ & EGYSZERŰSÍTETT Auto-Install On Payment
 * Moduláris installer-t és egyszerűsített provisioning-ot használ
 */

import { prisma } from './prisma';
import { provisionServerViaAgent } from './agent-provisioning-new';
import { sendNotification } from './notifications';
import { sendEmail } from './email';
import { logger } from './logger';
import {
  getServerProvisioningFailedEmailTemplate,
  getServerInstallationSuccessEmailTemplate,
} from './email-templates';
import { DebugLogger } from './installers/utils/DebugLogger';

/**
 * Automatikus telepítés triggerelése fizetés után - EGYSZERŰSÍTETT
 */
export async function triggerAutoInstallOnPayment(
  serverId: string,
  invoiceId?: string
): Promise<{ success: boolean; error?: string }> {
  const debugLogger = new DebugLogger(`autoinstall:${serverId}`);

  try {
    debugLogger.info('🚀 Auto-install started on payment', { serverId, invoiceId });

    // 1. Szerver lekérdezése
    debugLogger.debug('1️⃣ Fetching server');
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
        subscription: true,
        agent: true,
      },
    });

    if (!server) {
      throw new Error(`Server not found: ${serverId}`);
    }

    debugLogger.info('✅ Server found', {
      serverId: server.id,
      name: server.name,
      gameType: server.gameType,
      maxPlayers: server.maxPlayers,
    });

    // 2. Ha már telepítve van, skip
    debugLogger.debug('2️⃣ Checking if already installed');
    if (server.status !== 'OFFLINE' && server.machineId && server.agentId) {
      debugLogger.info('⚠️ Server already provisioned, skipping');
      return { success: true };
    }

    // 3. Gép és agent keresése
    debugLogger.debug('3️⃣ Finding best machine');
    const machine = await prisma.serverMachine.findFirst({
      where: { status: 'ONLINE' },
      include: {
        agents: {
          where: { status: 'ONLINE' },
          take: 1,
        },
      },
    });

    if (!machine || machine.agents.length === 0) {
      throw new Error('No available machine or agent');
    }

    const agent = machine.agents[0];

    debugLogger.info('✅ Machine and agent found', {
      machine: machine.name,
      agent: agent.agentId,
    });

    // 4. Server update machineId/agentId-vel
    debugLogger.debug('4️⃣ Updating server with machineId/agentId');
    await prisma.server.update({
      where: { id: serverId },
      data: {
        machineId: machine.id,
        agentId: agent.id,
        status: 'STARTING',
      },
    });

    // 5. Provision request agent-hez
    debugLogger.debug('5️⃣ Calling provisionServerViaAgent');
    const provisionResult = await provisionServerViaAgent(agent.id, serverId, {
      gameType: server.gameType,
      serverName: server.name,
      port: server.port || 27015,
      adminPassword: `admin_${serverId.substring(0, 8)}`,
      serverPassword: (server.configuration as any)?.password,
      maxPlayers: server.maxPlayers,
      map: (server.configuration as any)?.map,
      ram: (server.configuration as any)?.ram || 8192,
    });

    if (!provisionResult.success) {
      throw new Error(provisionResult.error || 'Provisioning failed');
    }

    debugLogger.info('✅ Provisioning successful', {
      message: provisionResult.message,
    });

    // 6. Felhasználói értesítés - sikeres
    if (server.user?.id) {
      try {
        await sendNotification(server.user.id, {
          type: 'server_installation_success',
          title: 'Szerver telepítve',
          message: `A(z) "${server.name}" szerver sikeresen telepítve lett.`,
          priority: 'medium',
          data: { serverId },
        });
      } catch (e) {
        debugLogger.warn('Could not send notification', e);
      }
    }

    // 7. Email - sikeres
    if (server.user?.email) {
      try {
        const html = getServerInstallationSuccessEmailTemplate(
          server.name,
          server.gameType,
          server.ipAddress || '0.0.0.0',
          server.port || 27015,
          server.maxPlayers,
          server.user.name || 'Felhasználó',
          server.id,
          'hu'
        );

        await sendEmail({
          to: server.user.email,
          subject: `"${server.name}" szerver telepítve - ZedinGamingHosting`,
          html,
        });
      } catch (e) {
        debugLogger.warn('Could not send email', e);
      }
    }

    debugLogger.info('✅ Auto-install completed successfully', { serverId });

    return { success: true };
  } catch (error: any) {
    debugLogger.error('❌ Auto-install failed', error);
    logger.error('Auto-install failed', error, { serverId });

    // Server status ERROR-re
    try {
      await prisma.server.update({
        where: { id: serverId },
        data: { status: 'ERROR' },
      });
    } catch (e) {
      debugLogger.warn('Could not update server status', e);
    }

    // Felhasználói értesítés - hiba
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { user: true },
    });

    if (server?.user?.id) {
      try {
        await sendNotification(server.user.id, {
          type: 'server_installation_failed',
          title: 'Szerver telepítési hiba',
          message: `A(z) "${server.name}" szerver telepítése sikertelen volt.`,
          priority: 'high',
          data: { serverId, error: error.message },
        });

        // Email küldése
        const html = getServerProvisioningFailedEmailTemplate(
          server.name,
          server.user.name || 'Felhasználó',
          error.message,
          'hu'
        );

        await sendEmail({
          to: server.user.email || '',
          subject: 'Szerver telepítési hiba - ZedinGamingHosting',
          html,
        });
      } catch (e) {
        debugLogger.warn('Could not send error notification', e);
      }
    }

    return {
      success: false,
      error: error.message || 'Installation failed',
    };
  }
}
