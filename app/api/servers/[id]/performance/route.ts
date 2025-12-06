/**
 * ARK Enterprise Performance Optimization API
 * GET - Performance analysis, lag detection, recommendations
 * POST - Apply optimization profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  analyzeLag,
  detectMemoryLeak,
  autoTuneServerConfig,
  getOptimizationRecommendations,
} from '@/lib/ark-performance-optimizer';

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
    const action = searchParams.get('action') || 'analysis';

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check
    if (server.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    if (action === 'recommendations') {
      const recommendations = await getOptimizationRecommendations(serverId);
      return NextResponse.json({
        success: true,
        data: {
          recommendations,
          prioritized: recommendations.sort((a: any, b: any) => b.impact - a.impact),
        },
      });
    }

    if (action === 'memory-leak') {
      const leakAnalysis = await detectMemoryLeak(serverId);
      return NextResponse.json({
        success: true,
        data: leakAnalysis,
        warning: leakAnalysis.leakRate && leakAnalysis.leakRate > 50 ? 'Magas memória növekedési ráta!' : undefined,
      });
    }

    // Default: full analysis
    const lagAnalysis = await analyzeLag(serverId);
    const memoryLeak = await detectMemoryLeak(serverId);
    const recommendations = await getOptimizationRecommendations(serverId);

    return NextResponse.json({
      success: true,
      data: {
        lag: lagAnalysis,
        memory: memoryLeak,
        recommendations: recommendations.slice(0, 5),
        overallHealth: calculateHealthScore(lagAnalysis, memoryLeak),
      },
    });
  } catch (error: unknown) {
    logger.error('Performance GET error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt a performance analízis során' },
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
    const { profile = 'balanced' } = body;

    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) {
      return NextResponse.json({ error: 'Szerver nem található' }, { status: 404 });
    }

    // Permission check - only ADMIN
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Csak adminisztrátorok' }, { status: 403 });
    }

    // Validate profile
    const validProfiles = ['ultra_low_lag', 'balanced', 'maximum_players', 'graphics_quality'];
    if (!validProfiles.includes(profile)) {
      return NextResponse.json(
        { error: 'Érvénytelen profil' },
        { status: 400 }
      );
    }

    // Note: autoTuneServerConfig automatically selects the best profile
    // The profile parameter here is just for validation/logging
    const result = await autoTuneServerConfig(serverId);

    // Log to Discord if webhook configured
    const config = typeof server.configuration === 'object' ? (server.configuration as any) : {};
    const discordWebhook = config.discordWebhook;
    
    if (discordWebhook) {
      try {
        await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '⚙️ Performance profil alkalmazva',
              description: `Szerver: ${server.name}`,
              fields: [
                { name: 'Profil', value: String(result.appliedProfile), inline: true },
                { name: 'Státusz', value: 'Alkalmazva', inline: true },
                { name: 'Üzenet', value: result.message, inline: false },
              ],
              color: 3447003,
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      } catch (webhookError: unknown) {
        logger.warn('Discord webhook failed:', webhookError as Error);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Performance profil alkalmazva: ${result.appliedProfile}`,
    });
  } catch (error: unknown) {
    logger.error('Performance POST error:', error as Error);
    return NextResponse.json(
      { error: 'Hiba történt az optimalizálás során' },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(lagAnalysis: any, memoryLeak: any): number {
  let score = 100;

  // Deduct for lag causes
  if (lagAnalysis.rootCause) {
    const causes = Object.values(lagAnalysis.rootCause) as number[];
    const maxCause = Math.max(...causes);
    score -= maxCause * 0.5; // Max 50 point deduction
  }

  // Deduct for memory leak
  if (memoryLeak.leakRate && memoryLeak.leakRate > 100) {
    score -= 30;
  } else if (memoryLeak.leakRate && memoryLeak.leakRate > 50) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}
