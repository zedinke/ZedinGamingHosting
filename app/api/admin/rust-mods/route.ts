/**
 * API: Admin - Rust Mod Management
 * GET /api/admin/rust-mods - List all mods (for admin)
 * POST /api/admin/rust-mods - Create new mod
 * PATCH /api/admin/rust-mods/:id - Update mod
 * DELETE /api/admin/rust-mods/:id - Delete mod
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// Verify admin role
async function verifyAdmin() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return user;
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mods = await prisma.rustMod.findMany({
      orderBy: { createdAt: 'desc' },
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
        isActive: true,
        isFeatured: true,
        downloadUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ mods });
  } catch (error) {
    console.error('Error fetching mods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { displayName, name, description, author, version, category, price, downloadUrl, imageUrl } = body;

    if (!displayName || !downloadUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const mod = await prisma.rustMod.create({
      data: {
        name: name || displayName.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        description: description || '',
        author: author || 'Unknown',
        version: version || '1.0.0',
        category: category || 'Utility',
        price: parseFloat(price) || 0,
        currency: 'USD',
        downloadUrl,
        imageUrl: imageUrl || null,
        isActive: true,
        isFeatured: false,
      },
    });

    return NextResponse.json({ mod }, { status: 201 });
  } catch (error) {
    console.error('Error creating mod:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing mod ID' }, { status: 400 });
    }

    const mod = await prisma.rustMod.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ mod });
  } catch (error) {
    console.error('Error updating mod:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing mod ID' }, { status: 400 });
    }

    await prisma.rustMod.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mod:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
