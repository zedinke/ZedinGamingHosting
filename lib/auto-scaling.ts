import { prisma } from '@/lib/prisma';

/**
 * Automatikus skálázás konfiguráció
 */
interface ScalingConfig {
  minCpu: number; // Minimum CPU használat % (ha alatta, leállítjuk)
  maxCpu: number; // Maximum CPU használat % (ha felette, skálázunk)
  minRam: number; // Minimum RAM használat % (ha alatta, leállítjuk)
  maxRam: number; // Maximum RAM használat % (ha felette, skálázunk)
  scaleUpThreshold: number; // Skálázás felfelé küszöb
  scaleDownThreshold: number; // Skálázás lefelé küszöb
  checkInterval: number; // Ellenőrzési intervallum (másodperc)
}

const DEFAULT_SCALING_CONFIG: ScalingConfig = {
  minCpu: 10,
  maxCpu: 80,
  minRam: 10,
  maxRam: 80,
  scaleUpThreshold: 70,
  scaleDownThreshold: 30,
  checkInterval: 300, // 5 perc
};

/**
 * Szerver erőforrás ellenőrzése és skálázás
 */
export async function checkAndScaleServer(serverId: string): Promise<{
  action: 'scale_up' | 'scale_down' | 'none';
  reason: string;
}> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server || !server.agent || !server.resourceUsage) {
      return {
        action: 'none',
        reason: 'Szerver vagy erőforrás adatok nem elérhetők',
      };
    }

    const resourceUsage = server.resourceUsage as any;
    const config = await getScalingConfig(serverId);
    
    const cpu = resourceUsage.cpu || 0;
    const ram = resourceUsage.ram || 0;

    // Skálázás felfelé
    if (cpu > config.scaleUpThreshold || ram > config.scaleUpThreshold) {
      return {
        action: 'scale_up',
        reason: `CPU: ${cpu}%, RAM: ${ram}% - Túllépte a ${config.scaleUpThreshold}% küszöböt`,
      };
    }

    // Skálázás lefelé
    if (cpu < config.scaleDownThreshold && ram < config.scaleDownThreshold) {
      return {
        action: 'scale_down',
        reason: `CPU: ${cpu}%, RAM: ${ram}% - Alatta van a ${config.scaleDownThreshold}% küszöbnek`,
      };
    }

    // Leállítás, ha túl alacsony a használat
    if (cpu < config.minCpu && ram < config.minRam && server.status === 'ONLINE') {
      // TODO: Szerver leállítása
      return {
        action: 'scale_down',
        reason: `CPU: ${cpu}%, RAM: ${ram}% - Túl alacsony használat, leállítás ajánlott`,
      };
    }

    return {
      action: 'none',
      reason: 'Erőforrás használat normális tartományban',
    };
  } catch (error) {
    console.error('Auto scaling check error:', error);
    return {
      action: 'none',
      reason: 'Hiba történt az ellenőrzés során',
    };
  }
}

/**
 * Skálázási konfiguráció lekérdezése
 */
async function getScalingConfig(serverId: string): Promise<ScalingConfig> {
  const setting = await prisma.setting.findUnique({
    where: { key: `scaling_config_${serverId}` },
  });

  if (setting) {
    return JSON.parse(setting.value) as ScalingConfig;
  }

  return DEFAULT_SCALING_CONFIG;
}

/**
 * Erőforrás limitok frissítése (skálázás)
 */
export async function scaleServerResources(
  serverId: string,
  action: 'scale_up' | 'scale_down'
): Promise<{ success: boolean; error?: string }> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: true,
      },
    });

    if (!server) {
      return {
        success: false,
        error: 'Szerver nem található',
      };
    }

    const resourceLimits = (server.configuration as any)?.resourceLimits || {};
    const currentRam = resourceLimits.ram || 2048; // MB
    const currentCpu = resourceLimits.cpu || 1; // Cores

    let newRam: number;
    let newCpu: number;

    if (action === 'scale_up') {
      newRam = Math.min(currentRam * 1.5, 16384); // Max 16GB
      newCpu = Math.min(currentCpu + 1, 8); // Max 8 cores
    } else {
      newRam = Math.max(currentRam * 0.75, 1024); // Min 1GB
      newCpu = Math.max(currentCpu - 1, 1); // Min 1 core
    }

    // Konfiguráció frissítése
    const config = (server.configuration as any) || {};
    config.resourceLimits = {
      ...resourceLimits,
      ram: Math.round(newRam),
      cpu: Math.round(newCpu),
    };

    await prisma.server.update({
      where: { id: serverId },
      data: {
        configuration: config,
      },
    });

    // Task létrehozása az erőforrás limitok alkalmazásához
    if (server.agentId) {
      await prisma.task.create({
        data: {
          agentId: server.agentId,
          serverId: server.id,
          type: 'UPDATE',
          status: 'PENDING',
          command: {
            action: 'update_resource_limits',
            ram: Math.round(newRam),
            cpu: Math.round(newCpu),
          },
        },
      });
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Scale resources error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a skálázás során',
    };
  }
}

/**
 * Összes szerver automatikus skálázási ellenőrzése
 */
export async function checkAllServersScaling(): Promise<void> {
  try {
    const servers = await prisma.server.findMany({
      where: {
        status: 'ONLINE',
        agent: {
          isNot: null,
        },
      },
      include: {
        agent: true,
      },
    });

    for (const server of servers) {
      const result = await checkAndScaleServer(server.id);
      
      if (result.action !== 'none') {
        console.log(`Server ${server.id}: ${result.action} - ${result.reason}`);
        
        if (result.action === 'scale_up' || result.action === 'scale_down') {
          await scaleServerResources(server.id, result.action);
        }
      }
    }
  } catch (error) {
    console.error('Check all servers scaling error:', error);
  }
}

