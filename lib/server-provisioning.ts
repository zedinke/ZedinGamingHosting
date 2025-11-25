import { prisma } from '@/lib/prisma';
import { GameType, ServerStatus } from '@prisma/client';
import { executeTask } from './task-executor';

interface ProvisioningOptions {
  gameType: GameType;
  maxPlayers: number;
  planId: string;
}

interface MachineResources {
  machineId: string;
  availableCpu: number;
  availableRam: number;
  availableDisk: number;
  currentServers: number;
  load: number; // 0-100, alacsonyabb = jobb
}

/**
 * Megkeresi a legjobb gépet egy új szerver számára
 */
export async function findBestMachine(
  options: ProvisioningOptions
): Promise<{ machineId: string; agentId: string } | null> {
  // Összes online gépet és agenteket lekérdezzük
  const machines = await prisma.serverMachine.findMany({
    where: {
      status: 'ONLINE',
    },
    include: {
      agents: {
        where: {
          status: 'ONLINE',
        },
        include: {
          _count: {
            select: {
              servers: true,
            },
          },
        },
      },
      _count: {
        select: {
          servers: true,
        },
      },
    },
  });

  if (machines.length === 0) {
    return null;
  }

  // Erőforrás követelmények meghatározása a játék típusa alapján
  const requirements = getGameRequirements(options.gameType, options.maxPlayers);

  // Gépek rangsorolása terhelés alapján
  const machineScores: MachineResources[] = [];

  for (const machine of machines) {
    if (machine.agents.length === 0) continue;

    const resources = machine.resources as any;
    if (!resources) continue;

    // Elérhető erőforrások számítása
    const totalCpu = resources.cpu?.cores || 0;
    const totalRam = resources.ram?.total || 0;
    const totalDisk = resources.disk?.total || 0;

    const usedCpu = resources.cpu?.usage || 0;
    const usedRam = resources.ram?.used || 0;
    const usedDisk = resources.disk?.used || 0;

    const availableCpu = totalCpu * (1 - usedCpu / 100);
    const availableRam = totalRam - usedRam;
    const availableDisk = totalDisk - usedDisk;

    // Ellenőrizzük, hogy van-e elég erőforrás
    if (
      availableCpu < requirements.cpu ||
      availableRam < requirements.ram ||
      availableDisk < requirements.disk
    ) {
      continue;
    }

    // Terhelés számítása (alacsonyabb = jobb)
    const cpuLoad = (usedCpu / 100) * 100;
    const ramLoad = (usedRam / totalRam) * 100;
    const diskLoad = (usedDisk / totalDisk) * 100;
    const serverLoad = (machine._count.servers / 10) * 100; // Max 10 szerver/gép

    const totalLoad = (cpuLoad + ramLoad + diskLoad + serverLoad) / 4;

    // Válasszuk az agentet, ami a legkevesebb szervert kezeli
    const bestAgent = machine.agents.reduce((prev, curr) =>
      curr._count.servers < prev._count.servers ? curr : prev
    );

    machineScores.push({
      machineId: machine.id,
      availableCpu,
      availableRam,
      availableDisk,
      currentServers: machine._count.servers,
      load: totalLoad,
    });
  }

  if (machineScores.length === 0) {
    return null;
  }

  // Rendezés terhelés szerint (alacsonyabb = jobb)
  machineScores.sort((a, b) => a.load - b.load);

  const bestMachine = machineScores[0];
  const machine = machines.find((m) => m.id === bestMachine.machineId);
  if (!machine) return null;

  const bestAgent = machine.agents.reduce((prev, curr) =>
    curr._count.servers < prev._count.servers ? curr : prev
  );

  return {
    machineId: machine.id,
    agentId: bestAgent.id,
  };
}

/**
 * Játék típus alapján erőforrás követelmények
 */
function getGameRequirements(gameType: GameType, maxPlayers: number) {
  const baseRequirements: Record<GameType, { cpu: number; ram: number; disk: number }> = {
    MINECRAFT: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 }, // 2GB RAM, 5GB Disk
    ARK: { cpu: 2, ram: 8 * 1024 * 1024 * 1024, disk: 20 * 1024 * 1024 * 1024 }, // 8GB RAM, 20GB Disk
    CSGO: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 }, // 2GB RAM, 10GB Disk
    RUST: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 15 * 1024 * 1024 * 1024 }, // 4GB RAM, 15GB Disk
    VALHEIM: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 }, // 2GB RAM, 5GB Disk
    SEVEN_DAYS_TO_DIE: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 }, // 4GB RAM, 10GB Disk
    OTHER: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 }, // 2GB RAM, 5GB Disk
  };

  const base = baseRequirements[gameType] || baseRequirements.OTHER;

  // Játékosok száma alapján skálázás
  const playerMultiplier = Math.max(1, maxPlayers / 10);

  return {
    cpu: base.cpu * playerMultiplier,
    ram: base.ram * playerMultiplier,
    disk: base.disk * (1 + playerMultiplier * 0.5), // Disk kevésbé skálázódik
  };
}

/**
 * Szerver provisioning - új szerver telepítése
 */
export async function provisionServer(
  serverId: string,
  options: ProvisioningOptions
): Promise<{ success: boolean; machineId?: string; agentId?: string; error?: string }> {
  try {
    // Legjobb gép és agent keresése
    const bestLocation = await findBestMachine(options);

    if (!bestLocation) {
      return {
        success: false,
        error: 'Nincs elérhető gép vagy agent a szerver telepítéséhez',
      };
    }

    // Szerver frissítése
    const server = await prisma.server.update({
      where: { id: serverId },
      data: {
        machineId: bestLocation.machineId,
        agentId: bestLocation.agentId,
        status: 'STARTING',
      },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    // Provisioning task létrehozása
    const task = await prisma.task.create({
      data: {
        agentId: bestLocation.agentId,
        serverId: serverId,
        type: 'PROVISION',
        status: 'PENDING',
        command: {
          action: 'provision',
          gameType: options.gameType,
          maxPlayers: options.maxPlayers,
          planId: options.planId,
        },
      },
    });

    // Game szerver automatikus telepítése
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: options.planId },
    });

    const { installGameServer } = await import('./game-server-installer');
    const installResult = await installGameServer(serverId, options.gameType, {
      maxPlayers: options.maxPlayers,
      ram: plan?.ram || 2048,
      port: server.port || 25565,
      name: server.name,
    });

    if (!installResult.success) {
      console.error('Game server installation failed:', installResult.error);
      // Szerver státusz frissítése hibára
      await prisma.server.update({
        where: { id: serverId },
        data: { status: 'ERROR' },
      });
      return {
        success: false,
        error: installResult.error || 'Game szerver telepítési hiba',
      };
    }

    // Task végrehajtása háttérben
    executeTask(task.id).catch((error) => {
      console.error(`Provisioning task ${task.id} végrehajtási hiba:`, error);
    });

    // Értesítés küldése
    if (server.userId) {
      const { createNotification } = await import('./notifications');
      createNotification(
        server.userId,
        'SERVER_CREATED',
        'Szerver létrehozva',
        `A(z) ${server.name} szerver sikeresen létrejött és telepítve lett.`,
        'medium',
        { serverId, gameType: options.gameType }
      ).catch(console.error);
    }

    return {
      success: true,
      machineId: bestLocation.machineId,
      agentId: bestLocation.agentId,
    };
  } catch (error: any) {
    console.error('Server provisioning error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba a provisioning során',
    };
  }
}

/**
 * Port szám generálása egy szerverhez
 */
export async function generateServerPort(gameType: GameType): Promise<number> {
  // Alapértelmezett portok játék típusonként
  const defaultPorts: Record<GameType, number> = {
    MINECRAFT: 25565,
    ARK: 7777,
    CSGO: 27015,
    RUST: 28015,
    VALHEIM: 2456,
    SEVEN_DAYS_TO_DIE: 26900,
    OTHER: 25565,
  };

  const basePort = defaultPorts[gameType] || 25565;

  // Ellenőrizzük, hogy a port szabad-e
  const existingServer = await prisma.server.findFirst({
    where: {
      port: basePort,
      status: {
        not: 'OFFLINE',
      },
    },
  });

  if (!existingServer) {
    return basePort;
  }

  // Ha foglalt, keresünk egy szabad portot
  for (let offset = 1; offset < 100; offset++) {
    const port = basePort + offset;
    const exists = await prisma.server.findFirst({
      where: {
        port,
        status: {
          not: 'OFFLINE',
        },
      },
    });

    if (!exists) {
      return port;
    }
  }

  // Ha nincs szabad port, visszaadjuk az alapértelmezettet
  return basePort;
}

