/**
 * Performance Optimization Tools
 * Automatic config tuning, memory leak detection, lag analyzer
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface PerformanceProfile {
  serverId: string;
  profileName: 'ultra_low_lag' | 'balanced' | 'maximum_players' | 'graphics_quality';
  maxStructures: number;
  maxDinos: number;
  autoSaveInterval: number; // seconds
  mapHD: boolean;
  enableShadows: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  maxConcurrentPlayers: number;
}

export interface LagAnalysisResult {
  timestamp: number;
  avgLag: number;
  peakLag: number;
  lagCauses: Array<{ cause: string; impact: number; recommendation: string }>;
  overallHealth: number; // 0-100%
  criticalIssues: string[];
}

export interface MemoryProfile {
  timestamp: number;
  usedMemoryMB: number;
  allocatedMemoryMB: number;
  leakDetected: boolean;
  leakRate?: number; // MB/hour
  recommendation: 'none' | 'optimize' | 'restart' | 'urgent_restart';
}

/**
 * Lag analyzer - szerver késleltetés okaion
 */
export async function analyzeLag(serverId: string): Promise<LagAnalysisResult> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : ({} as any);
    const metricsHistory = ((config as any).metricsHistory || []) as any[];

    if (metricsHistory.length === 0) {
      return {
        timestamp: Date.now(),
        avgLag: 0,
        peakLag: 0,
        lagCauses: [],
        overallHealth: 100,
        criticalIssues: [],
      };
    }

    // Lag számítása
    const lags = metricsHistory.map((m: any) => m.lag || 0);
    const avgLag = lags.reduce((a: number, b: number) => a + b, 0) / lags.length;
    const peakLag = Math.max(...lags);

    // Lag okok azonosítása
    const lagCauses: Array<{ cause: string; impact: number; recommendation: string }> = [];

    const currentMetrics = metricsHistory[0];
    const playerCount = currentMetrics?.playerCount || 0;
    const structureCount = currentMetrics?.structures || 0;
    const dinoCount = currentMetrics?.dinos || 0;

    if (playerCount > 60) {
      lagCauses.push({
        cause: 'High player count',
        impact: Math.min((playerCount - 50) * 2, 40),
        recommendation: 'Consider splitting to another server or optimizing player slots',
      });
    }

    if (structureCount > 50000) {
      lagCauses.push({
        cause: 'Excessive structures',
        impact: 25,
        recommendation:
          'Encourage players to optimize their bases or implement structure limits',
      });
    }

    if (dinoCount > 10000) {
      lagCauses.push({
        cause: 'High dino population',
        impact: 20,
        recommendation: 'Implement automated dino population management',
      });
    }

    if (currentMetrics?.cpuUsage > 85) {
      lagCauses.push({
        cause: 'CPU bottleneck',
        impact: 30,
        recommendation: 'Upgrade server hardware or reduce player slots',
      });
    }

    if (currentMetrics?.ramUsage > 90) {
      lagCauses.push({
        cause: 'Memory pressure',
        impact: 35,
        recommendation: 'Restart server or reduce active objects',
      });
    }

    const totalImpact = lagCauses.reduce((sum, c) => sum + c.impact, 0);
    const overallHealth = Math.max(0, 100 - totalImpact);

    const criticalIssues = lagCauses
      .filter((c) => c.impact > 20)
      .map((c) => c.cause);

    logger.info('Lag analysis completed', {
      serverId,
      avgLag,
      peakLag,
      overallHealth,
      issuesCount: lagCauses.length,
    });

    return {
      timestamp: Date.now(),
      avgLag,
      peakLag,
      lagCauses,
      overallHealth,
      criticalIssues,
    };
  } catch (error) {
    logger.error('Error analyzing lag', error as Error, { serverId });
    throw error;
  }
}

/**
 * Memory leak detection
 */
export async function detectMemoryLeak(serverId: string): Promise<MemoryProfile> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    const config = typeof server?.configuration === 'object' ? server.configuration : ({} as any);
    const memoryHistory = ((config as any).memoryHistory || []) as any[];

    const currentMemory: MemoryProfile = {
      timestamp: Date.now(),
      usedMemoryMB: Math.floor(Math.random() * 8000) + 4000, // 4-12GB simuláció
      allocatedMemoryMB: 16384, // 16GB
      leakDetected: false,
      recommendation: 'none',
    };

    if (memoryHistory.length > 10) {
      // Trend analysis
      const oldMemory = memoryHistory[Math.max(0, memoryHistory.length - 10)];
      const memoryGrowth = currentMemory.usedMemoryMB - oldMemory.usedMemoryMB;
      const timespan = currentMemory.timestamp - oldMemory.timestamp; // milliseconds
      const leakRatePerHour = (memoryGrowth / (timespan / 3600000)) * 60; // MB/hour

      if (leakRatePerHour > 50) {
        currentMemory.leakDetected = true;
        currentMemory.leakRate = leakRatePerHour;
        currentMemory.recommendation =
          leakRatePerHour > 200 ? 'urgent_restart' : 'restart';
      }
    }

    // Memory pressure check
    const memoryUsagePercent = (currentMemory.usedMemoryMB / currentMemory.allocatedMemoryMB) * 100;
    if (memoryUsagePercent > 95 && !currentMemory.leakDetected) {
      currentMemory.recommendation = 'urgent_restart';
    } else if (memoryUsagePercent > 85) {
      currentMemory.recommendation = 'optimize';
    }

    logger.info('Memory leak detection completed', {
      serverId,
      usedMemoryMB: currentMemory.usedMemoryMB,
      leakDetected: currentMemory.leakDetected,
      recommendation: currentMemory.recommendation,
    });

    // Update database
    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          memoryHistory: [currentMemory, ...(memoryHistory || []).slice(0, 99)],
          lastMemoryCheck: currentMemory,
        } as any,
      },
    });

    return currentMemory;
  } catch (error) {
    logger.error('Error detecting memory leak', error as Error, { serverId });
    throw error;
  }
}

/**
 * Automatic config tuning
 */
export async function autoTuneServerConfig(
  serverId: string
): Promise<{ success: boolean; appliedProfile: PerformanceProfile; message: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });

    if (!server) {
      return {
        success: false,
        appliedProfile: {} as PerformanceProfile,
        message: 'Server not found',
      };
    }

    const config = typeof server.configuration === 'object' ? server.configuration : ({} as any);
    const metricsHistory = ((config as any).metricsHistory || []) as any[];
    const currentMetrics = metricsHistory[0];

    let selectedProfile: PerformanceProfile['profileName'] = 'balanced';

    // Profile selection logic
    if (currentMetrics?.lag > 500) {
      selectedProfile = 'ultra_low_lag';
    } else if (currentMetrics?.playerCount > 50) {
      selectedProfile = 'maximum_players';
    } else if (currentMetrics?.cpuUsage > 80 || currentMetrics?.ramUsage > 85) {
      selectedProfile = 'ultra_low_lag';
    }

    const profiles: Record<PerformanceProfile['profileName'], Omit<PerformanceProfile, 'serverId' | 'profileName'>> =
      {
        ultra_low_lag: {
          maxStructures: 20000,
          maxDinos: 5000,
          autoSaveInterval: 30,
          mapHD: false,
          enableShadows: false,
          graphicsQuality: 'low',
          maxConcurrentPlayers: 40,
        },
        balanced: {
          maxStructures: 30000,
          maxDinos: 7000,
          autoSaveInterval: 60,
          mapHD: true,
          enableShadows: true,
          graphicsQuality: 'medium',
          maxConcurrentPlayers: 60,
        },
        maximum_players: {
          maxStructures: 35000,
          maxDinos: 8000,
          autoSaveInterval: 120,
          mapHD: true,
          enableShadows: false,
          graphicsQuality: 'medium',
          maxConcurrentPlayers: 80,
        },
        graphics_quality: {
          maxStructures: 25000,
          maxDinos: 6000,
          autoSaveInterval: 90,
          mapHD: true,
          enableShadows: true,
          graphicsQuality: 'high',
          maxConcurrentPlayers: 50,
        },
      };

    const profileConfig = profiles[selectedProfile];
    const appliedProfile: PerformanceProfile = {
      serverId,
      profileName: selectedProfile,
      ...profileConfig,
    };

    // Apply to server
    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: {
          ...config,
          performanceProfile: appliedProfile,
        } as any,
      },
    });

    logger.info('Server config auto-tuned', {
      serverId,
      appliedProfile: selectedProfile,
      reason: `Lag: ${currentMetrics?.lag}ms, Players: ${currentMetrics?.playerCount}`,
    });

    return {
      success: true,
      appliedProfile,
      message: `Applied ${selectedProfile} profile for optimal performance`,
    };
  } catch (error) {
    logger.error('Error tuning server config', error as Error, { serverId });
    return {
      success: false,
      appliedProfile: {} as PerformanceProfile,
      message: (error as Error).message,
    };
  }
}

/**
 * Optimization recommendations
 */
export async function getOptimizationRecommendations(
  serverId: string
): Promise<Array<{ priority: 'low' | 'medium' | 'high'; action: string; impact: string }>> {
  try {
    const lagAnalysis = await analyzeLag(serverId);
    const memoryCheck = await detectMemoryLeak(serverId);

    const recommendations: Array<{ priority: 'low' | 'medium' | 'high'; action: string; impact: string }> = [];

    // Memory recommendations
    if (memoryCheck.leakDetected) {
      recommendations.push({
        priority: memoryCheck.recommendation === 'urgent_restart' ? 'high' : 'medium',
        action: `Server restart required (Memory leak detected: +${memoryCheck.leakRate?.toFixed(2)}MB/hour)`,
        impact: 'Prevent server crash',
      });
    }

    if (memoryCheck.recommendation === 'optimize') {
      recommendations.push({
        priority: 'medium',
        action: 'Enable periodic server cleanup',
        impact: 'Reduce memory usage by 10-15%',
      });
    }

    // Lag recommendations
    for (const lagCause of lagAnalysis.lagCauses) {
      if (lagCause.impact > 15) {
        recommendations.push({
          priority: lagCause.impact > 25 ? 'high' : 'medium',
          action: lagCause.recommendation,
          impact: `Reduce lag by ~${lagCause.impact}ms`,
        });
      }
    }

    // Auto-save optimization
    recommendations.push({
      priority: 'low',
      action: 'Increase auto-save interval from 15s to 60s',
      impact: 'Reduce disk I/O by 75%',
    });

    logger.info('Optimization recommendations generated', {
      serverId,
      recommendationCount: recommendations.length,
    });

    return recommendations;
  } catch (error) {
    logger.error('Error getting recommendations', error as Error, { serverId });
    return [];
  }
}
