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
 * Legacy auto-install kikapcsolva. A régi installer/provisioning rendszer eltávolítva.
 */
export async function triggerAutoInstallOnPayment(
  serverId: string,
  invoiceId?: string
): Promise<{ success: boolean; error?: string }> {
  const message = 'Auto-install kikapcsolva (legacy rendszer eltávolítva). Használd az új template-alapú deployt.';
  console.warn(message, { serverId, invoiceId });
  return { success: false, error: message };
}

