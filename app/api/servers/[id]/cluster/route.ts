/**
 * ARK Enterprise Cluster Management API
 * GET - Cluster topology, character transfers, leaderboard
 * POST - Request character transfer, initiate failover
 * PUT - Approve transfer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  getClusterTopology,
  syncClusterCharacters,
  requestCharacterTransfer,
  approveCharacterTransfer,
  getSharedClusterInventory,
  getClusterLeaderboard,
  initiateClusterFailover,
} from '@/lib/ark-cluster-manager';

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
    const action = searchParams.get('action') || 'topology';

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
    }

    if (action === 'topology') {
      const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
      const clusterId = config.clusterId || serverId;
      const topology = await getClusterTopology(clusterId);
      return NextResponse.json({
        success: true,
        data: topology,
      });
    }

    if (action === 'leaderboard') {
      const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
      const clusterId = config.clusterId || serverId;
      const leaderboard = await getClusterLeaderboard(clusterId);
      return NextResponse.json({
        success: true,
        data: {
          leaderboard: leaderboard.slice(0, 100),
          totalPlayers: leaderboard.length,
        },
      });
    }

    if (action === 'inventory') {
      const inventory = await getSharedClusterInventory(serverId);
      return NextResponse.json({
        success: true,
        data: inventory,
      });
    }

    if (action === 'transfers') {
      const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
      const transfers = config.characterTransfers || [];
      
      return NextResponse.json({
        success: true,
        data: {
          pending: transfers.filter((t: any) => t.status === 'pending'),
          approved: transfers.filter((t: any) => t.status === 'approved'),
          transferred: transfers.filter((t: any) => t.status === 'transferred'),
          total: transfers.length,
        },
      });
    }

    return NextResponse.json({ error: 'Ismeretlen akcio' }, { status: 400 });
  } catch (error: unknown) {
    logger.error('Cluster GET error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a klaszter adatok lekérdezése során' },
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
    const { action = 'request-transfer', characterId, targetServerId, reason } = body;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check
    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    if (action === 'request-transfer') {
      if (!characterId || !targetServerId) {
        return NextResponse.json(
          { error: 'Karakterazonosító és célszerver szükséges' },
          { status: 400 }
        );
      }

      const transfer = await requestCharacterTransfer(
        characterId,
        (session.user as any).id,
        (session.user as any).name || 'Player',
        serverId,
        targetServerId,
        reason
      );

      return NextResponse.json({
        success: true,
        data: transfer,
        message: 'Karakterváltási kérelem benyújtva (adminisztratív jóváhagyásra vár)',
      });
    }

    if (action === 'sync-characters') {
      const result = await syncClusterCharacters(serverId);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Klaszter karakterei szinkronizálva',
      });
    }

    if (action === 'failover') {
      if ((session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
      }

      const targetServerId = body.targetServerId;
      if (!targetServerId) {
        return NextResponse.json(
          { error: 'Célszerver szükséges' },
          { status: 400 }
        );
      }

      const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
      const clusterId = config.clusterId || serverId;

      const result = await initiateClusterFailover(clusterId, serverId, targetServerId);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Klaszter failover megkezdve',
      });
    }

    return NextResponse.json({ error: 'Ismeretlen akcio' }, { status: 400 });
  } catch (error: unknown) {
    logger.error('Cluster POST error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a klaszter kezelésekor' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { transferId, action = 'approve' } = body;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
    }

    if (!transferId) {
      return NextResponse.json(
        { error: 'Átviteli azonosító szükséges' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const result = await approveCharacterTransfer(transferId, serverId, body.toServerId);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Karakterváltás jóváhagyva',
      });
    }

    return NextResponse.json({ error: 'Ismeretlen akcio' }, { status: 400 });
  } catch (error: unknown) {
    logger.error('Cluster PUT error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a klaszter kezelésekor' },
      { status: 500 }
    );
  }
}
