/**
 * API: Rust Mod Marketplace
 * GET /api/rust-mods - List all available mods
 * GET /api/rust-mods/:id - Get mod details
 * POST /api/rust-mods/purchase - Purchase and install mod
 * GET /api/rust-mods/:serverId/installed - Get installed mods
 * DELETE /api/rust-mods/:serverId/:modId - Uninstall mod
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Build filter
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch mods with pagination
    const mods = await prisma.rustMod.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        isFeatured: 'desc',
        popularity: 'desc',
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        author: true,
        version: true,
        category: true,
        imageUrl: true,
        price: true,
        currency: true,
        popularity: true,
        rating: true,
        reviews: true,
        isFeatured: true,
      },
    });

    // Get total count
    const total = await prisma.rustMod.count({ where });

    return NextResponse.json({
      mods,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching Rust mods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { modId, serverId } = await req.json();

    if (!modId || !serverId) {
      return NextResponse.json({ error: 'Missing modId or serverId' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify server ownership
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server || server.userId !== user.id) {
      return NextResponse.json({ error: 'Server not found or unauthorized' }, { status: 404 });
    }

    // Verify game is RUST
    if (!server.gameType || !server.gameType.includes('RUST')) {
      return NextResponse.json({ error: 'This server is not a Rust server' }, { status: 400 });
    }

    // Get mod details
    const mod = await prisma.rustMod.findUnique({
      where: { id: modId },
    });

    if (!mod) {
      return NextResponse.json({ error: 'Mod not found' }, { status: 404 });
    }

    // Check if already purchased (for paid mods)
    if (mod.price > 0) {
      const existingPurchase = await prisma.modPurchase.findUnique({
        where: {
          userId_modId_serverId: {
            userId: user.id,
            modId: modId,
            serverId: serverId,
          },
        },
      });

      if (existingPurchase && existingPurchase.status === 'COMPLETED') {
        return NextResponse.json(
          { error: 'Mod already purchased for this server' },
          { status: 400 }
        );
      }
    }

    // Create purchase record
    const purchase = await prisma.modPurchase.create({
      data: {
        userId: user.id,
        modId: modId,
        serverId: serverId,
        price: mod.price,
        currency: mod.currency,
        status: mod.price === 0 ? 'COMPLETED' : 'PENDING',
        autoInstall: true,
      },
    });

    // If free mod or immediate payment, trigger installation
    if (mod.price === 0) {
      // Queue installation via agent
      // This would be handled by the agent service
      // For now, mark as auto-install
    }

    return NextResponse.json({
      success: true,
      purchase,
      message: mod.price === 0 
        ? 'Mod will be installed shortly' 
        : 'Please complete payment to install this mod',
    });
  } catch (error) {
    console.error('Error purchasing mod:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
