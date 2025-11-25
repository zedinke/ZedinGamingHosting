import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

/**
 * Webhook küldése
 */
export async function sendWebhook(
  webhookId: string,
  event: string,
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || !webhook.active) {
      return { success: false, error: 'Webhook nem található vagy inaktív' };
    }

    // Ellenőrizzük, hogy a webhook figyeli-e ezt az eseményt
    const events = webhook.events as string[];
    if (!events.includes(event)) {
      return { success: false, error: 'Webhook nem figyeli ezt az eseményt' };
    }

    // Payload létrehozása
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Signature generálása, ha van secret
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['x-webhook-signature'] = signature;
    }

    // Webhook küldése
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook hiba: ${response.status} ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Send webhook error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a webhook küldése során',
    };
  }
}

/**
 * Esemény küldése minden aktív webhooknak
 */
export async function sendWebhookEvent(
  event: string,
  data: any
): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        active: true,
      },
    });

    // Minden webhook-nak küldjük, ami figyeli ezt az eseményt
    const promises = webhooks
      .filter((webhook) => {
        const events = webhook.events as string[];
        return events.includes(event);
      })
      .map((webhook) => sendWebhook(webhook.id, event, data));

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Send webhook event error:', error);
    // Ne dobjunk hibát, mert a webhook küldés nem kritikus
  }
}

/**
 * Discord webhook formátum
 */
export function formatDiscordWebhook(payload: WebhookPayload): any {
  const { event, data } = payload;

  let title = 'Esemény';
  let description = '';
  let color = 0x3498db; // Kék

  switch (event) {
    case 'server_status_change':
      title = 'Szerver Állapot Változás';
      description = `**${data.serverName}** állapota megváltozott: \`${data.oldStatus}\` → \`${data.newStatus}\``;
      color = data.newStatus === 'ONLINE' ? 0x2ecc71 : 0xe74c3c; // Zöld vagy piros
      break;
    case 'task_completed':
      title = 'Feladat Befejezve';
      description = `**${data.taskType}** feladat sikeresen befejezve`;
      color = 0x2ecc71; // Zöld
      break;
    case 'task_failed':
      title = 'Feladat Sikertelen';
      description = `**${data.taskType}** feladat sikertelen: ${data.error}`;
      color = 0xe74c3c; // Piros
      break;
    case 'backup_created':
      title = 'Backup Létrehozva';
      description = `Backup sikeresen létrehozva: **${data.backupName}**`;
      color = 0x3498db; // Kék
      break;
    case 'agent_offline':
      title = 'Agent Offline';
      description = `**${data.agentId}** agent offline-ra váltott`;
      color = 0xe74c3c; // Piros
      break;
  }

  return {
    embeds: [
      {
        title,
        description,
        color,
        timestamp: payload.timestamp,
        footer: {
          text: 'ZedinGamingHosting',
        },
      },
    ],
  };
}

/**
 * Slack webhook formátum
 */
export function formatSlackWebhook(payload: WebhookPayload): any {
  const { event, data } = payload;

  let text = '';
  let color = 'good'; // Zöld

  switch (event) {
    case 'server_status_change':
      text = `*Szerver Állapot Változás*\n${data.serverName}: ${data.oldStatus} → ${data.newStatus}`;
      color = data.newStatus === 'ONLINE' ? 'good' : 'danger';
      break;
    case 'task_completed':
      text = `*Feladat Befejezve*\n${data.taskType} feladat sikeresen befejezve`;
      color = 'good';
      break;
    case 'task_failed':
      text = `*Feladat Sikertelen*\n${data.taskType} feladat sikertelen: ${data.error}`;
      color = 'danger';
      break;
    case 'backup_created':
      text = `*Backup Létrehozva*\n${data.backupName} backup sikeresen létrehozva`;
      color = 'good';
      break;
    case 'agent_offline':
      text = `*Agent Offline*\n${data.agentId} agent offline-ra váltott`;
      color = 'danger';
      break;
  }

  return {
    attachments: [
      {
        color,
        text,
        ts: Math.floor(new Date(payload.timestamp).getTime() / 1000),
      },
    ],
  };
}

/**
 * Webhook küldése formázott formában (Discord/Slack)
 */
export async function sendFormattedWebhook(
  webhookId: string,
  event: string,
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || !webhook.active) {
      return { success: false, error: 'Webhook nem található vagy inaktív' };
    }

    const events = webhook.events as string[];
    if (!events.includes(event)) {
      return { success: false, error: 'Webhook nem figyeli ezt az eseményt' };
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Webhook URL alapján formátum meghatározása
    let formattedPayload: any;
    if (webhook.url.includes('discord.com/api/webhooks')) {
      formattedPayload = formatDiscordWebhook(payload);
    } else if (webhook.url.includes('hooks.slack.com')) {
      formattedPayload = formatSlackWebhook(payload);
    } else {
      // Általános formátum
      formattedPayload = payload;
    }

    // Signature generálása
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(formattedPayload))
        .digest('hex');
      headers['x-webhook-signature'] = signature;
    }

    // Webhook küldése
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(formattedPayload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook hiba: ${response.status} ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Send formatted webhook error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a webhook küldése során',
    };
  }
}

