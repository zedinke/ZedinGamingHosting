/**
 * ============================================================================
 * API Route: /api/admin/games/packages
 * ============================================================================
 * 
 * Szerzői csomagok lekérése az admin panelhez
 * Felsorolja az összes szerzőt, konfigurációkat és premium csomagokat
 */

import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/auth/session';
import { db } from '@/lib/db';

/**
 * GET /api/admin/games/packages
 * 
 * Szerzői csomagok lekérése
 * 
 * Query Parameters:
 * - category: 'all' | 'cod' | 'cs' | 'steam' | 'premium'
 * - limit: number (default: 100)
 * - offset: number (default: 0)
 */
export async function GET(request: Request) {
  try {
    // Session validation
    const session = await validateAdminSession(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let packages = [];
    let total = 0;

    if (category === 'all' || category === 'cod') {
      // Call of Duty packages
      const codPackages = await db.query(`
        SELECT 
          gp.*, 
          gsc.slotCount, 
          gsc.ramMB, 
          gsc.vCPU, 
          gsc.storageGB, 
          gsc.monthlyPrice as configPrice,
          'COD' as category
        FROM gamePackages gp
        LEFT JOIN gameServerConfigs gsc ON gp.id = gsc.packageId
        WHERE gp.gameType LIKE 'COD_%'
        ORDER BY gp.id
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      packages = [...packages, ...codPackages];
    }

    if (category === 'all' || category === 'cs') {
      // Counter-Strike packages
      const csPackages = await db.query(`
        SELECT 
          gp.*, 
          gsc.slotCount, 
          gsc.ramMB, 
          gsc.vCPU, 
          gsc.storageGB, 
          gsc.monthlyPrice as configPrice,
          'CS' as category
        FROM gamePackages gp
        LEFT JOIN gameServerConfigs gsc ON gp.id = gsc.packageId
        WHERE gp.gameType LIKE 'CS%' OR gp.gameType = 'CSGO'
        ORDER BY gp.id
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      packages = [...packages, ...csPackages];
    }

    if (category === 'all' || category === 'steam') {
      // Steam games packages
      const steamPackages = await db.query(`
        SELECT 
          gp.*, 
          gsc.slotCount, 
          gsc.ramMB, 
          gsc.vCPU, 
          gsc.storageGB, 
          gsc.monthlyPrice as configPrice,
          'STEAM' as category
        FROM gamePackages gp
        LEFT JOIN gameServerConfigs gsc ON gp.id = gsc.packageId
        WHERE gp.gameType NOT LIKE 'COD_%' 
          AND gp.gameType NOT LIKE 'CS%' 
          AND gp.gameType != 'CSGO'
        ORDER BY gp.id
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      packages = [...packages, ...steamPackages];
    }

    // Count total
    const countResult = await db.query(`
      SELECT COUNT(*) as total FROM gamePackages
    `);
    total = countResult[0]?.total || 0;

    // Premium bundles if requested
    let premiumBundles = [];
    if (category === 'all' || category === 'premium') {
      premiumBundles = await db.query(`
        SELECT 
          gpb.*,
          gp1.name as package1Name,
          gp2.name as package2Name,
          gp3.name as package3Name,
          gp1.slug as package1Slug,
          gp2.slug as package2Slug,
          gp3.slug as package3Slug
        FROM gamePremiumBundles gpb
        LEFT JOIN gamePackages gp1 ON gpb.package1Id = gp1.id
        LEFT JOIN gamePackages gp2 ON gpb.package2Id = gp2.id
        LEFT JOIN gamePackages gp3 ON gpb.package3Id = gp3.id
        ORDER BY gpb.id
      `);
    }

    return NextResponse.json({
      success: true,
      data: {
        packages,
        premiumBundles,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        summary: {
          totalPackages: total,
          totalPremiumBundles: premiumBundles.length,
          callOfDuty: packages.filter((p: any) => p.category === 'COD').length,
          counterStrike: packages.filter((p: any) => p.category === 'CS').length,
          steamGames: packages.filter((p: any) => p.category === 'STEAM').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching game packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game packages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/games/packages
 * 
 * Új szerzői csomag létrehozása
 */
export async function POST(request: Request) {
  try {
    // Session validation
    const session = await validateAdminSession(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      gameType,
      description,
      imageUrl,
      youtubeTrailerId,
      maxPlayers,
      basePrice,
      slotCount = 32,
      ramMB = 4096,
      vCPU = 4,
      storageGB = 50,
      monthlyPrice = 5.00,
    } = body;

    // Validation
    if (!name || !slug || !gameType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create game package
    const packageResult = await db.query(
      `INSERT INTO gamePackages 
       (name, slug, gameType, description, imageUrl, youtubeTrailerId, maxPlayers, basePrice)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, gameType, description, imageUrl, youtubeTrailerId, maxPlayers || 32, basePrice || 0]
    );

    const packageId = packageResult.insertId;

    // Create server config
    await db.query(
      `INSERT INTO gameServerConfigs 
       (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: packageId,
        name,
        slug,
        gameType,
      },
      message: 'Game package created successfully',
    });
  } catch (error) {
    console.error('Error creating game package:', error);
    return NextResponse.json(
      { error: 'Failed to create game package' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/games/packages/[id]
 * 
 * Szerzői csomag törlése
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Session validation
    const session = await validateAdminSession(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const packageId = params.id;

    // Check if package exists
    const pkg = await db.query(
      'SELECT * FROM gamePackages WHERE id = ?',
      [packageId]
    );

    if (pkg.length === 0) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Delete config first
    await db.query('DELETE FROM gameServerConfigs WHERE packageId = ?', [packageId]);

    // Delete package
    await db.query('DELETE FROM gamePackages WHERE id = ?', [packageId]);

    return NextResponse.json({
      success: true,
      message: 'Game package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting game package:', error);
    return NextResponse.json(
      { error: 'Failed to delete game package' },
      { status: 500 }
    );
  }
}
