import { prisma, withRetry, ensureConnection } from '@/lib/prisma';
import { TaskStatus, TaskType, ServerStatus, GameType } from '@prisma/client';
import { generateServerPort } from './server-provisioning';
import { logger } from './logger';
import { AppError, ErrorCodes } from './error-handler';

/**
 * Feladat végrehajtása
 */
export async function executeTask(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      agent: {
        include: {
          machine: true,
        },
      },
      server: true,
    },
  });

  if (!task) {
    throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Feladat nem található', 404);
  }

  if (task.status !== 'PENDING') {
    throw new AppError(
      ErrorCodes.TASK_ALREADY_RUNNING,
      'Csak PENDING státuszú feladat hajtható végre',
      400
    );
  }

  logger.info('Executing task', {
    taskId,
    type: task.type,
    serverId: task.serverId,
  });

  // Task státusz frissítése RUNNING-re (retry logikával)
  await withRetry(async () => {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  });

  try {
    let result: any = {};

    switch (task.type) {
      case 'PROVISION':
        result = await executeProvisionTask(task);
        break;
      case 'START':
        result = await executeStartTask(task);
        break;
      case 'STOP':
        result = await executeStopTask(task);
        break;
      case 'RESTART':
        result = await executeRestartTask(task);
        break;
      case 'UPDATE':
        result = await executeUpdateTask(task);
        break;
      case 'BACKUP':
        result = await executeBackupTask(task);
        break;
      case 'DELETE':
        result = await executeDeleteTask(task);
        break;
      case 'INSTALL_AGENT':
        // Agent telepítés már a route-ban van kezelve
        result = { message: 'Agent telepítés folyamatban' };
        break;
      default:
        throw new AppError(
          ErrorCodes.TASK_EXECUTION_FAILED,
          `Ismeretlen feladat típus: ${task.type}`,
          400
        );
    }

    // Task sikeresen befejezve (retry logikával)
    await withRetry(async () => {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result,
        },
      });
    });

    // Webhook esemény küldése (sikeres feladatoknál is)
    if (task.type === 'BACKUP') {
      const { sendWebhookEvent } = await import('./webhook-sender');
      sendWebhookEvent('backup_created', {
        taskId: task.id,
        serverId: task.serverId,
        backupName: result.backupPath,
      }).catch((error) => {
        logger.error('Webhook send error', error as Error, {
          taskId: task.id,
          event: 'backup_created',
        });
      });
      
      // Értesítés küldése
      if (task.serverId) {
        const server = await prisma.server.findUnique({
          where: { id: task.serverId },
          select: { userId: true, name: true },
        });
        if (server) {
          const { createNotification } = await import('./notifications');
          createNotification(
            server.userId,
            'BACKUP_CREATED',
            'Backup sikeresen létrehozva',
            `A(z) ${server.name} szerver backup-ja sikeresen létrejött.`,
            'medium',
            { serverId: task.serverId, backupPath: result.backupPath }
          ).catch((error) => {
            logger.error('Notification send error', error as Error, {
              taskId: task.id,
              serverId: task.serverId,
            });
          });
        }
      }
    } else {
      const { sendWebhookEvent } = await import('./webhook-sender');
      sendWebhookEvent('task_completed', {
        taskId: task.id,
        taskType: task.type,
        serverId: task.serverId,
      }).catch((error) => {
        logger.error('Webhook send error', error as Error, {
          taskId: task.id,
          event: 'backup_created',
        });
      });
    }
  } catch (error: any) {
    // Task hibával befejezve (retry logikával)
    await withRetry(async () => {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: error.message,
        },
      });
    });

    // Ha szerver művelet volt, állítsuk be ERROR státuszt
    if (task.serverId && ['START', 'STOP', 'RESTART'].includes(task.type)) {
      await prisma.server.update({
        where: { id: task.serverId },
        data: { status: 'ERROR' },
      });
    }

    // Email értesítés küldése
    const { sendTaskCompletionNotification } = await import('./email-notifications');
    sendTaskCompletionNotification(taskId).catch((error) => {
      logger.error('Email notification send error', error as Error, {
        taskId,
      });
    });

    // Webhook esemény küldése
    const { sendWebhookEvent } = await import('./webhook-sender');
    sendWebhookEvent('task_failed', {
      taskId: task.id,
      taskType: task.type,
      serverId: task.serverId,
      error: error.message,
    }).catch(console.error);
    
    // Értesítés küldése
    if (task.serverId) {
      const server = await prisma.server.findUnique({
        where: { id: task.serverId },
        select: { userId: true, name: true },
      });
      if (server) {
        const { createNotification } = await import('./notifications');
        createNotification(
          server.userId,
          'TASK_FAILED',
          'Feladat sikertelen',
          `A(z) ${server.name} szerveren a ${task.type} feladat sikertelen volt: ${error.message}`,
          'high',
          { serverId: task.serverId, taskId: task.id, taskType: task.type }
        ).catch(console.error);
      }
    }

    throw error;
  }
}

/**
 * Provision task végrehajtása - új szerver telepítése
 */
async function executeProvisionTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a provisioning-hoz');
  }

  const server = task.server;
  const agent = task.agent;

  // Szerver státusz frissítése STARTING-re (retry logikával)
  await withRetry(async () => {
    await prisma.server.update({
      where: { id: task.serverId },
      data: { status: 'STARTING' },
    });
  });

  // Port generálása és frissítése (retry logikával)
  // Satisfactory-nál is generálunk portot a provisioning során, hogy már a telepítés alatt is lássa a felhasználó
  // A port a QueryPort-ot tartalmazza (4 számjegyű port, alapértelmezett 7777)
  let port: number | null = null;
  let finalPort: number | null = null;
  
  // Az adatbázisból ellenőrizzük, hogy van-e már generált port (provisioning során generálódhatott)
  const serverWithPort = await prisma.server.findUnique({
    where: { id: task.serverId },
    select: { port: true },
  });
  
  if (serverWithPort?.port) {
    // Ha már van port az adatbázisban (provisioning során generálódott), azt használjuk
    port = serverWithPort.port;
    finalPort = port;
    server.port = port;
    logger.info('Port already exists in database, using existing port', {
      serverId: task.serverId,
      existingPort: port,
      gameType: server.gameType,
    });
  } else {
    // Ha nincs port, generálunk egyet (ez biztosítja, hogy mindig legyen port)
    port = await generateServerPort(server.gameType, agent.machine?.id);
    await withRetry(async () => {
      await prisma.server.update({
        where: { id: task.serverId },
        data: { port },
      });
    });
    
    // Ellenőrizzük, hogy a port tényleg frissült az adatbázisban
    const serverAfterUpdate = await prisma.server.findUnique({
      where: { id: task.serverId },
      select: { port: true },
    });
    
    logger.info('Port generated and updated in task executor', {
      serverId: task.serverId,
      generatedPort: port,
      actualPortInDb: serverAfterUpdate?.port,
      gameType: server.gameType,
      machineId: agent.machine?.id,
    });
    
    finalPort = port;
    // Frissítjük a server objektumot is
    server.port = port;
  }

  // IP cím beállítása, ha nincs (retry logikával)
  if (!server.ipAddress && agent.machine) {
    await withRetry(async () => {
      await prisma.server.update({
        where: { id: task.serverId },
        data: { ipAddress: agent.machine.ipAddress },
      });
    });
    // Frissítjük a server objektumot is
    server.ipAddress = agent.machine.ipAddress;
  }

  // Game szerver telepítése (ha még nem történt meg)
  const { installGameServer } = await import('./game-server-installer');
  
  // GamePackage vagy PricingPlan adatok lekérése
  let ram = 2048; // Alapértelmezett RAM (MB)
  let unlimitedRam = false;
  let gamePackage = null;
  
  if (task.command?.gamePackageId) {
    gamePackage = await prisma.gamePackage.findUnique({
      where: { id: task.command.gamePackageId },
    });
    if (gamePackage) {
      unlimitedRam = (gamePackage as any).unlimitedRam || false;
      if (!unlimitedRam && gamePackage.ram) {
        ram = gamePackage.ram * 1024; // GB -> MB konverzió (pl. 2 GB = 2048 MB)
      }
    }
  } else if (task.command?.planId) {
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: task.command.planId },
    });
    if (plan) {
      ram = (plan.features as any)?.ram || 2048; // PricingPlan már MB-ban van
    }
  }

  // Biztosítjuk, hogy a port az adatbázisban frissítve legyen az installGameServer hívás előtt
  // Az installGameServer az adatbázisból lekérdezi a portot, ezért fontos, hogy már frissítve legyen
  const installResult = await installGameServer(task.serverId, server.gameType, {
    maxPlayers: server.maxPlayers,
    ram: unlimitedRam ? 0 : ram, // MB-ban (0 ha korlátlan)
    unlimitedRam: unlimitedRam,
    port: finalPort || 25565, // A generált portot használjuk (bár az installGameServer az adatbázisból olvassa)
    name: server.name,
  }, {
    writeProgress: true, // Progress fájlok írása
  });

  if (!installResult.success) {
    throw new Error(installResult.error || 'Game szerver telepítési hiba');
  }

  // Biztosítjuk, hogy a systemd service ne fusson (ha mégis elindult, leállítjuk)
  const serviceName = `server-${task.serverId}`;
  const { executeSSHCommand } = await import('./ssh-client');
  
  try {
    await executeSSHCommand(
      {
        host: agent.machine?.ipAddress || '',
        port: agent.machine?.sshPort || 22,
        user: agent.machine?.sshUser || 'root',
        keyPath: agent.machine?.sshKeyPath || undefined,
      },
      `systemctl stop ${serviceName} 2>/dev/null || true`
    );
    
    logger.info('Systemd service stopped after provisioning', {
      serverId: task.serverId,
      serviceName,
    });
  } catch (error) {
    // Nem kritikus hiba, ha nem sikerül leállítani
    logger.warn('Could not stop systemd service after provisioning', {
      serverId: task.serverId,
      serviceName,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Mindig OFFLINE-ra állítjuk a szervert - a felhasználó majd manuálisan indíthatja el
  await withRetry(async () => {
    await prisma.server.update({
      where: { id: task.serverId },
      data: { status: 'OFFLINE' },
    });
  });
  
  logger.info('Server provisioned but not started (user must start manually)', {
    serverId: task.serverId,
    gameType: server.gameType,
  });
  
  return {
    message: 'Szerver sikeresen telepítve. A szerver OFFLINE állapotban van, a felhasználó manuálisan indíthatja el.',
    ipAddress: agent.machine?.ipAddress,
    port: server.port,
  };
}

/**
 * Start task végrehajtása - szerver indítása
 */
async function executeStartTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges az indításhoz');
  }

  const server = task.server;

  // Szerver státusz frissítése STARTING-re
  await prisma.server.update({
    where: { id: task.serverId },
    data: { status: 'STARTING' },
  });

  // SSH kapcsolat az agent géppel és systemd service indítása
  if (task.agent && task.agent.machine) {
    const { executeSSHCommand } = await import('./ssh-client');
    const { createSystemdServiceForServer } = await import('./game-server-installer');
    const { ALL_GAME_SERVER_CONFIGS } = await import('./game-server-configs');
    const machine = task.agent.machine;
    
    // Systemd service újragenerálása a frissített startCommand-tal
    try {
      const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType as keyof typeof ALL_GAME_SERVER_CONFIGS];
      if (!gameConfig) {
        throw new Error(`Game config not found for type: ${server.gameType}`);
      }
      
      // Config objektum előkészítése - ha nincs, akkor a szerver adatbázisból származó adatokat használjuk
      let config: any = {};
      
      // Próbáljuk meg kinyerni a config-ot a server.configuration-ból
      if (server.configuration) {
        try {
          const parsedConfig = typeof server.configuration === 'string' 
            ? JSON.parse(server.configuration) 
            : server.configuration;
          
          if (parsedConfig && typeof parsedConfig === 'object' && parsedConfig !== null) {
            config = { ...parsedConfig };
          }
        } catch (parseError) {
          console.warn('Config parse hiba:', parseError);
          // Folytatjuk az alapértelmezett config-gal
        }
      }
      
      // GamePackage adatok lekérése, ha van gamePackageId a config-ban
      let gamePackage = null;
      if (config.gamePackageId) {
        try {
          gamePackage = await prisma.gamePackage.findUnique({
            where: { id: config.gamePackageId },
          });
        } catch (error) {
          console.warn('GamePackage lekérési hiba:', error);
        }
      }
      
      // Port lekérése - a port már a provisioning során generálódik és az adatbázisban van
      // Ha nincs port az adatbázisban (ritka eset), akkor generálunk egyet
      let serverPort = server.port || config.port;
      if (!serverPort) {
        // Ha mégsem lenne port (nem várt eset), generálunk egyet
        const { generateServerPort } = await import('./server-provisioning');
        serverPort = await generateServerPort(server.gameType, machine.id);
        
        // Mentsük el az adatbázisba
        await withRetry(async () => {
          await prisma.server.update({
            where: { id: task.serverId },
            data: { port: serverPort },
          });
        });
        
        logger.warn('Server port was missing, generated on start', {
          serverId: task.serverId,
          generatedPort: serverPort,
          gameType: server.gameType,
        });
      }
      
      // Satisfactory-nál ellenőrizzük, hogy a portok szabadok-e az adatbázisban és a gépen
      // Ez biztosítja, hogy ne legyen port ütközés, ha több szerver egyszerre indul
      if (server.gameType === 'SATISFACTORY' && serverPort) {
        const { checkSatisfactoryPortInDatabase } = await import('./server-provisioning');
        const { checkPortAvailableOnMachine } = await import('./server-provisioning');
        
        // Lekérjük a queryPort és beaconPort értékeket az adatbázisból
        const serverWithPorts = await prisma.server.findUnique({
          where: { id: task.serverId },
          select: {
            port: true,
            queryPort: true,
            beaconPort: true,
            configuration: true,
          },
        });
        
        const queryPort = serverWithPorts?.queryPort || serverPort;
        const beaconPort = serverWithPorts?.beaconPort || (queryPort + 7223);
        const gamePort = queryPort + 10000;
        
        // Ellenőrizzük, hogy a portok szabadok-e az adatbázisban (kivéve az aktuális szervert)
        const queryPortAvailableInDb = await checkSatisfactoryPortInDatabase(queryPort, task.serverId);
        const beaconPortAvailableInDb = await checkSatisfactoryPortInDatabase(beaconPort, task.serverId);
        const gamePortAvailableInDb = await checkSatisfactoryPortInDatabase(gamePort, task.serverId);
        
        // Ellenőrizzük a gépen is
        const queryPortAvailableOnMachine = await checkPortAvailableOnMachine(machine.id, queryPort);
        const beaconPortAvailableOnMachine = await checkPortAvailableOnMachine(machine.id, beaconPort);
        const gamePortAvailableOnMachine = await checkPortAvailableOnMachine(machine.id, gamePort);
        
        // Ha bármelyik port foglalt, újra generáljuk a QueryPort-ot
        if (!queryPortAvailableInDb || !beaconPortAvailableInDb || !gamePortAvailableInDb ||
            !queryPortAvailableOnMachine || !beaconPortAvailableOnMachine || !gamePortAvailableOnMachine) {
          
          logger.warn('Port conflict detected on start, regenerating ports', {
            serverId: task.serverId,
            oldQueryPort: queryPort,
            oldBeaconPort: beaconPort,
            oldGamePort: gamePort,
            queryPortAvailableInDb,
            beaconPortAvailableInDb,
            gamePortAvailableInDb,
            queryPortAvailableOnMachine,
            beaconPortAvailableOnMachine,
            gamePortAvailableOnMachine,
          });
          
          // Új port generálása
          const { generateServerPort } = await import('./server-provisioning');
          const newQueryPort = await generateServerPort(server.gameType, machine.id);
          const newBeaconPort = newQueryPort + 7223;
          const newGamePort = newQueryPort + 10000;
          
          // Frissítjük az adatbázisban
          await withRetry(async () => {
            const serverForConfig = await prisma.server.findUnique({
              where: { id: task.serverId },
              select: { configuration: true },
            });
            
            const currentConfig = serverForConfig?.configuration 
              ? (typeof serverForConfig.configuration === 'string' 
                  ? JSON.parse(serverForConfig.configuration) 
                  : serverForConfig.configuration)
              : {};
            
            const updatedConfig = {
              ...currentConfig,
              queryPort: newQueryPort,
              beaconPort: newBeaconPort,
              gamePort: newGamePort,
            };
            
            await prisma.server.update({
              where: { id: task.serverId },
              data: {
                port: newQueryPort,
                queryPort: newQueryPort,
                beaconPort: newBeaconPort,
                configuration: updatedConfig,
              },
            });
          });
          
          // Frissítjük a serverPort változót
          serverPort = newQueryPort;
          
          logger.info('Ports regenerated on start', {
            serverId: task.serverId,
            newQueryPort,
            newBeaconPort,
            newGamePort,
          });
        }
      }
      
      // Biztosítjuk, hogy a szükséges mezők létezzenek - a szerver adatbázisból származó adatokat használjuk
      // Ha van GamePackage, akkor az adatait használjuk (ezek a fizikai limitációk)
      const finalConfig = {
        port: serverPort || 25565,
        maxPlayers: config.maxPlayers || server.maxPlayers || 10,
        name: config.name || server.name || `Server-${server.id}`,
        ram: gamePackage ? gamePackage.ram : (config.ram || 2048), // GamePackage RAM-ja vagy config RAM-ja
        cpuCores: gamePackage ? gamePackage.cpuCores : (config.cpuCores || 1), // GamePackage CPU-ja vagy config CPU-ja
        world: config.world || 'Dedicated',
        password: config.password || '',
        adminPassword: config.adminPassword || 'changeme',
        map: config.map || 'TheIsland',
        clusterId: config.clusterId || '',
        gamePackageId: config.gamePackageId || undefined,
        ...config, // Meglévő config mezők megtartása (felülírja az alapértelmezetteket, ha vannak)
      };
      
      // Ellenőrizzük, hogy a finalConfig tartalmazza-e a szükséges mezőket
      if (!finalConfig || typeof finalConfig !== 'object') {
        throw new Error('Config objektum nem hozható létre');
      }
      
      if (!finalConfig.port || typeof finalConfig.port !== 'number') {
        throw new Error(`Érvénytelen port: ${finalConfig.port}`);
      }
      
      if (!finalConfig.name || typeof finalConfig.name !== 'string') {
        throw new Error(`Érvénytelen name: ${finalConfig.name}`);
      }
      
      // Paths objektum előkészítése - ha nincs, akkor undefined
      const paths = task.agent?.paths ? {
        isARK: task.agent.paths.isARK || false,
        sharedPath: task.agent.paths.sharedPath || null,
        serverPath: task.agent.paths.serverPath || `/opt/servers/${server.id}`,
      } : undefined;
      
      await createSystemdServiceForServer(
        server.id,
        server.gameType as any,
        gameConfig,
        finalConfig,
        machine,
        paths
      );
    } catch (error: any) {
      // Ha a service generálás sikertelen, próbáljuk meg továbbra is indítani
      console.warn('Systemd service újragenerálása sikertelen, folytatás a meglévő service-szel:', error.message);
      console.warn('Hiba részletei:', {
        serverId: server.id,
        gameType: server.gameType,
        hasConfiguration: !!server.configuration,
        serverPort: server.port,
        serverMaxPlayers: server.maxPlayers,
        serverName: server.name,
        error: error.message,
        stack: error.stack,
      });
    }
    
    // Systemd service indítása
    const serviceName = `server-${task.serverId}`;
    
    // Először indítjuk
    const startResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `systemctl start ${serviceName} 2>/dev/null || true`
    );

    // Ellenőrizzük a státuszt
    const statusResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `systemctl is-active ${serviceName} 2>&1 || echo "inactive"`
    );

    const isActive = statusResult.stdout.trim() === 'active';

    // Szűrjük ki a nem-kritikus stderr üzeneteket (pl. "Permanently added")
    const criticalError = startResult.stderr && 
      !startResult.stderr.includes('Permanently added') &&
      !startResult.stderr.includes('Warning:') &&
      startResult.exitCode !== 0 &&
      !isActive;

    if (isActive) {
      // Szerver státusz frissítése ONLINE-ra
      await prisma.server.update({
        where: { id: task.serverId },
        data: { status: 'ONLINE' },
      });
    } else if (criticalError) {
      throw new Error(`Szerver indítás sikertelen: ${startResult.stderr || statusResult.stderr || 'Ismeretlen hiba'}`);
    } else {
      // Ha nem aktív, de nincs kritikus hiba, akkor próbáljuk meg még egyszer
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryStatus = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `systemctl is-active ${serviceName} 2>&1 || echo "inactive"`
      );
      
      if (retryStatus.stdout.trim() === 'active') {
        await prisma.server.update({
          where: { id: task.serverId },
          data: { status: 'ONLINE' },
        });
      } else {
        throw new Error(`Szerver indítás sikertelen: A szerver nem indult el`);
      }
    }
  } else {
    throw new Error('Agent vagy machine nem található');
  }

  return {
    message: 'Szerver sikeresen elindítva',
    status: 'ONLINE',
  };
}

/**
 * Stop task végrehajtása - szerver leállítása
 */
async function executeStopTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a leállításhoz');
  }

  const server = task.server;

  // Szerver státusz frissítése STOPPING-re
  await prisma.server.update({
    where: { id: task.serverId },
    data: { status: 'STOPPING' },
  });

  // SSH kapcsolat az agent géppel és systemd service leállítása
  if (task.agent && task.agent.machine) {
    const { executeSSHCommand } = await import('./ssh-client');
    const machine = task.agent.machine;
    
    // Systemd service leállítása
    const serviceName = `server-${task.serverId}`;
    
    // Először csak leállítjuk
    const stopResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `systemctl stop ${serviceName} 2>/dev/null || true`
    );

    // Ellenőrizzük a státuszt
    const statusResult = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `systemctl is-active ${serviceName} 2>&1 || echo "inactive"`
    );

    const isInactive = statusResult.stdout.trim() === 'inactive' || 
                       statusResult.stdout.trim() === '' ||
                       statusResult.stdout.includes('inactive');

    // Szűrjük ki a nem-kritikus stderr üzeneteket (pl. "Permanently added")
    const criticalError = stopResult.stderr && 
      !stopResult.stderr.includes('Permanently added') &&
      !stopResult.stderr.includes('Warning:') &&
      stopResult.exitCode !== 0 &&
      !isInactive;

    if (isInactive || (!criticalError && stopResult.exitCode === 0)) {
      // Szerver státusz frissítése OFFLINE-ra
      await prisma.server.update({
        where: { id: task.serverId },
        data: { status: 'OFFLINE' },
      });
    } else {
      // Ha kritikus hiba van, dobjunk hibát
      throw new Error(`Szerver leállítás sikertelen: ${stopResult.stderr || statusResult.stderr || 'Ismeretlen hiba'}`);
    }
  } else {
    throw new Error('Agent vagy machine nem található');
  }

  return {
    message: 'Szerver sikeresen leállítva',
    status: 'OFFLINE',
  };
}

/**
 * Restart task végrehajtása - szerver újraindítása
 */
async function executeRestartTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges az újraindításhoz');
  }

  // Először leállítás
  await executeStopTask(task);

  // Várás
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Aztán indítás
  await executeStartTask(task);

  return {
    message: 'Szerver sikeresen újraindítva',
    status: 'ONLINE',
  };
}

/**
 * Update task végrehajtása - szerver frissítése
 */
async function executeUpdateTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a frissítéshez');
  }

  // Szerver leállítása
  await executeStopTask(task);
  
  // Frissítés letöltése és telepítése SSH-n keresztül
  if (task.agent && task.agent.machine) {
    const { executeSSHCommand } = await import('./ssh-client');
    const machine = task.agent.machine;
    const server = task.server;
    
    if (!server) {
      throw new Error('Szerver nem található');
    }

    // Game szerver típus alapján frissítés
    const gameType = server.gameType;
    const serverPath = (server.configuration as any)?.instancePath || 
                      (server.configuration as any)?.sharedPath || 
                      `/opt/servers/${task.serverId}`;

    // SteamCMD frissítés (ha Steam játék)
    if (['ARK_EVOLVED', 'ARK_ASCENDED', 'RUST', 'VALHEIM', 'SEVEN_DAYS_TO_DIE', 'CONAN_EXILES', 'DAYZ', 'PALWORLD'].includes(gameType)) {
      const { ALL_GAME_SERVER_CONFIGS } = await import('./game-server-configs');
      const gameConfig = ALL_GAME_SERVER_CONFIGS[gameType as GameType];
      
      if (gameConfig && gameConfig.steamAppId) {
        // SteamCMD frissítés
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `cd ${serverPath} && ./steamcmd.sh +force_install_dir ${serverPath} +login anonymous +app_update ${gameConfig.steamAppId} validate +quit`
        );
      }
    }

    // Szerver indítása
    await executeStartTask(task);
  } else {
    throw new Error('Agent vagy machine nem található');
  }

  return {
    message: 'Szerver sikeresen frissítve',
  };
}

/**
 * Backup task végrehajtása - szerver backup készítése
 */
async function executeBackupTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a backup-hoz');
  }

  // Valós backup készítése SSH-n keresztül
  const { createServerBackup } = await import('./backup-storage');
  const backupName = task.command?.name || `backup-${Date.now()}`;
  const backupResult = await createServerBackup(task.serverId, backupName);

  if (!backupResult.success) {
    throw new Error(backupResult.error || 'Backup készítési hiba');
  }

  return {
    message: 'Backup sikeresen létrehozva',
    backupPath: backupResult.backupPath,
  };
}

/**
 * Delete task végrehajtása - szerver törlése
 */
async function executeDeleteTask(task: any): Promise<any> {
  if (!task.serverId || !task.agentId) {
    throw new Error('Szerver és agent ID szükséges a törléshez');
  }

  // Szerver leállítása először
  try {
    await executeStopTask(task);
  } catch (error) {
    // Ha már le van állítva, folytatjuk
    logger.warn('Server already stopped or stop failed', { serverId: task.serverId, error });
  }

  // Fájlok törlése SSH-n keresztül
  if (task.agent && task.agent.machine) {
    const { executeSSHCommand } = await import('./ssh-client');
    const machine = task.agent.machine;
    const server = task.server;
    
    if (!server) {
      throw new Error('Szerver nem található');
    }

    // Systemd service törlése
    const serviceName = `server-${task.serverId}`;
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `systemctl stop ${serviceName} 2>/dev/null || true && systemctl disable ${serviceName} 2>/dev/null || true && rm -f /etc/systemd/system/${serviceName}.service && systemctl daemon-reload`
    );

    // Szerver fájlok törlése
    const serverPath = (server.configuration as any)?.instancePath || 
                      (server.configuration as any)?.sharedPath || 
                      `/opt/servers/${task.serverId}`;
    
    // Csak az instance mappát töröljük, ne a shared-et (ARK esetén)
    if (serverPath.includes('/instances/')) {
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `rm -rf ${serverPath}`
      );
    } else {
      // Nem ARK, teljes mappa törlése
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `rm -rf ${serverPath}`
      );
    }
  } else {
    throw new Error('Agent vagy machine nem található');
  }

  // Szerver törlése az adatbázisból (cascade miatt automatikusan törlődnek a kapcsolatok)
  // Ezt a route-ban kell kezelni, mert itt már nincs task.server

  return {
    message: 'Szerver sikeresen törölve',
  };
}

/**
 * Várakozó feladatok feldolgozása
 */
export async function processPendingTasks(): Promise<void> {
  const pendingTasks = await prisma.task.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      agent: true,
      server: true,
    },
    take: 10, // Egyszerre maximum 10 feladat
    orderBy: { createdAt: 'asc' },
  });

  for (const task of pendingTasks) {
    try {
      await executeTask(task.id);
    } catch (error) {
      logger.error(`Task ${task.id} végrehajtási hiba`, error as Error, {
        taskId: task.id,
      });
    }
  }
}
