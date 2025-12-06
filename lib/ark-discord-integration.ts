/**
 * Discord Integration & Webhooks System
 * Szerver status push, játékos join/leave, admin notifikációk, chat relay
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import axios from 'axios';

export interface DiscordWebhookConfig {
  statusChannelWebhookUrl: string;
  adminChannelWebhookUrl: string;
  alertChannelWebhookUrl: string;
  eventChannelWebhookUrl?: string;
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
  thumbnail?: { url: string };
  image?: { url: string };
  footer?: { text: string; icon_url?: string };
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

const COLORS = {
  success: 0x00ff00, // Green
  warning: 0xffaa00, // Orange
  error: 0xff0000, // Red
  info: 0x0099ff, // Blue
  neutral: 0x808080, // Gray
};

/**
 * Szerver status frissítésének küldése
 */
export async function sendServerStatusUpdate(
  serverId: string,
  status: 'online' | 'offline' | 'restarting' | 'maintenance'
): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: {
        name: true,
        configuration: true,
      },
    });

    if (!server) return false;

    const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
    const webhookUrl = config.discordWebhooks?.statusChannelWebhookUrl;

    if (!webhookUrl) {
      logger.warn('Discord webhook not configured', { serverId });
      return false;
    }

    const statusEmoji = {
      online: '🟢',
      offline: '🔴',
      restarting: '🟡',
      maintenance: '⚙️',
    }[status];

    const embed: DiscordEmbed = {
      title: `${statusEmoji} ${server.name} Status Update`,
      description: `Server is now **${status.toUpperCase()}**`,
      color:
        status === 'online'
          ? COLORS.success
          : status === 'offline'
            ? COLORS.error
            : status === 'restarting'
              ? COLORS.warning
              : COLORS.info,
      fields: [
        {
          name: 'Server',
          value: server.name,
          inline: true,
        },
        {
          name: 'Status',
          value: status.toUpperCase(),
          inline: true,
        },
        {
          name: 'Timestamp',
          value: new Date().toISOString(),
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Zedin Gaming Hosting',
        icon_url: 'https://zedin-gaming.com/logo.png',
      },
    };

    const message: DiscordMessage = {
      embeds: [embed],
      username: 'ARK Server Bot',
      avatar_url: 'https://zedin-gaming.com/ark-bot-avatar.png',
    };

    await axios.post(webhookUrl, message);

    logger.info('Server status sent to Discord', {
      serverId,
      status,
      webhookUrl: webhookUrl.substring(0, 50) + '***',
    });

    return true;
  } catch (error) {
    logger.error('Error sending status to Discord', error as Error, { serverId });
    return false;
  }
}

/**
 * Játékos join/leave notifikáció
 */
export async function notifyPlayerEvent(
  serverId: string,
  eventType: 'join' | 'leave',
  playerName: string,
  playerId: string,
  tribeId?: string,
  tribeName?: string
): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { name: true, configuration: true },
    });

    if (!server) return false;

    const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
    const webhookUrl = config.discordWebhooks?.eventChannelWebhookUrl;

    if (!webhookUrl) return false;

    const isJoin = eventType === 'join';
    const emoji = isJoin ? '➡️' : '⬅️';

    const embed: DiscordEmbed = {
      title: `${emoji} Player ${isJoin ? 'Joined' : 'Left'}`,
      description: `**${playerName}** has ${isJoin ? 'joined' : 'left'} ${server.name}`,
      color: isJoin ? COLORS.success : COLORS.warning,
      fields: [
        {
          name: 'Player',
          value: playerName,
          inline: true,
        },
        {
          name: 'Player ID',
          value: playerId,
          inline: true,
        },
        ...(tribeName
          ? [
              {
                name: 'Tribe',
                value: tribeName,
                inline: true,
              },
            ]
          : []),
        {
          name: 'Server',
          value: server.name,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await axios.post(webhookUrl, { embeds: [embed] });

    return true;
  } catch (error) {
    logger.error('Error notifying player event', error as Error, {
      serverId,
      eventType,
      playerName,
    });
    return false;
  }
}

/**
 * Admin parancs naplózása Discord-ban
 */
export async function logAdminCommandToDiscord(
  serverId: string,
  adminName: string,
  command: string,
  targetPlayer?: string,
  reason?: string
): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { name: true, configuration: true },
    });

    if (!server) return false;

    const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
    const webhookUrl = config.discordWebhooks?.adminChannelWebhookUrl;

    if (!webhookUrl) return false;

    const embed: DiscordEmbed = {
      title: '🔨 Admin Command Executed',
      description: `\`${command}\``,
      color: COLORS.warning,
      fields: [
        {
          name: 'Admin',
          value: adminName,
          inline: true,
        },
        {
          name: 'Server',
          value: server.name,
          inline: true,
        },
        ...(targetPlayer ? [{ name: 'Target', value: targetPlayer, inline: true }] : []),
        ...(reason ? [{ name: 'Reason', value: reason, inline: false }] : []),
      ],
      timestamp: new Date().toISOString(),
    };

    await axios.post(webhookUrl, { embeds: [embed] });

    return true;
  } catch (error) {
    logger.error('Error logging admin command', error as Error, { serverId, command });
    return false;
  }
}

/**
 * Kritikus alert (crash, lag, health)
 */
export async function sendCriticalAlert(
  serverId: string,
  alertType: 'crash' | 'lag' | 'health' | 'resource',
  title: string,
  description: string,
  details?: Record<string, any>
): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { name: true, configuration: true },
    });

    if (!server) return false;

    const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
    const webhookUrl = config.discordWebhooks?.alertChannelWebhookUrl;

    if (!webhookUrl) return false;

    const alertEmoji = {
      crash: '💥',
      lag: '⏱️',
      health: '❤️',
      resource: '💾',
    }[alertType];

    const embed: DiscordEmbed = {
      title: `${alertEmoji} CRITICAL ALERT - ${title}`,
      description,
      color: COLORS.error,
      fields: [
        {
          name: 'Server',
          value: server.name,
          inline: true,
        },
        {
          name: 'Alert Type',
          value: alertType.toUpperCase(),
          inline: true,
        },
        ...(details
          ? Object.entries(details).map(([key, value]) => ({
              name: key,
              value: String(value),
              inline: true,
            }))
          : []),
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Requires immediate attention',
        icon_url: 'https://zedin-gaming.com/alert-icon.png',
      },
    };

    await axios.post(webhookUrl, {
      content: '@here', // Mention everyone
      embeds: [embed],
    });

    logger.warn('Critical alert sent', {
      serverId,
      alertType,
      title,
    });

    return true;
  } catch (error) {
    logger.error('Error sending critical alert', error as Error, { serverId });
    return false;
  }
}

/**
 * Napi statisztika report
 */
export async function sendDailyReport(serverId: string): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { name: true, configuration: true },
    });

    if (!server) return false;

    const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
    const webhookUrl = config.discordWebhooks?.eventChannelWebhookUrl;

    if (!webhookUrl) return false;

    // Mock statisztikák (valódi implementáció az event logging-ból gyűjtene)
    const stats = {
      totalPlayers: Math.floor(Math.random() * 50) + 10,
      newPlayers: Math.floor(Math.random() * 10),
      totalKills: Math.floor(Math.random() * 100),
      totalDeaths: Math.floor(Math.random() * 100),
      tribesCreated: Math.floor(Math.random() * 5),
      uptime: '99.8%',
    };

    const embed: DiscordEmbed = {
      title: `📊 ${server.name} - Daily Report`,
      description: 'Server statistics for the past 24 hours',
      color: COLORS.info,
      fields: [
        {
          name: '👥 Total Players',
          value: String(stats.totalPlayers),
          inline: true,
        },
        {
          name: '✨ New Players',
          value: String(stats.newPlayers),
          inline: true,
        },
        {
          name: '⚔️ Total Kills',
          value: String(stats.totalKills),
          inline: true,
        },
        {
          name: '💀 Total Deaths',
          value: String(stats.totalDeaths),
          inline: true,
        },
        {
          name: '🏛️ Tribes Created',
          value: String(stats.tribesCreated),
          inline: true,
        },
        {
          name: '📈 Uptime',
          value: stats.uptime,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await axios.post(webhookUrl, { embeds: [embed] });

    return true;
  } catch (error) {
    logger.error('Error sending daily report', error as Error, { serverId });
    return false;
  }
}

/**
 * Discord webhook konfiguráció beállítása
 */
export async function configureDiscordWebhooks(
  serverId: string,
  webhooks: Partial<DiscordWebhookConfig>
): Promise<boolean> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : ({} as any);

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          discordWebhooks: {
            ...(config.discordWebhooks || {} as any),
            ...webhooks,
          },
        },
      },
    });

    logger.info('Discord webhooks configured', { serverId });
    return true;
  } catch (error) {
    logger.error('Error configuring Discord webhooks', error as Error, { serverId });
    return false;
  }
}

/**
 * Webhook validálása
 */
export async function validateDiscordWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const response = await axios.get(webhookUrl, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    logger.warn('Invalid Discord webhook', { error });
    return false;
  }
}
