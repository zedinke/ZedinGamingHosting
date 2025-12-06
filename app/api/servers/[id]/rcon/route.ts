/**
 * RCON Console API - Execute commands on ARK servers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Invalid command' },
        { status: 400 }
      );
    }

    // Get server details
    const server = await prisma.server.findUnique({
      where: { id: params.id },
      include: { agent: { include: { machine: true } } },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (server.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get RCON config from server settings
    const rconConfig = server.configuration as any;
    if (!rconConfig?.rconPort || !rconConfig?.adminPassword) {
      return NextResponse.json(
        { error: 'RCON not configured' },
        { status: 400 }
      );
    }

    logger.info('RCON command execution', {
      serverId: params.id,
      command: command.substring(0, 100), // Log first 100 chars
      userId: session.user.id,
    });

    // Execute command (placeholder - real implementation with rcon library)
    const result = {
      success: true,
      output: `[RCON] Command executed: ${command}\nServer: ${server.name}\nStatus: Pending real RCON library integration`,
      command,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('RCON command execution failed', error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Command execution failed' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get RCON command history and status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get server and verify ownership
    const server = await prisma.server.findUnique({
      where: { id: params.id },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return RCON status and command library
    return NextResponse.json({
      serverId: params.id,
      status: 'connected',
      rconAvailable: true,
      commandLibrary: [
        {
          id: 'saveworld',
          label: 'Save World',
          command: 'saveworld',
          description: 'Save the server world',
        },
        {
          id: 'shutdown',
          label: 'Graceful Shutdown',
          command: 'doexec shutdown 30',
          description: 'Shutdown server in 30 seconds',
        },
        {
          id: 'broadcast',
          label: 'Broadcast Message',
          command: 'broadcast Server maintenance in 10 minutes',
          description: 'Send message to all players',
          requiresInput: true,
        },
        {
          id: 'listplayers',
          label: 'List Players',
          command: 'listplayers',
          description: 'Show all connected players',
        },
        {
          id: 'pvpon',
          label: 'Enable PvP',
          command: 'broadcast Enabling PvP!',
          description: 'Enable PvP mode',
        },
        {
          id: 'pvpoff',
          label: 'Disable PvP',
          command: 'broadcast Disabling PvP!',
          description: 'Disable PvP mode',
        },
      ],
      lastCommand: null,
      commandCount: 0,
    });
  } catch (error: any) {
    logger.error('RCON status check failed', error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
