import { prisma } from '@/lib/prisma';
import { GameType, ServerStatus } from '@prisma/client';
import { executeTask } from './task-executor';

interface ProvisioningOptions {
  gameType: GameType;
  maxPlayers: number;
  planId?: string;
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
  const arkRequirements = { cpu: 2, ram: 8 * 1024 * 1024 * 1024, disk: 20 * 1024 * 1024 * 1024 }; // 8GB RAM, 20GB Disk
  
  const baseRequirements: Partial<Record<GameType, { cpu: number; ram: number; disk: number }>> = {
    MINECRAFT: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 }, // 2GB RAM, 5GB Disk
    ARK_EVOLVED: arkRequirements,
    ARK_ASCENDED: arkRequirements,
    RUST: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 15 * 1024 * 1024 * 1024 }, // 4GB RAM, 15GB Disk
    VALHEIM: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 }, // 2GB RAM, 5GB Disk
    SEVEN_DAYS_TO_DIE: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 }, // 4GB RAM, 10GB Disk
    CONAN_EXILES: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 15 * 1024 * 1024 * 1024 },
    DAYZ: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 15 * 1024 * 1024 * 1024 },
    PROJECT_ZOMBOID: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 },
    PALWORLD: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 },
    ENSHROUDED: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 },
    SONS_OF_THE_FOREST: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 },
    THE_FOREST: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 },
    GROUNDED: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 },
    V_RISING: { cpu: 2, ram: 4 * 1024 * 1024 * 1024, disk: 10 * 1024 * 1024 * 1024 },
    DONT_STARVE_TOGETHER: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 },
    OTHER: { cpu: 1, ram: 2 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 }, // 2GB RAM, 5GB Disk
  };

  const base = baseRequirements[gameType] || baseRequirements.OTHER;

  if (!base) {
    // Fallback ha nincs konfiguráció
    return {
      cpu: 1,
      ram: 2 * 1024 * 1024 * 1024,
      disk: 5 * 1024 * 1024 * 1024,
    };
  }

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

    // Port generálása (ellenőrzi a Docker konténereket és egyéb folyamatokat is)
    const generatedPort = await generateServerPort(options.gameType, bestLocation.machineId);
    
    // Ha a szervernek még nincs portja, beállítjuk
    if (!server.port) {
      await prisma.server.update({
        where: { id: serverId },
        data: { port: generatedPort },
      });
    }

    // Game szerver automatikus telepítése
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: options.planId },
    });

    const { installGameServer } = await import('./game-server-installer');
    const installResult = await installGameServer(serverId, options.gameType, {
      maxPlayers: options.maxPlayers,
      ram: (plan?.features as any)?.ram || 2048,
      port: server.port || generatedPort,
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
 * Ellenőrzi az adatbázisban tárolt szervereket ÉS a ténylegesen foglalt portokat a gépen
 */
export async function generateServerPort(
  gameType: GameType,
  machineId?: string
): Promise<number> {
  // Alapértelmezett portok játék típusonként
  const defaultPorts: Partial<Record<GameType, number>> = {
    MINECRAFT: 25565,
    ARK_EVOLVED: 7777,
    ARK_ASCENDED: 7777,
    RUST: 28015,
    VALHEIM: 2456,
    SEVEN_DAYS_TO_DIE: 26900,
    CONAN_EXILES: 7777,
    DAYZ: 2302,
    PROJECT_ZOMBOID: 16261,
    PALWORLD: 8211,
    ENSHROUDED: 15636,
    SONS_OF_THE_FOREST: 8766,
    THE_FOREST: 8766,
    GROUNDED: 7777,
    V_RISING: 9876,
    DONT_STARVE_TOGETHER: 10999,
    OTHER: 25565,
  };

  const basePort = defaultPorts[gameType] || 25565;

  // Ellenőrizzük, hogy a port szabad-e az adatbázisban
  const existingServer = await prisma.server.findFirst({
    where: {
      port: basePort,
      status: {
        not: 'OFFLINE',
      },
    },
  });

  // Ha nincs az adatbázisban és van machineId, ellenőrizzük a ténylegesen foglalt portokat is
  if (!existingServer && machineId) {
    const isPortAvailable = await checkPortAvailableOnMachine(machineId, basePort);
    if (isPortAvailable) {
      return basePort;
    }
  } else if (!existingServer) {
    return basePort;
  }

  // Ha foglalt, keresünk egy szabad portot
  for (let offset = 1; offset < 100; offset++) {
    const port = basePort + offset;
    
    // Adatbázis ellenőrzés
    const exists = await prisma.server.findFirst({
      where: {
        port,
        status: {
          not: 'OFFLINE',
        },
      },
    });

    if (!exists) {
      // Ha van machineId, ellenőrizzük a ténylegesen foglalt portokat is
      if (machineId) {
        const isPortAvailable = await checkPortAvailableOnMachine(machineId, port);
        if (isPortAvailable) {
          return port;
        }
      } else {
        return port;
      }
    }
  }

  // Ha nincs szabad port, visszaadjuk az alapértelmezettet
  return basePort;
}

/**
 * Ellenőrzi, hogy a port elérhető-e a gépen (Docker konténerek és egyéb folyamatok figyelembevételével)
 */
async function checkPortAvailableOnMachine(machineId: string, port: number): Promise<boolean> {
  try {
    const machine = await prisma.serverMachine.findUnique({
      where: { id: machineId },
      include: {
        agents: {
          where: { status: 'ONLINE' },
          take: 1,
        },
      },
    });

    if (!machine || machine.agents.length === 0) {
      // Ha nincs agent, nem tudjuk ellenőrizni, de feltételezzük hogy szabad
      return true;
    }

    const { executeSSHCommand } = await import('./ssh-client');

    // Ellenőrizzük a portot SSH-n keresztül
    // Használjuk a `ss` vagy `netstat` parancsot (ss előnyben, mert gyorsabb)
    const checkCommand = `ss -tuln | grep -q ":${port} " || netstat -tuln 2>/dev/null | grep -q ":${port} " || echo "available"`;

    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      checkCommand
    );

    // Ha a parancs "available"-t ad vissza, akkor a port szabad
    // Ha nem, akkor foglalt (vagy hiba történt, ebben az esetben biztonságosabb feltételezni hogy foglalt)
    return result.stdout?.trim().includes('available') || result.exitCode !== 0;
  } catch (error) {
    // Hiba esetén biztonságosabb feltételezni, hogy a port foglalt
    console.error(`Port ellenőrzési hiba a ${machineId} gépen a ${port} porthoz:`, error);
    return false;
  }
}

