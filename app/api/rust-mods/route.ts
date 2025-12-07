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
import { executeSSHCommand } from '@/lib/ssh-client';

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
    if (mod.price === 0 || true) {  // For testing, allow immediate install for all
      try {
        // Get server machine details for SSH connection
        const machine = await prisma.serverMachine.findUnique({
          where: { id: server.machineId! },
        });

        if (!machine || !machine.ipAddress || !machine.sshKeyPath) {
          throw new Error('Server machine not properly configured for installation');
        }

        // Create mod installation record
        const installation = await prisma.modInstallation.create({
          data: {
            serverId: serverId,
            modId: modId,
            status: 'INSTALLING',
          },
        });

        // Queue installation in background (don't await, let it run async)
        installModAsync(server.id, mod, machine, installation.id).catch(err => {
          console.error(`Mod installation failed for ${modId} on ${serverId}:`, err);
        });
      } catch (error) {
        console.error('Error queuing mod installation:', error);
        // Don't fail the purchase, just log the error
        // Installation will be marked as INSTALLED manually later
      }
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

/**
 * Background mod installation via SSH
 */
async function installModAsync(
  serverId: string,
  mod: any,
  machine: any,
  installationId: string
) {
  try {
    console.log(`[Mod Install] Starting installation of ${mod.displayName} on server ${serverId}`);

    // Get server info
    const server = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new Error('Server not found');
    }

    // Download mod file (simulated - in real world would download from S3/CDN)
    const modFileName = `${mod.name}-${mod.version}.zip`;
    const modDownloadUrl = mod.downloadUrl || `https://mods.example.com/${modFileName}`;

    // Create installation script
    const installScript = `#!/bin/bash
set -e

echo "[Rust Mod Install] Installing ${mod.displayName} v${mod.version}..."

# Rust server paths
MOD_DIR="/opt/servers/${server.id}/mods"
mkdir -p "$MOD_DIR"

# Download mod (if URL available)
if [ -n "${modDownloadUrl}" ]; then
  echo "[Mod Install] Downloading mod..."
  cd "$MOD_DIR"
  wget -q "${modDownloadUrl}" -O "${modFileName}"
  unzip -q "${modFileName}"
  rm "${modFileName}"
else
  echo "[Mod Install] Using bundled mod files..."
fi

# Set permissions
chmod -R 755 "$MOD_DIR"
chown -R rust:rust "$MOD_DIR" 2>/dev/null || true

echo "[Rust Mod Install] ${mod.displayName} installed successfully!"
exit 0
`;

    // Execute on server via SSH
    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || '/root/.ssh/gameserver_rsa',
        port: machine.sshPort,
      },
      `bash -c '${installScript.replace(/'/g, "'\\''")}'`,
      60000 // 60 second timeout for mod installation
    );

    console.log(`[Mod Install] Installation output:`, result);

    // Update installation status to INSTALLED
    await prisma.modInstallation.update({
      where: { id: installationId },
      data: {
        status: 'INSTALLED',
      },
    });

    console.log(`[Mod Install] Successfully installed ${mod.displayName} on server ${serverId}`);
  } catch (error) {
    console.error(`[Mod Install] Error installing mod:`, error);

    // Mark installation as failed
    try {
      await prisma.modInstallation.update({
        where: { id: installationId },
        data: {
          status: 'FAILED',
        },
      });
    } catch (err) {
      console.error('Error updating mod installation status:', err);
    }
  }
}
