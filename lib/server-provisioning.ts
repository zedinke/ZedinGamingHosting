import { prisma } from '@/lib/prisma';
import { GameType, ServerStatus } from '@prisma/client';
import { executeTask } from './task-executor';
import { logger } from '@/lib/logger';

interface ProvisioningOptions {
  gameType: GameType;
  maxPlayers: number;
  planId?: string;
  gamePackageId?: string;
  premiumPackageId?: string;
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
  // Először próbáljuk ONLINE gépeket
  let machines = await prisma.serverMachine.findMany({
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

  // Ha nincs ONLINE gép, de van ONLINE agent, akkor keressünk gépeket ONLINE agentekkel
  if (machines.length === 0 || machines.every(m => m.agents.length === 0)) {
    console.log('No ONLINE machines found or no ONLINE agents on ONLINE machines, searching for machines with ONLINE agents...');
    
    // Keresünk gépeket, amelyeken van ONLINE agent (függetlenül a gép státuszától)
    const machinesWithAgents = await prisma.serverMachine.findMany({
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

    // Szűrjük azokat, amelyeken van ONLINE agent
    const validMachines = machinesWithAgents.filter(m => m.agents.length > 0);
    
    if (validMachines.length > 0) {
      console.log(`Found ${validMachines.length} machine(s) with ONLINE agents, updating their status to ONLINE`);
      
      // Frissítsük a gépek státuszát ONLINE-ra, ha van rajtuk ONLINE agent
      for (const machine of validMachines) {
        if (machine.status !== 'ONLINE') {
          await prisma.serverMachine.update({
            where: { id: machine.id },
            data: { status: 'ONLINE' },
          });
          console.log(`Updated machine ${machine.name} (${machine.id}) status to ONLINE`);
        }
      }
      
      machines = validMachines;
    }
  }

  if (machines.length === 0) {
    console.error('No machines with ONLINE agents found');
    return null;
  }

  const machinesWithAgents = machines.filter(m => m.agents.length > 0);
  if (machinesWithAgents.length === 0) {
    console.error('No machines with ONLINE agents found after filtering');
    return null;
  }

  // Erőforrás követelmények meghatározása a játék típusa alapján
  const requirements = getGameRequirements(options.gameType, options.maxPlayers);

  // Gépek rangsorolása terhelés alapján
  const machineScores: MachineResources[] = [];

  console.log(`Evaluating ${machinesWithAgents.length} machine(s) with ONLINE agents for provisioning`);

  for (const machine of machinesWithAgents) {

    const resources = machine.resources as any;
    
    // Ha nincs resources információ, használjunk alapértelmezett értékeket
    // Ez lehetővé teszi, hogy a gépek használhatóak legyenek, még ha nincs is beállítva az erőforrás
    let totalCpu = 0;
    let totalRam = 0;
    let totalDisk = 0;
    let usedCpu = 0;
    let usedRam = 0;
    let usedDisk = 0;

    if (resources) {
      totalCpu = resources.cpu?.cores || 0;
      totalRam = resources.ram?.total || 0;
      totalDisk = resources.disk?.total || 0;
      usedCpu = resources.cpu?.usage || 0;
      usedRam = resources.ram?.used || 0;
      usedDisk = resources.disk?.used || 0;
    } else {
      // Alapértelmezett értékek ha nincs resources információ
      // Elegendő nagy értékek, hogy minden szerver elférjen
      console.warn(`Machine ${machine.name} (${machine.id}) has no resources information, using default values`);
      totalCpu = 16; // 16 CPU mag
      totalRam = 64 * 1024 * 1024 * 1024; // 64 GB RAM
      totalDisk = 500 * 1024 * 1024 * 1024; // 500 GB Disk
      usedCpu = 0;
      usedRam = 0;
      usedDisk = 0;
    }

    const availableCpu = totalCpu * (1 - usedCpu / 100);
    const availableRam = totalRam - usedRam;
    const availableDisk = totalDisk - usedDisk;

    // Ellenőrizzük, hogy van-e elég erőforrás
    if (
      availableCpu < requirements.cpu ||
      availableRam < requirements.ram ||
      availableDisk < requirements.disk
    ) {
      console.log(`Machine ${machine.name} (${machine.id}) does not have enough resources. Required: CPU=${requirements.cpu}, RAM=${Math.round(requirements.ram / 1024 / 1024 / 1024)}GB, Disk=${Math.round(requirements.disk / 1024 / 1024 / 1024)}GB. Available: CPU=${availableCpu.toFixed(2)}, RAM=${Math.round(availableRam / 1024 / 1024 / 1024)}GB, Disk=${Math.round(availableDisk / 1024 / 1024 / 1024)}GB`);
      continue;
    }

    console.log(`Machine ${machine.name} (${machine.id}) has sufficient resources. Available: CPU=${availableCpu.toFixed(2)}, RAM=${Math.round(availableRam / 1024 / 1024 / 1024)}GB, Disk=${Math.round(availableDisk / 1024 / 1024 / 1024)}GB`);

    // Terhelés számítása (alacsonyabb = jobb)
    const cpuLoadPercent = totalCpu > 0 ? usedCpu : 0;
    const ramLoadPercent = totalRam > 0 ? (usedRam / totalRam) * 100 : 0;
    const diskLoadPercent = totalDisk > 0 ? (usedDisk / totalDisk) * 100 : 0;
    
    // Ha bármelyik erőforrás elérte a 100%-ot, ne használjuk ezt a gépet
    if (cpuLoadPercent >= 100 || ramLoadPercent >= 100 || diskLoadPercent >= 100) {
      console.log(`Machine ${machine.name} (${machine.id}) has reached 100% capacity. CPU: ${cpuLoadPercent.toFixed(1)}%, RAM: ${ramLoadPercent.toFixed(1)}%, Disk: ${diskLoadPercent.toFixed(1)}%`);
      continue;
    }
    
    // Számítsuk ki a teljes terhelést (átlag)
    const serverLoad = (machine._count.servers / 10) * 100; // Max 10 szerver/gép
    const totalLoad = totalCpu > 0 || totalRam > 0 || totalDisk > 0 
      ? (cpuLoadPercent + ramLoadPercent + diskLoadPercent + serverLoad) / 4 
      : serverLoad; // Ha nincs resources info, csak a szerver számot vesszük figyelembe

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
    console.error(`No machines found with sufficient resources for game type ${options.gameType} with ${options.maxPlayers} max players`);
    return null;
  }

  console.log(`Found ${machineScores.length} suitable machine(s)`);

  // Rendezés terhelés szerint (alacsonyabb = jobb)
  machineScores.sort((a, b) => a.load - b.load);

  const bestMachine = machineScores[0];
  const machine = machines.find((m) => m.id === bestMachine.machineId);
  if (!machine) return null;

  const bestAgent = machine.agents.reduce((prev, curr) =>
    curr._count.servers < prev._count.servers ? curr : prev
  );

  console.log(`Selected machine: ${machine.name} (${machine.id}), agent: ${bestAgent.agentId || bestAgent.id}`);

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
    VALHEIM: { cpu: 1, ram: 4 * 1024 * 1024 * 1024, disk: 5 * 1024 * 1024 * 1024 }, // 4GB RAM, 5GB Disk (növelve OOM elkerülésére)
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
    SATISFACTORY: { cpu: 2, ram: 6 * 1024 * 1024 * 1024, disk: 15 * 1024 * 1024 * 1024 }, // 6GB RAM, 15GB Disk
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
          gamePackageId: options.gamePackageId,
          premiumPackageId: options.premiumPackageId,
        },
      },
    });

    // Port generálása (ellenőrzi a Docker konténereket és egyéb folyamatokat is)
    // MINDIG generálunk új portot, hogy a ténylegesen kiosztott portot használjuk
    let generatedPort = await generateServerPort(options.gameType, bestLocation.machineId);
    
    // 7 Days to Die port változók (a blokkon kívül, hogy később is elérhetők legyenek)
    let queryPort7dtd: number | undefined;
    let telnetPort7dtd: number | undefined;
    let webMapPort7dtd: number | undefined;
    
    // Satisfactory-nál a QueryPort, GamePort és BeaconPort generálása
    let configurationUpdate: any = {};
    if (options.gameType === 'SATISFACTORY') {
      // Satisfactory port számítások az új logika szerint:
      // GamePort = alap port (automatikusan keresni üres portot, alapértelmezett 7777)
      // QueryPort = GamePort + 2
      // BeaconPort = QueryPort + 2 = GamePort + 4
      
      // GamePort generálása (alap port, automatikusan keresni üres portot)
      let gamePort = generatedPort; // GamePort = alap port (pl. 7777)
      // QueryPort = GamePort + 2
      let queryPort = gamePort + 2;
      // BeaconPort = QueryPort + 2 = GamePort + 4
      let beaconPort = queryPort + 2;
      
      // Biztosítjuk, hogy a 3 port különböző legyen
      // Az új logika szerint:
      // - GamePort = alap port (pl. 7777)
      // - QueryPort = GamePort + 2 (pl. 7779)
      // - BeaconPort = QueryPort + 2 = GamePort + 4 (pl. 7781)
      // Mivel mindig különbözőek lesznek (+2, +4 offset), nincs szükség ütközés ellenőrzésre
      
      // Ellenőrizzük, hogy a GamePort és BeaconPort is szabad-e
      // Ha foglaltak, újra generáljuk a QueryPort-ot, amíg mindhárom port szabad nem lesz
      let maxRetries = 10;
      let retryCount = 0;
      let allPortsAvailable = false;
      
      while (!allPortsAvailable && retryCount < maxRetries) {
        // Ellenőrizzük, hogy a portok szabadok-e az adatbázisban ÉS a gépen
        const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, options.gameType, serverId);
        const beaconPortAvailableInDb = await checkMultiPortInDatabase(beaconPort, options.gameType, serverId);
        const gamePortAvailableInDb = await checkMultiPortInDatabase(gamePort, options.gameType, serverId);
        
        const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, queryPort);
        const gamePortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, gamePort);
        const beaconPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, beaconPort);
        
        // Mindhárom portnak szabadnak kell lennie az adatbázisban ÉS a gépen
        if (queryPortAvailableInDb && beaconPortAvailableInDb && gamePortAvailableInDb &&
            queryPortAvailableOnMachine && gamePortAvailableOnMachine && beaconPortAvailableOnMachine) {
          allPortsAvailable = true;
        } else {
          // Ha a GamePort vagy BeaconPort foglalt, újra generáljuk a QueryPort-ot
          retryCount++;
          // Új GamePort generálása a generateServerPort függvénnyel, ami már ellenőrzi az adatbázist és a gépen is
          // Az offset-tel való növelés helyett újra generáljuk, hogy biztosan szabad portot kapjunk
          const newGamePort = await generateServerPort(options.gameType, bestLocation.machineId);
          
          // GamePort alapján számoljuk a QueryPort és BeaconPort értékeket az új logika szerint
          gamePort = newGamePort;
          queryPort = gamePort + 2; // QueryPort = GamePort + 2
          beaconPort = queryPort + 2; // BeaconPort = QueryPort + 2
          
          logger.warn('Port is not available, regenerating QueryPort', {
            serverId,
            retryCount,
            newQueryPort: queryPort,
            newGamePort: gamePort,
            newBeaconPort: beaconPort,
            queryPortAvailableInDb,
            beaconPortAvailableInDb,
            gamePortAvailableInDb,
            queryPortAvailableOnMachine,
            gamePortAvailableOnMachine,
            beaconPortAvailableOnMachine,
          });
        }
      }
      
      if (!allPortsAvailable) {
        logger.error('Could not find available ports for Satisfactory server after retries', new Error('Port allocation failed after retries'), {
          serverId,
          finalQueryPort: queryPort,
          finalGamePort: gamePort,
          finalBeaconPort: beaconPort,
        });
        // Folytatjuk, de logoljuk a hibát
      }
      
      // Az adatbázisban a port mezőbe a GamePort-ot mentjük (alap port)
      // A GamePort az alap port, amit a játékosok használnak
      generatedPort = gamePort; // GamePort = alap port (pl. 7777 vagy 7780)
      
      // BeaconPort és GamePort mentése a configuration JSON-ben
      // Az adatbázisban:
      // - port mező = GamePort (alap port, pl. 7777)
      // - queryPort mező = QueryPort (GamePort + 2, pl. 7779)
      // - beaconPort mező = BeaconPort (QueryPort + 2, pl. 7781)
      configurationUpdate = {
        queryPort: queryPort, // QueryPort (GamePort + 2)
        gamePort: gamePort, // GamePort (alap port)
        beaconPort: beaconPort, // BeaconPort (QueryPort + 2)
      };
      
      logger.info('Satisfactory ports generated', {
        serverId,
        queryPort, // QueryPort (GamePort + 2)
        gamePort, // GamePort (alap port)
        beaconPort, // BeaconPort (QueryPort + 2)
        machineId: bestLocation.machineId,
        retries: retryCount,
      });
    } else if (options.gameType === 'VALHEIM') {
      // Valheim port számítások:
      // Port = alap port (automatikusan keresni üres portot)
      // QueryPort = Port + 1
      // Összesen: 2 port (2456, 2457)
      
      // Alap port generálása
      let gamePort = generatedPort; // Port = alap port
      // QueryPort = Port + 1
      let queryPort = gamePort + 1;
      
      // Ellenőrizzük, hogy mindkét port szabad-e
      // Ha foglaltak, újra generáljuk a portot, amíg mindkét port szabad nem lesz
      let maxRetries = 10;
      let retryCount = 0;
      let allPortsAvailable = false;
      
      while (!allPortsAvailable && retryCount < maxRetries) {
        // Ellenőrizzük, hogy a portok szabadok-e az adatbázisban ÉS a gépen
        const gamePortAvailableInDb = await checkMultiPortInDatabase(gamePort, options.gameType, serverId);
        const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, options.gameType, serverId);
        
        const gamePortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, gamePort);
        const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, queryPort);
        
        // Mindkét portnak szabadnak kell lennie az adatbázisban ÉS a gépen
        if (gamePortAvailableInDb && queryPortAvailableInDb &&
            gamePortAvailableOnMachine && queryPortAvailableOnMachine) {
          allPortsAvailable = true;
        } else {
          // Ha valamelyik port foglalt, újra generáljuk a portot
          retryCount++;
          // Új port generálása a generateServerPort függvénnyel, ami már ellenőrzi az adatbázist és a gépen is
          const newPort = await generateServerPort(options.gameType, bestLocation.machineId);
          
          // Port alapján számoljuk a QueryPort értékét
          gamePort = newPort;
          queryPort = gamePort + 1; // QueryPort = Port + 1
          
          logger.warn('Port is not available, regenerating port', {
            serverId,
            retryCount,
            newPort: gamePort,
            newQueryPort: queryPort,
            gamePortAvailableInDb,
            queryPortAvailableInDb,
            gamePortAvailableOnMachine,
            queryPortAvailableOnMachine,
          });
        }
      }
      
      if (!allPortsAvailable) {
        logger.error(`Could not find available ports for ${options.gameType} server after retries`, new Error('Port allocation failed after retries'), {
          serverId,
          finalPort: gamePort,
          finalQueryPort: queryPort,
        });
        // Folytatjuk, de logoljuk a hibát
      }
      
      // Az adatbázisban a port mezőbe a Port-ot mentjük (alap port)
      generatedPort = gamePort; // Port = alap port
      
      // QueryPort mentése a configuration JSON-ben és az adatbázisban
      configurationUpdate = {
        queryPort: queryPort, // QueryPort (Port + 1)
      };
      
      logger.info(`${options.gameType} ports generated`, {
        serverId,
        port: gamePort, // Port (alap port)
        queryPort, // QueryPort (Port + 1)
        machineId: bestLocation.machineId,
        retries: retryCount,
      });
    } else if (options.gameType === 'THE_FOREST') {
      // The Forest port számítások:
      // Port = alap port (automatikusan keresni üres portot)
      // QueryPort = Port + 1
      // SteamPeerPort = QueryPort + 1
      // Összesen: 3 port (pl. 27015, 27016, 27017)
      
      // Alap port generálása
      let gamePort = generatedPort; // Port = alap port
      // QueryPort = Port + 1
      let queryPort = gamePort + 1;
      // SteamPeerPort = QueryPort + 1
      let steamPeerPort = queryPort + 1;
      
      // Ellenőrizzük, hogy mindhárom port szabad-e
      // Ha foglaltak, újra generáljuk a portot, amíg mindhárom port szabad nem lesz
      let maxRetries = 10;
      let retryCount = 0;
      let allPortsAvailable = false;
      
      while (!allPortsAvailable && retryCount < maxRetries) {
        // Ellenőrizzük, hogy a portok szabadok-e az adatbázisban ÉS a gépen
        const gamePortAvailableInDb = await checkMultiPortInDatabase(gamePort, options.gameType, serverId);
        const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, options.gameType, serverId);
        const steamPeerPortAvailableInDb = await checkMultiPortInDatabase(steamPeerPort, options.gameType, serverId);
        
        const gamePortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, gamePort);
        const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, queryPort);
        const steamPeerPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, steamPeerPort);
        
        // Mindhárom portnak szabadnak kell lennie az adatbázisban ÉS a gépen
        if (gamePortAvailableInDb && queryPortAvailableInDb && steamPeerPortAvailableInDb &&
            gamePortAvailableOnMachine && queryPortAvailableOnMachine && steamPeerPortAvailableOnMachine) {
          allPortsAvailable = true;
        } else {
          // Ha valamelyik port foglalt, újra generáljuk a portot
          retryCount++;
          // Új port generálása a generateServerPort függvénnyel, ami már ellenőrzi az adatbázist és a gépen is
          const newPort = await generateServerPort(options.gameType, bestLocation.machineId);
          
          // Port alapján számoljuk a QueryPort és SteamPeerPort értékét
          gamePort = newPort;
          queryPort = gamePort + 1; // QueryPort = Port + 1
          steamPeerPort = queryPort + 1; // SteamPeerPort = QueryPort + 1
          
          logger.warn('Port is not available, regenerating port', {
            serverId,
            retryCount,
            newPort: gamePort,
            newQueryPort: queryPort,
            newSteamPeerPort: steamPeerPort,
            gamePortAvailableInDb,
            queryPortAvailableInDb,
            steamPeerPortAvailableInDb,
            gamePortAvailableOnMachine,
            queryPortAvailableOnMachine,
            steamPeerPortAvailableOnMachine,
          });
        }
      }
      
      if (!allPortsAvailable) {
        logger.error(`Could not find available ports for ${options.gameType} server after retries`, new Error('Port allocation failed after retries'), {
          serverId,
          finalPort: gamePort,
          finalQueryPort: queryPort,
          finalSteamPeerPort: steamPeerPort,
        });
        // Folytatjuk, de logoljuk a hibát
      }
      
      // Az adatbázisban a port mezőbe a Port-ot mentjük (alap port)
      generatedPort = gamePort; // Port = alap port
      
      // QueryPort és SteamPeerPort mentése a configuration JSON-ben és az adatbázisban
      configurationUpdate = {
        queryPort: queryPort, // QueryPort (Port + 1)
        steamPeerPort: steamPeerPort, // SteamPeerPort (QueryPort + 1)
      };
      
      logger.info(`${options.gameType} ports generated`, {
        serverId,
        port: gamePort, // Port (alap port)
        queryPort, // QueryPort (Port + 1)
        steamPeerPort, // SteamPeerPort (QueryPort + 1)
        machineId: bestLocation.machineId,
        retries: retryCount,
      });
    } else if (options.gameType === 'RUST') {
      // Rust port számítások:
      // Port = alap port (automatikusan keresni üres portot)
      // QueryPort = Port + 1
      // RustPlusPort = Port + 67 (28015 + 67 = 28082)
      // Összesen: 3 port (pl. 28015, 28016, 28082)
      
      // Alap port generálása
      let gamePort = generatedPort; // Port = alap port
      // QueryPort = Port + 1
      let queryPort = gamePort + 1;
      // RustPlusPort = Port + 67 (28015 alapból + 67 = 28082)
      let rustPlusPort = gamePort + 67;
      
      // Ellenőrizzük, hogy mindhárom port szabad-e
      // Ha foglaltak, újra generáljuk a portot, amíg mindhárom port szabad nem lesz
      let maxRetries = 10;
      let retryCount = 0;
      let allPortsAvailable = false;
      
      while (!allPortsAvailable && retryCount < maxRetries) {
        // Ellenőrizzük, hogy a portok szabadok-e az adatbázisban ÉS a gépen
        const gamePortAvailableInDb = await checkMultiPortInDatabase(gamePort, options.gameType, serverId);
        const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, options.gameType, serverId);
        const rustPlusPortAvailableInDb = await checkMultiPortInDatabase(rustPlusPort, options.gameType, serverId);
        
        const gamePortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, gamePort);
        const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, queryPort);
        const rustPlusPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, rustPlusPort);
        
        // Mindhárom portnak szabadnak kell lennie az adatbázisban ÉS a gépen
        if (gamePortAvailableInDb && queryPortAvailableInDb && rustPlusPortAvailableInDb &&
            gamePortAvailableOnMachine && queryPortAvailableOnMachine && rustPlusPortAvailableOnMachine) {
          allPortsAvailable = true;
        } else {
          // Ha valamelyik port foglalt, újra generáljuk a portot
          retryCount++;
          // Új port generálása a generateServerPort függvénnyel, ami már ellenőrzi az adatbázist és a gépen is
          const newPort = await generateServerPort(options.gameType, bestLocation.machineId);
          
          // Port alapján számoljuk a QueryPort és RustPlusPort értékét
          gamePort = newPort;
          queryPort = gamePort + 1; // QueryPort = Port + 1
          rustPlusPort = gamePort + 67; // RustPlusPort = Port + 67
          
          logger.warn('Port is not available, regenerating port', {
            serverId,
            retryCount,
            newPort: gamePort,
            newQueryPort: queryPort,
            newRustPlusPort: rustPlusPort,
            gamePortAvailableInDb,
            queryPortAvailableInDb,
            rustPlusPortAvailableInDb,
            gamePortAvailableOnMachine,
            queryPortAvailableOnMachine,
            rustPlusPortAvailableOnMachine,
          });
        }
      }
      
      if (!allPortsAvailable) {
        logger.error(`Could not find available ports for ${options.gameType} server after retries`, new Error('Port allocation failed after retries'), {
          serverId,
          finalPort: gamePort,
          finalQueryPort: queryPort,
          finalRustPlusPort: rustPlusPort,
        });
        // Folytatjuk, de logoljuk a hibát
      }
      
      // Az adatbázisban a port mezőbe a Port-ot mentjük (alap port)
      generatedPort = gamePort; // Port = alap port
      
      // QueryPort és RustPlusPort mentése a configuration JSON-ben és az adatbázisban
      configurationUpdate = {
        queryPort: queryPort, // QueryPort (Port + 1)
        rustPlusPort: rustPlusPort, // RustPlusPort (Port + 67)
      };
      
      logger.info(`${options.gameType} ports generated`, {
        serverId,
        port: gamePort, // Port (alap port)
        queryPort, // QueryPort (Port + 1)
        rustPlusPort, // RustPlusPort (Port + 67)
        machineId: bestLocation.machineId,
        retries: retryCount,
      });
    } else if (options.gameType === 'SEVEN_DAYS_TO_DIE') {
      // 7 Days to Die port számítások:
      // GamePort = alap port (automatikusan keresni üres portot, alapértelmezett 26900)
      // QueryPort = GamePort + 1 (Steam Query, UDP)
      // TelnetPort = GamePort + 2 (RCON, TCP)
      // WebMapPort = GamePort + 3 (WebMap, TCP)
      // Összesen: 4 port (pl. 26900, 26901, 26902, 26903)
      
      // Alap port generálása
      let gamePort = generatedPort; // GamePort = alap port
      // QueryPort = GamePort + 1
      let queryPort = gamePort + 1;
      // TelnetPort = GamePort + 2
      let telnetPort = gamePort + 2;
      // WebMapPort = GamePort + 3
      let webMapPort = gamePort + 3;
      
      // Ellenőrizzük, hogy mind a négy port szabad-e
      // Ha foglaltak, újra generáljuk a portot, amíg mind a négy port szabad nem lesz
      let maxRetries = 10;
      let retryCount = 0;
      let allPortsAvailable = false;
      
      while (!allPortsAvailable && retryCount < maxRetries) {
        // Ellenőrizzük, hogy a portok szabadok-e az adatbázisban ÉS a gépen
        const gamePortAvailableInDb = await checkMultiPortInDatabase(gamePort, options.gameType, serverId);
        const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, options.gameType, serverId);
        const telnetPortAvailableInDb = await checkMultiPortInDatabase(telnetPort, options.gameType, serverId);
        const webMapPortAvailableInDb = await checkMultiPortInDatabase(webMapPort, options.gameType, serverId);
        
        const gamePortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, gamePort);
        const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, queryPort);
        const telnetPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, telnetPort);
        const webMapPortAvailableOnMachine = await checkPortAvailableOnMachine(bestLocation.machineId, webMapPort);
        
        // Mind a négy portnak szabadnak kell lennie az adatbázisban ÉS a gépen
        if (gamePortAvailableInDb && queryPortAvailableInDb && telnetPortAvailableInDb && webMapPortAvailableInDb &&
            gamePortAvailableOnMachine && queryPortAvailableOnMachine && telnetPortAvailableOnMachine && webMapPortAvailableOnMachine) {
          allPortsAvailable = true;
        } else {
          // Ha valamelyik port foglalt, újra generáljuk a portot
          retryCount++;
          // Új port generálása a generateServerPort függvénnyel, ami már ellenőrzi az adatbázist és a gépen is
          const newPort = await generateServerPort(options.gameType, bestLocation.machineId);
          
          // Port alapján számoljuk a QueryPort, TelnetPort és WebMapPort értékét
          gamePort = newPort;
          queryPort = gamePort + 1; // QueryPort = GamePort + 1
          telnetPort = gamePort + 2; // TelnetPort = GamePort + 2
          webMapPort = gamePort + 3; // WebMapPort = GamePort + 3
          
          logger.warn('Port is not available, regenerating port', {
            serverId,
            retryCount,
            newPort: gamePort,
            newQueryPort: queryPort,
            newTelnetPort: telnetPort,
            newWebMapPort: webMapPort,
            gamePortAvailableInDb,
            queryPortAvailableInDb,
            telnetPortAvailableInDb,
            webMapPortAvailableInDb,
            gamePortAvailableOnMachine,
            queryPortAvailableOnMachine,
            telnetPortAvailableOnMachine,
            webMapPortAvailableOnMachine,
          });
        }
      }
      
      if (!allPortsAvailable) {
        logger.error(`Could not find available ports for ${options.gameType} server after retries`, new Error('Port allocation failed after retries'), {
          serverId,
          finalPort: gamePort,
          finalQueryPort: queryPort,
          finalTelnetPort: telnetPort,
          finalWebMapPort: webMapPort,
        });
        // Folytatjuk, de logoljuk a hibát
      }
      
      // Az adatbázisban a port mezőbe a GamePort-ot mentjük (alap port)
      generatedPort = gamePort; // GamePort = alap port
      
      // Port változók elmentése a blokkon kívülre, hogy később is elérhetők legyenek
      queryPort7dtd = queryPort;
      telnetPort7dtd = telnetPort;
      webMapPort7dtd = webMapPort;
      
      // QueryPort, TelnetPort és WebMapPort mentése az adatbázisba (mint a többi játéknál)
      // A configuration JSON-ba nem kell menteni, mert az adatbázis mezőkben vannak
      configurationUpdate = {};
      
      logger.info(`${options.gameType} ports generated`, {
        serverId,
        port: gamePort, // GamePort (alap port)
        queryPort, // QueryPort (GamePort + 1)
        telnetPort, // TelnetPort (GamePort + 2)
        webMapPort, // WebMapPort (GamePort + 3)
        machineId: bestLocation.machineId,
        retries: retryCount,
      });
    }
    
    // MINDIG frissítjük a portot, hogy a ténylegesen kiosztott portot használjuk
    // Ez biztosítja, hogy ne az alapértelmezett port maradjon az adatbázisban
    // A configuration-t is frissítjük, ha van Satisfactory-nál
    const serverForConfig = await prisma.server.findUnique({
      where: { id: serverId },
      select: { configuration: true },
    });
    
    const currentConfig = serverForConfig?.configuration ? (typeof serverForConfig.configuration === 'string' ? JSON.parse(serverForConfig.configuration as string) : serverForConfig.configuration) : {};
    const updatedConfig = { ...currentConfig, ...configurationUpdate };
    
    // Satisfactory-nál a port mezőbe a GamePort-ot mentjük (alap port), 
    // a queryPort és beaconPort mezőket pedig külön mezőként
    const updateData: any = {
      port: generatedPort, // GamePort (alap port)
    };
    
    if (options.gameType === 'SATISFACTORY' && Object.keys(configurationUpdate).length > 0) {
      updateData.queryPort = configurationUpdate.queryPort; // QueryPort (GamePort + 2)
      updateData.beaconPort = configurationUpdate.beaconPort; // BeaconPort (QueryPort + 2)
      updateData.configuration = updatedConfig;
    } else if (options.gameType === 'VALHEIM' && Object.keys(configurationUpdate).length > 0) {
      updateData.queryPort = configurationUpdate.queryPort; // QueryPort (Port + 1)
      updateData.configuration = updatedConfig;
    } else if (options.gameType === 'THE_FOREST' && Object.keys(configurationUpdate).length > 0) {
      updateData.queryPort = configurationUpdate.queryPort; // QueryPort (Port + 1)
      updateData.steamPeerPort = configurationUpdate.steamPeerPort; // SteamPeerPort (QueryPort + 1)
      updateData.configuration = updatedConfig;
    } else if (options.gameType === 'RUST' && Object.keys(configurationUpdate).length > 0) {
      updateData.queryPort = configurationUpdate.queryPort; // QueryPort (Port + 1)
      updateData.rustPlusPort = configurationUpdate.rustPlusPort; // RustPlusPort (Port + 67)
      updateData.configuration = updatedConfig;
    } else if (options.gameType === 'SEVEN_DAYS_TO_DIE') {
      // 7 Days to Die: portok az adatbázis mezőkben (mint a többi játéknál)
      if (queryPort7dtd !== undefined) {
        updateData.queryPort = queryPort7dtd; // QueryPort (GamePort + 1)
      }
      if (telnetPort7dtd !== undefined) {
        updateData.telnetPort = telnetPort7dtd; // TelnetPort (GamePort + 2)
      }
      if (webMapPort7dtd !== undefined) {
        updateData.webMapPort = webMapPort7dtd; // WebMapPort (GamePort + 3)
      }
      if (Object.keys(configurationUpdate).length > 0) {
        updateData.configuration = updatedConfig;
      }
    } else if (Object.keys(configurationUpdate).length > 0) {
      updateData.configuration = updatedConfig;
    }
    
    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: updateData,
    });
    
    // Log, hogy lássuk, hogy a port frissült
    logger.info('Port generated and updated in database', {
      serverId,
      generatedPort,
      gameType: options.gameType,
      machineId: bestLocation.machineId,
      actualPortInDb: updatedServer.port,
      configuration: Object.keys(configurationUpdate).length > 0 ? configurationUpdate : undefined,
    });

    // Task végrehajtása háttérben (ez telepíti a szervert)
    // A task executor hívja meg az installGameServer-t
    executeTask(task.id).catch((error) => {
      console.error(`Provisioning task ${task.id} végrehajtási hiba:`, error);
      // Ha a task sikertelen, állítsuk be ERROR státuszt
      prisma.server.update({
        where: { id: serverId },
        data: { status: 'ERROR' },
      }).catch((updateError) => {
        console.error('Failed to update server status to ERROR:', updateError);
      });
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
  // Satisfactory-nál a port mező a QueryPort-ot tartalmazza (4 számjegyű port, alapértelmezett 7777)
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
    SATISFACTORY: 7777, // QueryPort (4 számjegyű port, alapértelmezett 7777)
    OTHER: 25565,
  };

  const basePort = defaultPorts[gameType] || 25565;

  // Satisfactory-nál külön ellenőrzés, mert több portot kell ellenőrizni (QueryPort, BeaconPort, GamePort)
  if (gameType === 'SATISFACTORY') {
    // Satisfactory-nál az új logika szerint:
    // - GamePort = alap port (pl. 7777)
    // - QueryPort = GamePort + 2 (pl. 7779)
    // - BeaconPort = QueryPort + 2 = GamePort + 4 (pl. 7781)
    // A generateServerPort a GamePort-ot adja vissza (alap port)
    for (let offset = 0; offset < 100; offset++) {
      const gamePort = basePort + offset; // GamePort = alap port
      const queryPort = gamePort + 2; // QueryPort = GamePort + 2
      const beaconPort = queryPort + 2; // BeaconPort = QueryPort + 2
      
      // Ellenőrizzük az adatbázisban, hogy a portok szabadok-e
      const gamePortAvailableInDb = await checkMultiPortInDatabase(gamePort, gameType);
      const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, gameType);
      const beaconPortAvailableInDb = await checkMultiPortInDatabase(beaconPort, gameType);
      
      // Ha mindhárom port szabad az adatbázisban
      if (gamePortAvailableInDb && queryPortAvailableInDb && beaconPortAvailableInDb) {
        // Ha van machineId, ellenőrizzük a gépen is
        if (machineId) {
          const gamePortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, gamePort);
          const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, queryPort);
          const beaconPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, beaconPort);
          
          if (gamePortAvailableOnMachine && queryPortAvailableOnMachine && beaconPortAvailableOnMachine) {
            return gamePort; // Visszaadjuk a GamePort-ot (alap port)
          }
        } else {
          return gamePort; // Visszaadjuk a GamePort-ot (alap port)
        }
      }
    }
    
    // Ha nincs szabad port, visszaadjuk az alapértelmezettet
    return basePort;
  }

  // Valheim esetén két portot kell ellenőrizni (Port és QueryPort)
  if (gameType === 'VALHEIM') {
    // Port számítások:
    // - Port = alap port (pl. 2456)
    // - QueryPort = Port + 1 (pl. 2457)
    // A generateServerPort a Port-ot adja vissza (alap port)
    for (let offset = 0; offset < 100; offset++) {
      const port = basePort + offset; // Port = alap port
      const queryPort = port + 1; // QueryPort = Port + 1
      
      // Ellenőrizzük az adatbázisban, hogy a portok szabadok-e
      const portAvailableInDb = await checkMultiPortInDatabase(port, gameType);
      const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, gameType);
      
      // Ha mindkét port szabad az adatbázisban
      if (portAvailableInDb && queryPortAvailableInDb) {
        // Ha van machineId, ellenőrizzük a gépen is
        if (machineId) {
          const portAvailableOnMachine = await checkPortAvailableOnMachine(machineId, port);
          const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, queryPort);
          
          if (portAvailableOnMachine && queryPortAvailableOnMachine) {
            return port; // Visszaadjuk a Port-ot (alap port)
          }
        } else {
          return port; // Visszaadjuk a Port-ot (alap port)
        }
      }
    }
    
    // Ha nincs szabad port, visszaadjuk az alapértelmezettet
    return basePort;
  }

  // The Forest esetén három portot kell ellenőrizni (Port, QueryPort, SteamPeerPort)
  if (gameType === 'THE_FOREST') {
    // Port számítások:
    // - Port = alap port (pl. 27015)
    // - QueryPort = Port + 1 (pl. 27016)
    // - SteamPeerPort = QueryPort + 1 (pl. 27017)
    // A generateServerPort a Port-ot adja vissza (alap port)
    for (let offset = 0; offset < 100; offset++) {
      const port = basePort + offset; // Port = alap port
      const queryPort = port + 1; // QueryPort = Port + 1
      const steamPeerPort = queryPort + 1; // SteamPeerPort = QueryPort + 1
      
      // Ellenőrizzük az adatbázisban, hogy a portok szabadok-e
      const portAvailableInDb = await checkMultiPortInDatabase(port, gameType);
      const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, gameType);
      const steamPeerPortAvailableInDb = await checkMultiPortInDatabase(steamPeerPort, gameType);
      
      // Ha mindhárom port szabad az adatbázisban
      if (portAvailableInDb && queryPortAvailableInDb && steamPeerPortAvailableInDb) {
        // Ha van machineId, ellenőrizzük a gépen is
        if (machineId) {
          const portAvailableOnMachine = await checkPortAvailableOnMachine(machineId, port);
          const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, queryPort);
          const steamPeerPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, steamPeerPort);
          
          if (portAvailableOnMachine && queryPortAvailableOnMachine && steamPeerPortAvailableOnMachine) {
            return port; // Visszaadjuk a Port-ot (alap port)
          }
        } else {
          return port; // Visszaadjuk a Port-ot (alap port)
        }
      }
    }
    
    // Ha nincs szabad port, visszaadjuk az alapértelmezettet
    return basePort;
  }

  // Rust esetén három portot kell ellenőrizni (Port, QueryPort, RustPlusPort)
  if (gameType === 'RUST') {
    // Port számítások:
    // - Port = alap port (pl. 28015)
    // - QueryPort = Port + 1 (pl. 28016)
    // - RustPlusPort = Port + 67 (pl. 28082)
    // A generateServerPort a Port-ot adja vissza (alap port)
    for (let offset = 0; offset < 100; offset++) {
      const port = basePort + offset; // Port = alap port
      const queryPort = port + 1; // QueryPort = Port + 1
      const rustPlusPort = port + 67; // RustPlusPort = Port + 67
      
      // Ellenőrizzük az adatbázisban, hogy a portok szabadok-e
      const portAvailableInDb = await checkMultiPortInDatabase(port, gameType);
      const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, gameType);
      const rustPlusPortAvailableInDb = await checkMultiPortInDatabase(rustPlusPort, gameType);
      
      // Ha mindhárom port szabad az adatbázisban
      if (portAvailableInDb && queryPortAvailableInDb && rustPlusPortAvailableInDb) {
        // Ha van machineId, ellenőrizzük a gépen is
        if (machineId) {
          const portAvailableOnMachine = await checkPortAvailableOnMachine(machineId, port);
          const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, queryPort);
          const rustPlusPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, rustPlusPort);
          
          if (portAvailableOnMachine && queryPortAvailableOnMachine && rustPlusPortAvailableOnMachine) {
            return port; // Visszaadjuk a Port-ot (alap port)
          }
        } else {
          return port; // Visszaadjuk a Port-ot (alap port)
        }
      }
    }
    
    // Ha nincs szabad port, visszaadjuk az alapértelmezettet
    return basePort;
  }

  // 7 Days to Die esetén négy portot kell ellenőrizni (GamePort, QueryPort, TelnetPort, WebMapPort)
  if (gameType === 'SEVEN_DAYS_TO_DIE') {
    // Port számítások:
    // - GamePort = alap port (pl. 26900)
    // - QueryPort = GamePort + 1 (pl. 26901)
    // - TelnetPort = GamePort + 2 (pl. 26902)
    // - WebMapPort = GamePort + 3 (pl. 26903)
    // A generateServerPort a GamePort-ot adja vissza (alap port)
    for (let offset = 0; offset < 100; offset++) {
      const gamePort = basePort + offset; // GamePort = alap port
      const queryPort = gamePort + 1; // QueryPort = GamePort + 1
      const telnetPort = gamePort + 2; // TelnetPort = GamePort + 2
      const webMapPort = gamePort + 3; // WebMapPort = GamePort + 3
      
      // Ellenőrizzük az adatbázisban, hogy a portok szabadok-e
      const gamePortAvailableInDb = await checkMultiPortInDatabase(gamePort, gameType);
      const queryPortAvailableInDb = await checkMultiPortInDatabase(queryPort, gameType);
      const telnetPortAvailableInDb = await checkMultiPortInDatabase(telnetPort, gameType);
      const webMapPortAvailableInDb = await checkMultiPortInDatabase(webMapPort, gameType);
      
      // Ha mind a négy port szabad az adatbázisban
      if (gamePortAvailableInDb && queryPortAvailableInDb && telnetPortAvailableInDb && webMapPortAvailableInDb) {
        // Ha van machineId, ellenőrizzük a gépen is
        if (machineId) {
          const gamePortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, gamePort);
          const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, queryPort);
          const telnetPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, telnetPort);
          const webMapPortAvailableOnMachine = await checkPortAvailableOnMachine(machineId, webMapPort);
          
          if (gamePortAvailableOnMachine && queryPortAvailableOnMachine && telnetPortAvailableOnMachine && webMapPortAvailableOnMachine) {
            return gamePort; // Visszaadjuk a GamePort-ot (alap port)
          }
        } else {
          return gamePort; // Visszaadjuk a GamePort-ot (alap port)
        }
      }
    }
    
    // Ha nincs szabad port, visszaadjuk az alapértelmezettet
    return basePort;
  }

  // Más játékoknál az egyszerű ellenőrzés
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
 * Ellenőrzi, hogy egy port foglalt-e az adatbázisban több portot használó játékoknál
 * (Valheim, The Forest, Rust, Satisfactory)
 * Ellenőrzi a port, queryPort, beaconPort mezőket ÉS a configuration JSON-ben tárolt portokat is
 */
export async function checkMultiPortInDatabase(port: number, gameType: GameType, excludeServerId?: string): Promise<boolean> {
  try {
    // Lekérjük az összes szervert az adott játék típusnál, amely nem OFFLINE
    const servers = await prisma.server.findMany({
      where: {
        gameType: gameType,
        status: {
          not: 'OFFLINE',
        },
        ...(excludeServerId ? { id: { not: excludeServerId } } : {}),
      },
    });

    // Ellenőrizzük, hogy a port foglalt-e
    for (const server of servers) {
      // Ellenőrizzük a port mezőt (alap port)
      if (server.port === port) {
        return false; // Foglalt
      }

      // Ellenőrizzük a queryPort mezőt
      // Type assertion használata, mert a Prisma client típusokban lehet, hogy nincs benne
      const serverWithPorts = server as any;
      if (serverWithPorts.queryPort !== null && serverWithPorts.queryPort !== undefined && serverWithPorts.queryPort === port) {
        return false; // Foglalt
      }

      // Satisfactory-nál ellenőrizzük a beaconPort mezőt is
      if (gameType === 'SATISFACTORY') {
        if (serverWithPorts.beaconPort !== null && serverWithPorts.beaconPort !== undefined && serverWithPorts.beaconPort === port) {
          return false; // Foglalt
        }
      }

      // The Forest-nál ellenőrizzük a steamPeerPort mezőt is
      if (gameType === 'THE_FOREST') {
        if (serverWithPorts.steamPeerPort !== null && serverWithPorts.steamPeerPort !== undefined && serverWithPorts.steamPeerPort === port) {
          return false; // Foglalt
        }
      }

      // Rust-nál ellenőrizzük a rustPlusPort mezőt is
      if (gameType === 'RUST') {
        if (serverWithPorts.rustPlusPort !== null && serverWithPorts.rustPlusPort !== undefined && serverWithPorts.rustPlusPort === port) {
          return false; // Foglalt
        }
      }

      // 7 Days to Die-nál ellenőrizzük a telnetPort és webMapPort mezőket is (adatbázis mezőkben)
      if (gameType === 'SEVEN_DAYS_TO_DIE') {
        const serverWithPorts = server as any;
        if (serverWithPorts.telnetPort !== null && serverWithPorts.telnetPort !== undefined && serverWithPorts.telnetPort === port) {
          return false; // Foglalt
        }
        if (serverWithPorts.webMapPort !== null && serverWithPorts.webMapPort !== undefined && serverWithPorts.webMapPort === port) {
          return false; // Foglalt
        }
        // Backward compatibility: ellenőrizzük a configuration JSON-ból is
        if (server.configuration) {
          try {
            const config = typeof server.configuration === 'string' ? JSON.parse(server.configuration) : server.configuration;
            if (config.telnetPort === port || config.webMapPort === port) {
              return false; // Foglalt
            }
          } catch (parseError) {
            console.warn('Failed to parse server configuration:', parseError);
          }
        }
      }

      // Ellenőrizzük a portokat a configuration JSON-ból is (backward compatibility)
      if (server.configuration) {
        try {
          const config = typeof server.configuration === 'string' ? JSON.parse(server.configuration) : server.configuration;
          if (config.queryPort === port || config.beaconPort === port || config.gamePort === port || config.port === port ||
              config.steamPeerPort === port || config.rustPlusPort === port || config.telnetPort === port || config.webMapPort === port) {
            return false; // Foglalt
          }
        } catch (parseError) {
          console.warn('Failed to parse server configuration:', parseError);
        }
      }
    }

    return true; // Szabad
  } catch (error) {
    // Hiba esetén biztonságosabb feltételezni, hogy a port foglalt
    console.error(`Database port check error for port ${port} (${gameType}):`, error);
    return false;
  }
}

/**
 * Ellenőrzi, hogy egy port foglalt-e az adatbázisban Satisfactory szervereknél
 * Ellenőrzi a port, queryPort, beaconPort mezőket ÉS a configuration JSON-ben tárolt queryPort, beaconPort és gamePort értékeket is
 */
export async function checkSatisfactoryPortInDatabase(port: number, excludeServerId?: string): Promise<boolean> {
  return checkMultiPortInDatabase(port, 'SATISFACTORY', excludeServerId);
}

/**
 * Ellenőrzi, hogy a port elérhető-e a gépen (Docker konténerek és egyéb folyamatok figyelembevételével)
 */
export async function checkPortAvailableOnMachine(machineId: string, port: number): Promise<boolean> {
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
    // Ellenőrizzük a natív folyamatokat, Docker konténereket és egyéb szervereket is
    // Az ss/netstat már tartalmazza a Docker konténerek portjait is, ha publish-elve vannak
    const checkCommand = `(
      # Natív folyamatok és Docker konténerek ellenőrzése (ss vagy netstat)
      # A Docker konténerek portjai is megjelennek itt, ha publish-elve vannak
      if (ss -tuln 2>/dev/null || netstat -tuln 2>/dev/null) | grep -q ":${port} "; then
        exit 1
      fi
      
      # További ellenőrzés: Docker konténerek port mappingjének explicit ellenőrzése
      # (ha a konténer portja nincs publish-elve, akkor nem jelenik meg az ss-ben)
      if command -v docker >/dev/null 2>&1; then
        if docker ps --format '{{.Ports}}' 2>/dev/null | grep -qE ":[0-9]+->.*:${port}/|:${port}->"; then
          exit 1
        fi
      fi
      
      # Ha ide érünk, akkor a port szabad
      echo "available"
    )`;

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
    return result.stdout?.trim().includes('available') || false;
  } catch (error) {
    // Hiba esetén biztonságosabb feltételezni, hogy a port foglalt
    console.error(`Port ellenőrzési hiba a ${machineId} gépen a ${port} porthoz:`, error);
    return false;
  }
}

