/**
 * Játék telepítések és indítások tesztelése
 * 
 * Ez a script teszteli, hogy minden támogatott játék típus telepítése és indítása megfelelően működik-e.
 * 
 * Használat:
 *   npx tsx scripts/test-game-installations.ts
 * 
 * Vagy Node.js-ben:
 *   node --loader ts-node/esm scripts/test-game-installations.ts
 */

import { prisma } from '../lib/prisma';
import { GameType } from '@prisma/client';
import { ALL_GAME_SERVER_CONFIGS } from '../lib/game-server-configs';
import { installGameServer } from '../lib/game-server-installer';
import { executeTask } from '../lib/task-executor';
import { logger } from '../lib/logger';

// Színek konzolhoz
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  gameType: GameType;
  installation: {
    success: boolean;
    error?: string;
    serverId?: string;
  };
  start?: {
    success: boolean;
    error?: string;
  };
}

/**
 * Ellenőrzi, hogy van-e elérhető gép és agent
 */
async function checkAvailableResources(): Promise<{ available: boolean; error?: string }> {
  try {
    const machines = await prisma.serverMachine.findMany({
      where: { status: 'ONLINE' },
      include: {
        agents: {
          where: { status: 'ONLINE' },
          take: 1,
        },
      },
    });

    const machineWithAgent = machines.find(m => m.agents.length > 0);

    if (!machineWithAgent) {
      return {
        available: false,
        error: 'Nincs elérhető gép vagy agent a teszteléshez',
      };
    }

    return { available: true };
  } catch (error: any) {
    return {
      available: false,
      error: `Hiba az erőforrások ellenőrzése során: ${error.message}`,
    };
  }
}

/**
 * Teszt felhasználó létrehozása vagy lekérése
 */
async function getOrCreateTestUser(): Promise<string> {
  const testEmail = 'test@zedingaming.test';
  
  let user = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
        emailVerified: new Date(),
      },
    });
  }

  return user.id;
}

/**
 * Teszt szerver létrehozása
 */
async function createTestServer(
  userId: string,
  gameType: GameType
): Promise<{ serverId: string; machineId: string; agentId: string }> {
  // Legjobb gép keresése
  const machines = await prisma.serverMachine.findMany({
    where: { status: 'ONLINE' },
    include: {
      agents: {
        where: { status: 'ONLINE' },
        take: 1,
      },
    },
  });

  const machineWithAgent = machines.find(m => m.agents.length > 0);
  if (!machineWithAgent || machineWithAgent.agents.length === 0) {
    throw new Error('Nincs elérhető gép vagy agent');
  }

  const agent = machineWithAgent.agents[0];

  // Port generálása
  const { generateServerPort } = await import('../lib/server-provisioning');
  const port = await generateServerPort(gameType, machineWithAgent.id);

  // Szerver létrehozása
  const server = await prisma.server.create({
    data: {
      userId,
      name: `Test-${gameType}-${Date.now()}`,
      gameType,
      maxPlayers: 10,
      status: 'OFFLINE',
      port,
      machineId: machineWithAgent.id,
      agentId: agent.id,
      configuration: {
        test: true,
        testTimestamp: new Date().toISOString(),
      },
    },
  });

  return {
    serverId: server.id,
    machineId: machineWithAgent.id,
    agentId: agent.id,
  };
}

/**
 * Játék telepítés tesztelése
 */
async function testInstallation(
  gameType: GameType,
  serverId: string
): Promise<{ success: boolean; error?: string }> {
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

    if (!server || !server.agent) {
      return {
        success: false,
        error: 'Szerver vagy agent nem található',
      };
    }

    const gameConfig = ALL_GAME_SERVER_CONFIGS[gameType];
    if (!gameConfig) {
      return {
        success: false,
        error: `Játék konfiguráció nem található: ${gameType}`,
      };
    }

    // Telepítés
    const result = await installGameServer(serverId, gameType, {
      maxPlayers: server.maxPlayers,
      ram: 2048, // 2GB RAM teszteléshez
      port: server.port || 25565,
      name: server.name,
    }, {
      writeProgress: true, // Progress fájlok írása
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Telepítés sikertelen',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba',
    };
  }
}

/**
 * Játék indítás tesztelése
 */
async function testStart(
  serverId: string
): Promise<{ success: boolean; error?: string }> {
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

    if (!server || !server.agent) {
      return {
        success: false,
        error: 'Szerver vagy agent nem található',
      };
    }

    // Task létrehozása
    const task = await prisma.task.create({
      data: {
        agentId: server.agentId!,
        serverId: server.id,
        type: 'START',
        status: 'PENDING',
        command: {
          action: 'start',
          serverId: server.id,
        },
      },
    });

    // Task végrehajtása
    await executeTask(task.id);

    // Várás a szerver indítására
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Státusz ellenőrzése
    const updatedServer = await prisma.server.findUnique({
      where: { id: serverId },
    });

    if (updatedServer?.status === 'ONLINE') {
      return { success: true };
    } else if (updatedServer?.status === 'ERROR') {
      return {
        success: false,
        error: 'Szerver ERROR státuszban van',
      };
    } else {
      return {
        success: false,
        error: `Szerver státusz: ${updatedServer?.status || 'UNKNOWN'}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba',
    };
  }
}

/**
 * Teszt szerver törlése
 */
async function cleanupTestServer(serverId: string): Promise<void> {
  try {
    // Szerver leállítása
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

    if (server && server.agent) {
      try {
        const { executeSSHCommand } = await import('../lib/ssh-client');
        const serviceName = `server-${serverId}`;
        
        await executeSSHCommand(
          {
            host: server.agent.machine.ipAddress,
            port: server.agent.machine.sshPort,
            user: server.agent.machine.sshUser,
            keyPath: server.agent.machine.sshKeyPath || undefined,
          },
          `systemctl stop ${serviceName} 2>/dev/null || true && systemctl disable ${serviceName} 2>/dev/null || true && rm -f /etc/systemd/system/${serviceName}.service && systemctl daemon-reload`
        );

        // Szerver fájlok törlése
        const serverPath = (server.configuration as any)?.instancePath || 
                          (server.configuration as any)?.sharedPath || 
                          `/opt/servers/${serverId}`;
        
        if (serverPath.includes('/instances/')) {
          await executeSSHCommand(
            {
              host: server.agent.machine.ipAddress,
              port: server.agent.machine.sshPort,
              user: server.agent.machine.sshUser,
              keyPath: server.agent.machine.sshKeyPath || undefined,
            },
            `rm -rf ${serverPath}`
          );
        } else {
          await executeSSHCommand(
            {
              host: server.agent.machine.ipAddress,
              port: server.agent.machine.sshPort,
              user: server.agent.machine.sshUser,
              keyPath: server.agent.machine.sshKeyPath || undefined,
            },
            `rm -rf ${serverPath}`
          );
        }
      } catch (error) {
        console.warn(`Hiba a szerver törlése során: ${error}`);
      }
    }

    // Szerver törlése az adatbázisból
    await prisma.server.delete({
      where: { id: serverId },
    });
  } catch (error) {
    console.warn(`Hiba a teszt szerver törlése során: ${error}`);
  }
}

/**
 * Fő teszt függvény
 */
async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Játék Telepítések és Indítások Tesztelése                ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Adatbázis kapcsolat ellenőrzése
  try {
    await prisma.$connect();
    console.log(`${colors.green}✓ Adatbázis kapcsolat sikeres${colors.reset}\n`);
  } catch (error: any) {
    console.log(`${colors.red}❌ Adatbázis kapcsolat sikertelen: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Kérjük, ellenőrizd a DATABASE_URL környezeti változót!${colors.reset}\n`);
    process.exit(1);
  }

  // Erőforrások ellenőrzése
  console.log(`${colors.blue}[1/4]${colors.reset} Erőforrások ellenőrzése...`);
  const resourcesCheck = await checkAvailableResources();
  if (!resourcesCheck.available) {
    console.log(`${colors.red}❌ ${resourcesCheck.error}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Kérjük, ellenőrizd, hogy van-e elérhető szerver gép és agent!${colors.reset}\n`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`${colors.green}✓ Erőforrások elérhetők${colors.reset}\n`);

  // Teszt felhasználó létrehozása
  console.log(`${colors.blue}[2/4]${colors.reset} Teszt felhasználó létrehozása...`);
  const userId = await getOrCreateTestUser();
  console.log(`${colors.green}✓ Teszt felhasználó kész${colors.reset}\n`);

  // Támogatott játékok lekérése
  const supportedGames = Object.keys(ALL_GAME_SERVER_CONFIGS) as GameType[];
  console.log(`${colors.blue}[3/4]${colors.reset} ${supportedGames.length} támogatott játék típus található\n`);

  const results: TestResult[] = [];

  // Telepítések tesztelése
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}TELEPÍTÉSEK TESZTELÉSE${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  for (let i = 0; i < supportedGames.length; i++) {
    const gameType = supportedGames[i];
    console.log(`${colors.blue}[${i + 1}/${supportedGames.length}]${colors.reset} ${gameType} telepítés tesztelése...`);

    try {
      // Teszt szerver létrehozása
      const { serverId } = await createTestServer(userId, gameType);

      // Telepítés tesztelése
      const installResult = await testInstallation(gameType, serverId);

      results.push({
        gameType,
        installation: {
          ...installResult,
          serverId: installResult.success ? serverId : undefined,
        },
      });

      if (installResult.success) {
        console.log(`${colors.green}  ✓ Telepítés sikeres${colors.reset}`);
      } else {
        console.log(`${colors.red}  ✗ Telepítés sikertelen: ${installResult.error}${colors.reset}`);
        // Szerver törlése, ha a telepítés sikertelen volt
        await cleanupTestServer(serverId);
      }
    } catch (error: any) {
      console.log(`${colors.red}  ✗ Hiba: ${error.message}${colors.reset}`);
      results.push({
        gameType,
        installation: {
          success: false,
          error: error.message,
        },
      });
    }

    console.log('');
  }

  // Telepítések összefoglalója
  const successfulInstallations = results.filter(r => r.installation.success);
  const failedInstallations = results.filter(r => !r.installation.success);

  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}TELEPÍTÉSEK ÖSSZEFOGLALÓJA${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}Sikeres telepítések: ${successfulInstallations.length}/${results.length}${colors.reset}`);
  console.log(`${colors.red}Sikertelen telepítések: ${failedInstallations.length}/${results.length}${colors.reset}\n`);

  if (failedInstallations.length > 0) {
    console.log(`${colors.red}Sikertelen telepítések:${colors.reset}`);
    for (const result of failedInstallations) {
      console.log(`  - ${result.gameType}: ${result.installation.error}`);
    }
    console.log('');
  }

  // Ha vannak sikeres telepítések, teszteljük az indításokat
  if (successfulInstallations.length > 0) {
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}INDÍTÁSOK TESZTELÉSE${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    for (let i = 0; i < successfulInstallations.length; i++) {
      const result = successfulInstallations[i];
      const serverId = result.installation.serverId!;

      console.log(`${colors.blue}[${i + 1}/${successfulInstallations.length}]${colors.reset} ${result.gameType} indítás tesztelése...`);

      try {
        const startResult = await testStart(serverId);
        result.start = startResult;

        if (startResult.success) {
          console.log(`${colors.green}  ✓ Indítás sikeres${colors.reset}`);
        } else {
          console.log(`${colors.red}  ✗ Indítás sikertelen: ${startResult.error}${colors.reset}`);
        }
      } catch (error: any) {
        console.log(`${colors.red}  ✗ Hiba: ${error.message}${colors.reset}`);
        result.start = {
          success: false,
          error: error.message,
        };
      }

      console.log('');
    }

    // Indítások összefoglalója
    const successfulStarts = successfulInstallations.filter(r => r.start?.success);
    const failedStarts = successfulInstallations.filter(r => r.start && !r.start.success);

    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}INDÍTÁSOK ÖSSZEFOGLALÓJA${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}Sikeres indítások: ${successfulStarts.length}/${successfulInstallations.length}${colors.reset}`);
    console.log(`${colors.red}Sikertelen indítások: ${failedStarts.length}/${successfulInstallations.length}${colors.reset}\n`);

    if (failedStarts.length > 0) {
      console.log(`${colors.red}Sikertelen indítások:${colors.reset}`);
      for (const result of failedStarts) {
        console.log(`  - ${result.gameType}: ${result.start?.error}`);
      }
      console.log('');
    }
  }

  // Teszt szerverek törlése
  console.log(`${colors.blue}[4/4]${colors.reset} Teszt szerverek törlése...`);
  for (const result of results) {
    if (result.installation.serverId) {
      await cleanupTestServer(result.installation.serverId);
    }
  }
  console.log(`${colors.green}✓ Teszt szerverek törölve${colors.reset}\n`);

  // Végső összefoglaló
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  TESZTELÉS BEFEJEZVE                                      ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.green}✓ Telepítések: ${successfulInstallations.length}/${results.length} sikeres${colors.reset}`);
  if (successfulInstallations.length > 0) {
    const successfulStarts = successfulInstallations.filter(r => r.start?.success);
    console.log(`${colors.green}✓ Indítások: ${successfulStarts.length}/${successfulInstallations.length} sikeres${colors.reset}`);
  }

  // Adatbázis kapcsolat bezárása
  await prisma.$disconnect();

  // Kilépési kód
  const allInstallationsSuccessful = failedInstallations.length === 0;
  const allStartsSuccessful = successfulInstallations.length === 0 || 
                               successfulInstallations.every(r => r.start?.success);

  if (allInstallationsSuccessful && allStartsSuccessful) {
    console.log(`\n${colors.green}✓ Minden teszt sikeres!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Néhány teszt sikertelen volt${colors.reset}\n`);
    process.exit(1);
  }
}

// Script futtatása
main().catch(async (error) => {
  console.error(`${colors.red}Váratlan hiba:${colors.reset}`, error);
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors
  }
  process.exit(1);
});

