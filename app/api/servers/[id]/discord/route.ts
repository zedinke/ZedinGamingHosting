/**
 * ARK Enterprise Discord Integration API
 * GET - Discord webhook configuration
 * POST - Configure webhooks, test connection
 * DELETE - Remove webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  configureDiscordWebhooks,
  validateDiscordWebhook,
  sendServerStatusUpdate,
  sendDailyReport,
} from '@/lib/ark-discord-integration';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;
    const searchParams = new URL(request.url).searchParams;
    const action = searchParams.get('action') || 'list';

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
    }

    const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};

    if (action === 'status') {
      return NextResponse.json({
        success: true,
        data: {
          configured: !!config.discordWebhooks,
          webhooks: config.discordWebhooks || {},
          totalWebhooks: Object.keys(config.discordWebhooks || {}).length,
        },
      });
    }

    // Default: list all webhooks
    return NextResponse.json({
      success: true,
      data: {
        webhooks: config.discordWebhooks || {},
        channels: Object.keys(config.discordWebhooks || {}),
      },
    });
  } catch (error: unknown) {
    logger.error('Discord GET error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a Discord webhooks lekérdezése során' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;
    const body = await request.json();
    const { action = 'configure', channel, webhookUrl, testConnection = false } = body;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
    }

    if (action === 'configure') {
      if (!channel || !webhookUrl) {
        return NextResponse.json(
          { error: 'Channel és webhookUrl szükséges' },
          { status: 400 }
        );
      }

      // Validate webhook first
      const isValid = await validateDiscordWebhook(webhookUrl);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Érvénytelen Discord webhook URL' },
          { status: 400 }
        );
      }

      const result = await configureDiscordWebhooks(serverId, {
        [channel]: webhookUrl,
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: `Discord webhook sikeresen konfigurálva: ${channel}`,
      });
    }

    if (action === 'test') {
      if (!webhookUrl) {
        return NextResponse.json(
          { error: 'Webhook URL szükséges' },
          { status: 400 }
        );
      }

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '✅ Discord Integration Test',
              description: `Szerver: ${server.name}`,
              color: 65280,
              timestamp: new Date().toISOString(),
            }],
          }),
        });

        return NextResponse.json({
          success: true,
          message: 'Webhook tesztelése sikeres',
        });
      } catch (error: unknown) {
        logger.error('Webhook test error:', error as Error);
        return NextResponse.json(
          { error: 'Webhook teszt sikertelen' },
          { status: 400 }
        );
      }
    }

    if (action === 'send-status') {
      const status = body.status || 'online'; // online, offline, maintenance, restarting
      await sendServerStatusUpdate(serverId, status as any);

      return NextResponse.json({
        success: true,
        message: `Szerver státusz frissítve: ${status}`,
      });
    }

    if (action === 'send-daily-report') {
      const report = await sendDailyReport(serverId);

      return NextResponse.json({
        success: true,
        data: report,
        message: 'Napi jelentés elküldve',
      });
    }

    return NextResponse.json({ error: 'Ismeretlen akcio' }, { status: 400 });
  } catch (error: unknown) {
    logger.error('Discord POST error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a Discord konfigurálása során' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const serverId = params.id;
    const searchParams = new URL(request.url).searchParams;
    const channel = searchParams.get('channel');

    if (!channel) {
      return NextResponse.json({ error: 'Channel szükséges' }, { status: 400 });
    }

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
    }

    const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
    const webhooks = { ...config.discordWebhooks };
    delete webhooks[channel];

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          discordWebhooks: webhooks,
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Discord webhook eltávolítva: ${channel}`,
    });
  } catch (error: unknown) {
    logger.error('Discord DELETE error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a webhook eltávolítása során' },
      { status: 500 }
    );
  }
}
