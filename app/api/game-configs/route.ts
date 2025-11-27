import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/error-handler';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';

// GET - Publikus játék konfigurációk lekérése (csak aktívak és láthatók)
export const GET = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      const gameConfigs = await prisma.gameConfig.findMany({
        where: {
          isActive: true,
          isVisible: true,
        },
        include: {
          pricingConfig: true,
        },
        orderBy: [
          { order: 'asc' },
          { displayName: 'asc' },
        ],
      });

      return NextResponse.json({
        success: true,
        gameConfigs,
      });
    } catch (error) {
      console.error('Get game configs error:', error);
      return handleApiError(error);
    }
  },
  '/api/game-configs',
  'GET'
);

