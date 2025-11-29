import { prisma } from '@/lib/prisma';
import { GameType, ServerStatus } from '@prisma/client';
import { executeTask } from './task-executor';
import { logger } from '@/lib/logger';

interface ProvisioningOptions {
  gameType: GameType;
  maxPlayers: number;
  planId?: string;
  gamePackageId?: string;
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
        },
      },
    });

    // Port generálása (ellenőrzi a Docker konténereket és egyéb folyamatokat is)
    // MINDIG generálunk új portot, hogy a ténylegesen kiosztott portot használjuk
    let generatedPort = await generateServerPort(options.gameType, bestLocation.machineId);
    
    // Satisfactory-nál a QueryPort, GamePort és BeaconPort generálása
    let configurationUpdate: any = {};
    if (options.gameType === 'SATISFACTORY') {
      // QueryPort = a generált port (4 számjegyű port, pl. 7777)
      let queryPort = generatedPort;
      // GamePort = QueryPort + 10000 (pl. 7777 -> 17777)
      let gamePort = queryPort + 10000;
      // BeaconPort = QueryPort + 7223 (pl. 7777 -> 15000)
      let beaconPort = queryPort + 7223;
      
      // Ellenőrizzük, hogy a GamePort és BeaconPort is szabad-e
      // Ha foglaltak, újra generáljuk a QueryPort-ot, amíg mindhárom port szabad nem lesz
      let maxRetries = 10;
      let retryCount = 0;
      let allPortsAvailable = false;
      
      while (!allPortsAvailable && retryCount < maxRetries) {
        const gamePortAvailable = await checkPortAvailableOnMachine(bestLocation.machineId, gamePort);
        const beaconPortAvailable = await checkPortAvailableOnMachine(bestLocation.machineId, beaconPort);
        
        if (gamePortAvailable && beaconPortAvailable) {
          allPortsAvailable = true;
        } else {
          // Ha a GamePort vagy BeaconPort foglalt, újra generáljuk a QueryPort-ot
          retryCount++;
          // Új QueryPort generálása offset-tel, hogy biztosan új portot kapjunk
          const baseQueryPort = queryPort || generatedPort;
          queryPort = baseQueryPort + retryCount; // Offset-tel növeljük
          
          // Ellenőrizzük, hogy az új QueryPort is szabad-e
          const queryPortAvailable = await checkPortAvailableOnMachine(bestLocation.machineId, queryPort);
          if (!queryPortAvailable) {
            // Ha az új QueryPort is foglalt, akkor teljesen új portot generálunk
            queryPort = await generateServerPort(options.gameType, bestLocation.machineId);
          }
          
          gamePort = queryPort + 10000;
          beaconPort = queryPort + 7223;
          
          logger.warn('GamePort or BeaconPort is not available, regenerating QueryPort', {
            serverId,
            retryCount,
            newQueryPort: queryPort,
            newGamePort: gamePort,
            newBeaconPort: beaconPort,
            gamePortAvailable,
            beaconPortAvailable,
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
      
      // Frissítjük a generált portot is, ha változott
      if (queryPort !== generatedPort) {
        generatedPort = queryPort;
      }
      
      // BeaconPort és GamePort mentése a configuration JSON-ben
      configurationUpdate = {
        queryPort: queryPort,
        gamePort: gamePort,
        beaconPort: beaconPort,
      };
      
      logger.info('Satisfactory ports generated', {
        serverId,
        queryPort,
        gamePort,
        beaconPort,
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
    
    const updatedServer = await prisma.server.update({
      where: { id: serverId },
      data: {
        port: generatedPort,
        ...(Object.keys(configurationUpdate).length > 0 ? { configuration: updatedConfig } : {}),
      },
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

