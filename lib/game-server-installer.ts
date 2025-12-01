/**
 * Game szerver telepítő
 * 30 legnépszerűbb Steam játék támogatása
 * ARK Cluster funkcionalitással
 */

import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from './ssh-client';
import { GameType } from '@prisma/client';
import { ALL_GAME_SERVER_CONFIGS } from './game-server-configs';
import { addServerToCluster, createClusterFolder } from './ark-cluster';
import { logger } from './logger';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { GAME_INSTALLERS } from './games/installers';

// Progress fájl elérési út
function getProgressFilePath(serverId: string): string {
  return join(process.cwd(), 'logs', 'install', `server-${serverId}.progress.json`);
}

function getLogFilePath(serverId: string): string {
  return join(process.cwd(), 'logs', 'install', `server-${serverId}.log`);
}

// Progress írása
async function writeInstallProgress(serverId: string, progress: {
  status: string;
  message: string;
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  error?: string;
}) {
  try {
    const progressPath = getProgressFilePath(serverId);
    const progressDir = join(process.cwd(), 'logs', 'install');
    
    // Könyvtár létrehozása, ha nincs
    if (!existsSync(progressDir)) {
      await mkdir(progressDir, { recursive: true });
    }
    
    const progressWithTimestamp = {
      ...progress,
      timestamp: new Date().toISOString(),
    };
    await writeFile(progressPath, JSON.stringify(progressWithTimestamp, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Error writing install progress:', error.message);
  }
}

// Log írása
async function appendInstallLog(serverId: string, message: string) {
  try {
    const logPath = getLogFilePath(serverId);
    const logDir = join(process.cwd(), 'logs', 'install');
    
    // Könyvtár létrehozása, ha nincs
    if (!existsSync(logDir)) {
      await mkdir(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    await appendFile(logPath, logMessage);
  } catch (error: any) {
    console.error('Error writing install log:', error.message);
  }
}

/**
 * Game szerver telepítése
 */
export async function installGameServer(
  serverId: string,
  gameType: GameType,
  config: {
    maxPlayers: number;
    ram: number;
    port: number;
    name: string;
    unlimitedRam?: boolean; // Ha true, akkor korlátlan RAM
    world?: string;
    password?: string;
    adminPassword?: string;
    clusterId?: string; // ARK Cluster ID (ha van)
    map?: string; // ARK map (TheIsland, TheCenter, Ragnarok, stb.)
  },
  options?: {
    writeProgress?: boolean; // Ha true, akkor progress fájlokat ír
  }
): Promise<{ success: boolean; error?: string }> {
  const writeProgress = options?.writeProgress ?? false;
  
  try {
    logger.info('Installing game server', {
      serverId,
      gameType,
      config: { ...config, password: '***' },
    });
    
    if (writeProgress) {
      await writeInstallProgress(serverId, {
        status: 'starting',
        message: 'Telepítés indítása...',
        progress: 0,
      });
      await appendInstallLog(serverId, 'Game szerver telepítés indítása...');
    }

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
        user: true,
      },
    });

    if (!server || !server.agent) {
      const error = 'Szerver vagy agent nem található';
      if (writeProgress) {
        await writeInstallProgress(serverId, {
          status: 'error',
          message: error,
          progress: 0,
          error,
        });
        await appendInstallLog(serverId, `HIBA: ${error}`);
      }
      return {
        success: false,
        error,
      };
    }

    const machine = server.agent.machine;
    const gameConfig = ALL_GAME_SERVER_CONFIGS[gameType];

    if (!gameConfig || gameType === 'OTHER') {
      const error = 'Játék típus nem támogatott automatikus telepítéshez';
      if (writeProgress) {
        await writeInstallProgress(serverId, {
          status: 'error',
          message: error,
          progress: 0,
          error,
        });
        await appendInstallLog(serverId, `HIBA: ${error}`);
      }
      return {
        success: false,
        error,
      };
    }

    // Ha a szervernek van portja az adatbázisban, azt használjuk (generált port)
    // Különben a config.port értéket használjuk
    if (server.port && !config.port) {
      config.port = server.port;
    }
    
    if (writeProgress) {
      await writeInstallProgress(serverId, {
        status: 'in_progress',
        message: 'Szerver adatok ellenőrzése...',
        progress: 5,
        currentStep: 'check',
        totalSteps: 6,
      });
      await appendInstallLog(serverId, `Szerver adatok ellenőrizve: ${gameType}`);
    }

    // ARK játékoknál közös fájlokat használunk felhasználó + szervergép kombinációként
    // Minden szervergépen külön shared mappa van felhasználónként
    const isARK = gameType === 'ARK_EVOLVED' || gameType === 'ARK_ASCENDED';
    const { getARKSharedPath } = await import('./ark-cluster');
    const sharedPath = isARK ? getARKSharedPath(server.userId, machine.id) : null;
    const serverPath = isARK ? `${sharedPath}/instances/${serverId}` : `/opt/servers/${serverId}`;

    // Szerver könyvtár létrehozása
    if (writeProgress) {
      await writeInstallProgress(serverId, {
        status: 'in_progress',
        message: 'Szerver könyvtár létrehozása...',
        progress: 10,
        currentStep: 'directory',
        totalSteps: 6,
      });
      await appendInstallLog(serverId, `Szerver könyvtár létrehozása: ${serverPath}`);
    }
    
    // Könyvtár létrehozása megfelelő jogosultságokkal
    // Először biztosítjuk, hogy az /opt/servers/ könyvtár létezik
    // A SteamCMD root-ként fut, ezért biztosítjuk, hogy írni tudjon
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `mkdir -p /opt/servers && chmod 755 /opt/servers && chown root:root /opt/servers && mkdir -p ${serverPath} && chmod -R 755 ${serverPath} && chown -R root:root ${serverPath}`
    );
    
    if (writeProgress) {
      await appendInstallLog(serverId, 'Szerver könyvtár létrehozva megfelelő jogosultságokkal');
    }

    // Függőségek telepítése
    if (gameConfig.requiresJava) {
      if (writeProgress) {
        await writeInstallProgress(serverId, {
          status: 'in_progress',
          message: 'Java telepítése...',
          progress: 15,
          currentStep: 'dependencies',
          totalSteps: 6,
        });
        await appendInstallLog(serverId, 'Java telepítés ellenőrzése...');
      }
      const javaResult = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `which java || (apt-get update && apt-get install -y openjdk-17-jre-headless)`
      );
      if (writeProgress) {
        await appendInstallLog(serverId, `Java telepítés eredmény: ${javaResult.stdout || 'OK'}`);
      }
    }

    if (gameConfig.requiresWine) {
      if (writeProgress) {
        await appendInstallLog(serverId, 'Wine telepítés ellenőrzése...');
      }
      const wineResult = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `which wine || (apt-get update && apt-get install -y wine64)`
      );
      if (writeProgress) {
        await appendInstallLog(serverId, `Wine telepítés eredmény: ${wineResult.stdout || 'OK'}`);
      }
    }

    // 7 Days to Die specifikus függőségek (Unity motor audio támogatás)
    if (gameType === 'SEVEN_DAYS_TO_DIE') {
      if (writeProgress) {
        await appendInstallLog(serverId, '7 Days to Die audio könyvtárak ellenőrzése...');
      }
      const sevenDaysDepsCheck = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `dpkg -l | grep -E 'libpulse0|libasound2|libatomic1' | wc -l`
      );
      const installedCount = parseInt(sevenDaysDepsCheck.stdout?.trim() || '0');
      if (installedCount < 3) {
        if (writeProgress) {
          await appendInstallLog(serverId, '7 Days to Die audio könyvtárak telepítése (hiányzó függőségek)...');
        }
        const sevenDaysDepsResult = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `apt-get update && apt-get install -y libpulse0 libpulse-dev libasound2 libatomic1`
        );
        if (writeProgress) {
          await appendInstallLog(serverId, `7 Days to Die függőségek telepítés eredmény: ${sevenDaysDepsResult.stdout || 'OK'}`);
        }
      } else {
        if (writeProgress) {
          await appendInstallLog(serverId, '7 Days to Die audio könyvtárak már telepítve vannak');
        }
      }
    }

    // Telepítési script generálása (csak ha nem ARK, vagy ha még nincs telepítve)
    if (!isARK || !(await checkARKSharedInstallation(server.userId, machine.id, gameType, machine))) {
      // Ha a gameConfig.installScript üres, betöltjük a GAME_INSTALLERS-ből
      let installScript = gameConfig.installScript || GAME_INSTALLERS[gameType] || '';
      
      // SteamCMD elérési út beállítása (globális SteamCMD használata)
      const globalSteamCMD = '/opt/steamcmd/steamcmd.sh';
      
      // Eltávolítjuk a SteamCMD letöltési részeket (mert már globálisan telepítve van)
      // Több soros if blokkok eltávolítása (egyszerűbb regex)
      installScript = installScript.replace(/if \[ ! -f steamcmd\.sh \]; then[\s\S]*?fi\s*/g, '');
      installScript = installScript.replace(/if \[ ! -f \.\.\/steamcmd\.sh \]; then[\s\S]*?fi\s*/g, '');
      
      // SteamCMD letöltési sorok eltávolítása
      installScript = installScript.replace(/wget.*steamcmd.*\n/g, '');
      installScript = installScript.replace(/tar.*steamcmd.*\n/g, '');
      installScript = installScript.replace(/echo.*[Dd]ownloading.*[Ss]teamCMD.*\n/gi, '');
      
      // Cseréljük le a lokális steamcmd.sh hivatkozásokat a globálisra
      // Először a relatív útvonalakat
      installScript = installScript.replace(/\.\/steamcmd\.sh/g, globalSteamCMD);
      // Aztán a sima steamcmd.sh hivatkozásokat (ha nincs előtte /opt/steamcmd/)
      installScript = installScript.replace(/([^\/]|^)steamcmd\.sh/g, `$1${globalSteamCMD}`);
      
      // Ellenőrizzük, hogy a globális SteamCMD létezik-e
      const steamcmdCheck = `# Globális SteamCMD ellenőrzése
STEAMCMD="${globalSteamCMD}"
if [ ! -f "$STEAMCMD" ]; then
  echo "HIBA: Globális SteamCMD nem található: $STEAMCMD" >&2
  echo "Kérjük, telepítsd a SteamCMD-et az agent telepítés során!" >&2
  exit 1
fi
`;
      // Hozzáadjuk az ellenőrzést a script elejéhez (set -e után)
      installScript = installScript.replace(/(set -e\n)/, `$1${steamcmdCheck}`);
      
      // ARK-nál a közös path-ot használjuk
      if (isARK && sharedPath) {
        installScript = installScript.replace(/\/opt\/servers\/\{serverId\}/g, sharedPath);
      }
      
      // Placeholder-ek cseréje - biztosítjuk, hogy a config mezők létezzenek
      // The Forest esetén az adatbázisból kinyerjük az összes portot
      let port = config.port || 25565;
      let queryPort = gameConfig.queryPort || port + 1;
      let steamPeerPort: number | undefined;
      
      // The Forest esetén az adatbázisból kinyerjük a portokat
      if (gameType === 'THE_FOREST') {
        const serverWithPorts = await prisma.server.findUnique({
          where: { id: serverId },
          select: { port: true, queryPort: true, steamPeerPort: true, configuration: true },
        });
        
        // Portok az adatbázisból
        port = serverWithPorts?.port || config.port || 27015;
        queryPort = serverWithPorts?.queryPort || (port + 1);
        steamPeerPort = serverWithPorts?.steamPeerPort || (queryPort + 1);
        
        // Konfigurációs értékek a configuration-ből
        const serverConfig = serverWithPorts?.configuration ? (typeof serverWithPorts.configuration === 'string' ? JSON.parse(serverWithPorts.configuration) : serverWithPorts.configuration) : {};
        const difficulty = serverConfig.difficulty || 'Normal';
        const inittype = serverConfig.inittype || serverConfig.initType || 'Continue';
        const slot = serverConfig.slot || 3;
        
        installScript = installScript
          .replace(/{serverId}/g, serverId)
          .replace(/{port}/g, port.toString())
          .replace(/{queryPort}/g, queryPort.toString())
          .replace(/{steamPeerPort}/g, steamPeerPort.toString())
          .replace(/{maxPlayers}/g, (config.maxPlayers || 10).toString())
          .replace(/{ram}/g, (config.ram || 2048).toString())
          .replace(/{name}/g, config.name || `Server-${serverId}`)
          .replace(/{world}/g, config.world || 'Dedicated')
          .replace(/{password}/g, config.password || '')
          .replace(/{adminPassword}/g, config.adminPassword || 'changeme')
          .replace(/{difficulty}/g, difficulty)
          .replace(/{inittype}/g, inittype)
          .replace(/{slot}/g, slot.toString());
      } else {
        // Más játékoknál az eredeti logika
        const maxPlayers = config.maxPlayers || 10;
        const ram = config.ram || 2048;
        const name = config.name || `Server-${serverId}`;
        
        installScript = installScript
          .replace(/{serverId}/g, serverId)
          .replace(/{port}/g, port.toString())
          .replace(/{maxPlayers}/g, maxPlayers.toString())
          .replace(/{ram}/g, ram.toString())
          .replace(/{name}/g, name)
          .replace(/{world}/g, config.world || 'Dedicated')
          .replace(/{password}/g, config.password || '')
          .replace(/{adminPassword}/g, config.adminPassword || 'changeme')
          .replace(/{queryPort}/g, queryPort.toString());
      }

      // Script fájl létrehozása és futtatása
      const scriptPath = `/tmp/install-${isARK ? `ark-shared-${server.userId}` : serverId}.sh`;
      const logPath = `/tmp/install-${isARK ? `ark-shared-${server.userId}` : serverId}.log`;
      
      if (writeProgress) {
        await writeInstallProgress(serverId, {
          status: 'in_progress',
          message: 'Telepítési script létrehozása...',
          progress: 20,
          currentStep: 'script',
          totalSteps: 6,
        });
        await appendInstallLog(serverId, `Telepítési script előkészítése: ${scriptPath}`);
      }
      
      logger.info('Creating installation script', {
        serverId,
        gameType,
        scriptPath,
        logPath,
      });

      // Script fájl létrehozása
      const createScriptResult = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `cat > ${scriptPath} << 'EOF'\n${installScript}\nEOF`
      );

      if (createScriptResult.exitCode !== 0) {
        const error = `Nem sikerült létrehozni a telepítési scriptet: ${createScriptResult.stderr}`;
        logger.error('Failed to create installation script', new Error(createScriptResult.stderr || 'Unknown error'), {
          serverId,
          gameType,
          scriptPath,
          stderr: createScriptResult.stderr,
        });
        if (writeProgress) {
          await writeInstallProgress(serverId, {
            status: 'error',
            message: error,
            progress: 20,
            error,
          });
          await appendInstallLog(serverId, `HIBA: ${error}`);
        }
        throw new Error(error);
      }
      
      if (writeProgress) {
        await appendInstallLog(serverId, 'Telepítési script létrehozva');
      }

      // Script futtatása loggal
      if (writeProgress) {
        await writeInstallProgress(serverId, {
          status: 'in_progress',
          message: 'Játék fájlok letöltése SteamCMD-vel (ez eltarthat néhány percig)...',
          progress: 30,
          currentStep: 'download',
          totalSteps: 6,
        });
        await appendInstallLog(serverId, 'Telepítési script futtatása kezdődik...');
        await appendInstallLog(serverId, 'Ez eltarthat néhány percig, kérjük várjon...');
      }
      
      logger.info('Executing installation script', {
        serverId,
        gameType,
        scriptPath,
      });

      // Script futtatása - a logot folyamatosan olvassuk és írjuk a progress fájlba
      const executeResult = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `chmod +x ${scriptPath} && ${scriptPath} > ${logPath} 2>&1; EXIT_CODE=$?; cat ${logPath}; exit $EXIT_CODE`
      );
      
      // Log tartalom hozzáadása a progress loghoz
      if (writeProgress && executeResult.stdout) {
        const logLines = executeResult.stdout.split('\n');
        for (const line of logLines) {
          if (line.trim()) {
            await appendInstallLog(serverId, line);
          }
        }
      }

      // SteamCMD exit code 8 lehet warning, de a fájlok letöltődhetnek
      // Ellenőrizzük a logot, hogy van-e valódi hiba vagy csak warning
      // SSH warning-okat (pl. "Permanently added...") kiszűrjük
      const stderrWithoutSSHWarnings = executeResult.stderr
        ?.split('\n')
        .filter(line => !line.includes('Permanently added') && !line.includes('Warning: Permanently added'))
        .join('\n') || '';
      
      // Ellenőrizzük a SteamCMD hibaüzeneteket (pl. "ERROR! Failed to install app")
      const hasSteamCMDError = executeResult.stdout?.includes('ERROR! Failed to install') ||
                               executeResult.stdout?.includes('ERROR!') ||
                               executeResult.stdout?.includes('Missing configuration') ||
                               executeResult.stdout?.match(/ERROR!.*Failed to install app/i);
      
      // Ellenőrizzük, hogy a bináris fájl létezik-e (7 Days to Die esetén)
      let binaryExists = false;
      if (gameType === 'SEVEN_DAYS_TO_DIE') {
        // Ellenőrizzük több helyen is a fájl létezését
        const binaryCheck = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `if test -f /opt/servers/${serverId}/7DaysToDieServer.x86_64 || test -f /opt/servers/${serverId}/steamapps/common/7\\ Days\\ To\\ Die\\ Dedicated\\ Server/7DaysToDieServer.x86_64 || test -f /opt/servers/${serverId}/steamapps/common/7\\ Days\\ To\\ Die/7DaysToDieServer.x86_64; then echo "exists"; else echo "missing"; fi`
        );
        binaryExists = binaryCheck.stdout?.trim() === 'exists';
        if (!binaryExists && writeProgress) {
          await appendInstallLog(serverId, 'HIBA: 7DaysToDieServer.x86_64 bináris fájl nem található a telepítés után!');
          // Részletesebb ellenőrzés a hibakereséshez
          const lsCheck = await executeSSHCommand(
            {
              host: machine.ipAddress,
              port: machine.sshPort,
              user: machine.sshUser,
              keyPath: machine.sshKeyPath || undefined,
            },
            `ls -la /opt/servers/${serverId}/ | head -20`
          );
          if (lsCheck.stdout) {
            await appendInstallLog(serverId, `Szerver könyvtár tartalma:\n${lsCheck.stdout}`);
          }
        }
      }
      
      const hasRealError = hasSteamCMDError ||
                          !binaryExists ||
                          executeResult.stdout?.includes('ERROR') || 
                          executeResult.stdout?.includes('HIBA') ||
                          stderrWithoutSSHWarnings.includes('ERROR') ||
                          stderrWithoutSSHWarnings.includes('HIBA');
      
      // Ha csak SSH warning-ok vannak a stderr-ben, akkor nem tekintjük hibának
      const onlySSHWarnings = executeResult.stderr && 
                              !stderrWithoutSSHWarnings.trim() && 
                              (executeResult.stderr.includes('Permanently added') || executeResult.stderr.includes('Warning: Permanently added'));
      
      // Ha exit code 8 és nincs valódi hiba a logban, lehet, hogy csak warning
      // De ha van valódi hiba vagy más exit code, akkor hibát dobunk
      // Kivéve, ha csak SSH warning-ok vannak, akkor nem hibát dobunk
      // Fontos: ha a bináris fájl hiányzik, akkor is hibát dobunk
      if ((executeResult.exitCode !== 0 && !onlySSHWarnings && (executeResult.exitCode !== 8 || hasRealError)) || hasRealError) {
        let errorMessage = '';
        if (hasSteamCMDError) {
          errorMessage = `SteamCMD telepítés sikertelen: ${executeResult.stdout?.match(/ERROR!.*/)?.[0] || 'Missing configuration vagy Failed to install app'}`;
        } else if (!binaryExists && gameType === 'SEVEN_DAYS_TO_DIE') {
          errorMessage = `Telepítési script lefutott, de a 7DaysToDieServer.x86_64 bináris fájl nem található. A SteamCMD valószínűleg nem tudta letölteni a szervert.`;
        } else {
          errorMessage = `Telepítési script sikertelen (exit code: ${executeResult.exitCode}): ${stderrWithoutSSHWarnings || executeResult.stdout || 'Ismeretlen hiba'}`;
        }
        
        logger.error('Installation script failed', new Error(executeResult.stderr || executeResult.stdout || 'Unknown error'), {
          serverId,
          gameType,
          scriptPath,
          logPath,
          exitCode: executeResult.exitCode,
          stdout: executeResult.stdout,
          stderr: executeResult.stderr,
          hasSteamCMDError,
          binaryExists,
        });
        
        // Próbáljuk meg lekérni a teljes logot
        try {
          const logResult = await executeSSHCommand(
            {
              host: machine.ipAddress,
              port: machine.sshPort,
              user: machine.sshUser,
              keyPath: machine.sshKeyPath || undefined,
            },
            `cat ${logPath} 2>/dev/null || echo "Log file not found"`
          );
          logger.error('Installation log', undefined, {
            serverId,
            gameType,
            log: logResult.stdout,
          });
          
          if (writeProgress && logResult.stdout) {
            await appendInstallLog(serverId, `\n=== TELJES LOG ===\n${logResult.stdout}\n=== LOG VÉGE ===`);
          }
        } catch (logError) {
          // Ignore log read errors
        }
        
        if (writeProgress) {
          await writeInstallProgress(serverId, {
            status: 'error',
            message: errorMessage,
            progress: 30,
            error: errorMessage,
          });
          await appendInstallLog(serverId, `HIBA: ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
      }

      if (writeProgress) {
        await writeInstallProgress(serverId, {
          status: 'in_progress',
          message: 'Játék fájlok letöltése befejezve',
          progress: 60,
          currentStep: 'download',
          totalSteps: 6,
        });
        await appendInstallLog(serverId, 'Telepítési script sikeresen lefutott');
      }
      
      logger.info('Installation script completed successfully', {
        serverId,
        gameType,
        scriptPath,
      });
    }

    // Konfigurációs fájl létrehozása
    if (writeProgress) {
      await writeInstallProgress(serverId, {
        status: 'in_progress',
        message: 'Konfigurációs fájl létrehozása...',
        progress: 70,
        currentStep: 'config',
        totalSteps: 6,
      });
      await appendInstallLog(serverId, 'Konfigurációs fájl generálása...');
    }
    
    // Port lekérése az adatbázisból, hogy a helyes portot használjuk
    const serverFromDb = await prisma.server.findUnique({
      where: { id: serverId },
      select: { port: true, configuration: true },
    });
    const actualPort = serverFromDb?.port || config.port;
    
    // Configuration JSON feldolgozása (Satisfactory-nál tartalmazza a GamePort-ot és BeaconPort-ot)
    let serverConfiguration: any = {};
    if (serverFromDb?.configuration) {
      try {
        serverConfiguration = typeof serverFromDb.configuration === 'string' 
          ? JSON.parse(serverFromDb.configuration) 
          : serverFromDb.configuration;
      } catch (e) {
        // Ha nem sikerül parse-olni, akkor üres objektum
        serverConfiguration = {};
      }
    }
    
    // Frissítjük a config objektumot a helyes porttal és a configuration adatokkal
    const configWithPort = {
      ...config,
      port: actualPort,
      // Satisfactory-nál a GamePort és BeaconPort a configuration JSON-ből jön
      ...(gameType === 'SATISFACTORY' && serverConfiguration.gamePort ? { gamePort: serverConfiguration.gamePort } : {}),
      ...(gameType === 'SATISFACTORY' && serverConfiguration.beaconPort ? { beaconPort: serverConfiguration.beaconPort } : {}),
    };
    
    const configContent = generateConfigFile(gameType, configWithPort, gameConfig);
    if (configContent) {
      let configPath = gameConfig.configPath;
      
      // ARK-nál az instance path-ot használjuk a konfigurációhoz
      if (isARK && sharedPath) {
        configPath = `${serverPath}/ShooterGame/Saved/Config/LinuxServer/GameUserSettings.ini`;
      } else {
        configPath = configPath.replace(/{serverId}/g, serverId);
      }
      
      // The Forest-nál a save könyvtárat is létrehozzuk
      if (gameType === 'THE_FOREST') {
        const savePath = `${serverPath}/savefilesserver`;
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `mkdir -p ${savePath} && chmod 755 ${savePath} && chown root:root ${savePath}`
        );
        if (writeProgress) {
          await appendInstallLog(serverId, `Save könyvtár létrehozva: ${savePath}`);
        }
      }
      
      // Játék-specifikus config fájl írási logika
      if (gameType === 'SATISFACTORY') {
        // Satisfactory-nál a GameUserSettings.ini fájlt hozzuk létre
        // A konfigurációs mappa: /home/satis/.config/Epic/FactoryGame/Saved/Config/LinuxServer/
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `sudo -u satis mkdir -p $(dirname ${configPath}) && sudo -u satis cat > ${configPath} << 'EOF'\n${configContent}\nEOF`
        );
        
        if (writeProgress) {
          await appendInstallLog(serverId, `Konfigurációs fájl létrehozva: ${configPath}`);
        }
        
        // Satisfactory-nál a Game.ini fájlt is létrehozzuk a port beállítással
        const gameIniPath = configPath.replace('GameUserSettings.ini', 'Game.ini');
        // A port mező a QueryPort-ot tartalmazza (4 számjegyű port, alapértelmezett 7777)
        // A Game.ini fájlban a GamePort-ot kell beállítani, ami QueryPort + 10000
        // Példa: QueryPort 7777 -> GamePort 15777, QueryPort 7778 -> GamePort 15778
        const queryPort = actualPort || 7777; // QueryPort az adatbázisból (4 számjegyű port)
        // GamePort a configuration JSON-ből vagy számítva (QueryPort + 10000)
        const gamePort = serverConfiguration.gamePort || queryPort + 10000;
        const gameIniContent = `[/Script/Engine.GameNetworkManager]
Port=${gamePort}
TotalNetBandwidth=20000
MaxDynamicBandwidth=10000
MinDynamicBandwidth=1000
`;
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `sudo -u satis cat > ${gameIniPath} << 'EOF'\n${gameIniContent}\nEOF`
        );
        if (writeProgress) {
          await appendInstallLog(serverId, `Game.ini fájl létrehozva port beállítással: ${gameIniPath} (QueryPort=${queryPort}, GamePort=${gamePort})`);
        }
        
        // Jogosultságok beállítása a konfigurációs mappán (sfgames csoport írási jog)
        const configDir = `$(dirname ${configPath})`;
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `chown -R satis:sfgames ${configDir} && chmod -R g+w ${configDir} && find ${configDir} -type d -exec chmod g+s {} + || true`
        );
        if (writeProgress) {
          await appendInstallLog(serverId, `Jogosultságok beállítva a konfigurációs mappán: ${configDir}`);
        }
      }
      } else if (gameType === 'SEVEN_DAYS_TO_DIE') {
        // 7 Days to Die-nál a serverconfig.xml fájlt hozzuk létre
        // A szerver felhasználó neve: seven{serverId}
        const serverUser = `seven${serverId}`;
        const sevenDaysConfigPath = gameConfig.configPath.replace(/{serverId}/g, serverId);
        await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `mkdir -p $(dirname ${sevenDaysConfigPath}) && sudo -u ${serverUser} cat > ${sevenDaysConfigPath} << 'EOF'\n${configContent}\nEOF && chown ${serverUser}:sfgames ${sevenDaysConfigPath} && chmod 644 ${sevenDaysConfigPath}`
        );
        
        if (writeProgress) {
          await appendInstallLog(serverId, `Konfigurációs fájl létrehozva: ${sevenDaysConfigPath}`);
        }
    } else if (gameType === 'THE_FOREST') {
      // The Forest-nál a configfilepath kötelező, de ha nincs configContent,
      // akkor is létrehozunk egy üres fájlt, hogy a szerver generáljon egy alapértelmezettet
      let configPath = gameConfig.configPath.replace(/{serverId}/g, serverId);
      const savePath = `${serverPath}/savefilesserver`;
      
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `mkdir -p ${savePath} && chmod 755 ${savePath} && chown root:root ${savePath} && mkdir -p $(dirname ${configPath}) && touch ${configPath} && chmod 644 ${configPath} && chown root:root ${configPath}`
      );
      
      if (writeProgress) {
        await appendInstallLog(serverId, `Save könyvtár és konfigurációs fájl könyvtár létrehozva (üres config fájl, a szerver generál egy alapértelmezettet)`);
      }
    }

    // Szerver konfiguráció mentése az adatbázisba (ARK path-okkal)
    if (isARK && sharedPath) {
      const currentConfig = (server.configuration as any) || {};
      await prisma.server.update({
        where: { id: serverId },
        data: {
          configuration: {
            ...currentConfig,
            instancePath: serverPath,
            sharedPath: sharedPath,
            machineId: machine.id, // Szervergép ID mentése
          },
        },
      });
    }

    // ARK Cluster kezelés
    if ((gameType === 'ARK_EVOLVED' || gameType === 'ARK_ASCENDED') && config.clusterId) {
      // Cluster mappa létrehozása (ha még nincs)
      const clusterResult = await createClusterFolder(config.clusterId);
      if (!clusterResult.success) {
        logger.warn('Failed to create cluster folder', { clusterId: config.clusterId });
      }

      // Szerver hozzáadása cluster-hez
      const addToClusterResult = await addServerToCluster(serverId, config.clusterId, machine);
      if (!addToClusterResult.success) {
        logger.warn('Failed to add server to cluster', {
          serverId,
          clusterId: config.clusterId,
          error: addToClusterResult.error,
        });
      } else {
        logger.info('Server added to ARK cluster', {
          serverId,
          clusterId: config.clusterId,
        });
      }
    }

    // Systemd service létrehozása
    if (writeProgress) {
      await writeInstallProgress(serverId, {
        status: 'in_progress',
        message: 'Systemd service létrehozása...',
        progress: 85,
        currentStep: 'service',
        totalSteps: 6,
      });
      await appendInstallLog(serverId, 'Systemd service létrehozása...');
    }
    
    // Port frissítése a config-ban az adatbázisból lekérdezett porttal
    // Ez biztosítja, hogy a generált port mindig használatban legyen
    const serverFromDbForService = await prisma.server.findUnique({
      where: { id: serverId },
      select: { port: true },
    });
    
    // RAM érték ellenőrzése és konverziója MB-ba, ha szükséges
    // A server.configuration.ram GB-ban van, de a config.ram MB-ban kell legyen
    let ramInMB = config.ram;
    if (server.configuration && (server.configuration as any).ram) {
      const configRam = (server.configuration as any).ram;
      // Ha a config.ram kisebb, mint 1000, akkor valószínűleg GB-ban van (pl. 14 GB)
      // Ha nagyobb, mint 1000, akkor valószínűleg MB-ban van (pl. 14336 MB)
      if (configRam < 1000) {
        // GB-ban van, konvertáljuk MB-ba
        ramInMB = configRam * 1024;
        logger.info('RAM érték konvertálva GB-ból MB-ba', {
          serverId,
          originalRamGB: configRam,
          ramInMB,
        });
      } else {
        // Már MB-ban van
        ramInMB = configRam;
      }
    }
    
    const configWithCorrectPort = {
      ...config,
      port: serverFromDbForService?.port || config.port || actualPort,
      ram: ramInMB, // Biztosítjuk, hogy MB-ban legyen
    };
    
    await createSystemdServiceForServer(serverId, gameType, gameConfig, configWithCorrectPort, machine, {
      isARK,
      sharedPath,
      serverPath,
    });
    
    if (writeProgress) {
      await appendInstallLog(serverId, 'Systemd service létrehozva');
    }

    // Systemd service engedélyezése és indítása
    const serviceName = `server-${serverId}`;
    try {
      if (writeProgress) {
        await appendInstallLog(serverId, `Systemd service engedélyezése és indítása: ${serviceName}`);
      }
      
      // Csak engedélyezzük a service-t, de ne indítsuk el automatikusan
      // A felhasználó majd manuálisan indíthatja el
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `systemctl enable ${serviceName}`
      );
      
      // Ha mégis elindult, leállítjuk
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `systemctl stop ${serviceName} 2>/dev/null || true`
      );
      
      if (writeProgress) {
        await appendInstallLog(serverId, 'Systemd service létrehozva és engedélyezve (nem indult el automatikusan)');
      }
      
      // Tűzfal portok engedélyezése
      await configureFirewallPorts(serverId, gameType, config, machine, gameConfig, writeProgress);
      
      logger.info('Game server service started', {
        serverId,
        gameType,
        serviceName,
      });
    } catch (serviceError: any) {
      if (writeProgress) {
        await appendInstallLog(serverId, `FIGYELMEZETÉS: Systemd service indítása sikertelen: ${serviceError.message}`);
      }
      
      logger.warn('Failed to start game server service', {
        serverId,
        gameType,
        serviceName,
        error: serviceError.message,
      });
      // Nem dobunk hibát, mert a telepítés sikeres volt, csak az indítás nem sikerült
      // A felhasználó később manuálisan is elindíthatja
    }

    if (writeProgress) {
      await writeInstallProgress(serverId, {
        status: 'completed',
        message: 'Telepítés sikeresen befejezve!',
        progress: 100,
        currentStep: 'completed',
        totalSteps: 6,
      });
      await appendInstallLog(serverId, '✓ Game szerver telepítése sikeresen befejezve!');
    }
    
    logger.info('Game server installed successfully', {
      serverId,
      gameType,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Ismeretlen hiba a szerver telepítése során';
    
    if (writeProgress) {
      await writeInstallProgress(serverId, {
        status: 'error',
        message: `Telepítés sikertelen: ${errorMessage}`,
        progress: 0,
        error: errorMessage,
      });
      await appendInstallLog(serverId, `HIBA: ${errorMessage}`);
    }
    
    logger.error('Game server installation error', error as Error, {
      serverId,
      gameType,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Konfigurációs fájl generálása
 */
export function generateConfigFile(
  gameType: GameType,
  config: any,
  gameConfig: any
): string {
  // Biztosítjuk, hogy a config létezik és tartalmazza a szükséges mezőket
  if (!config) {
    throw new Error('Config objektum hiányzik a generateConfigFile függvényben');
  }
  
  const port = config.port || 25565;
  const maxPlayers = config.maxPlayers || 10;
  const name = config.name || 'Server';
  const queryPort = gameConfig.queryPort || port + 1;

  switch (gameType) {
    case 'MINECRAFT':
      return `
server-port=${port}
max-players=${maxPlayers}
online-mode=false
white-list=false
motd=${name}
difficulty=normal
gamemode=survival
      `.trim();

    case 'ARK_EVOLVED':
    case 'ARK_ASCENDED':
      const map = config.map || 'TheIsland';
      return `
[ServerSettings]
ServerAdminPassword=${config.adminPassword || 'changeme'}
MaxPlayers=${maxPlayers}
ServerPassword=${config.password || ''}
ServerName=${name}
${config.clusterId ? `ClusterDirOverride=/mnt/ark-cluster/${config.clusterId}` : ''}
${config.clusterId ? `ClusterId=${config.clusterId}` : ''}

[/Script/ShooterGame.ShooterGameMode]
      `.trim();

    case 'CS2':
    case 'CSGO':
      return `
hostname "${name}"
maxplayers ${maxPlayers}
sv_lan 0
rcon_password "${config.password || 'changeme'}"
      `.trim();

    case 'RUST':
      // Rust szerver konfigurációs fájl (server.cfg)
      // A Rust szerver automatikusan betölti ezt a fájlt a server/ könyvtárból
      const rconPort = queryPort + 1;
      const rconPassword = config.adminPassword || config.password || 'changeme';
      return `
server.hostname "${name}"
server.identity "${name}"
server.maxplayers ${maxPlayers}
server.port ${port}
server.queryport ${queryPort}
rcon.port ${rconPort}
rcon.password "${rconPassword}"
server.seed ${config.seed || Math.floor(Math.random() * 1000000)}
server.worldsize ${config.worldsize || 4000}
server.saveinterval ${config.saveinterval || 600}
      `.trim();

    case 'VALHEIM':
      return `
# Valheim Server Config
# Generated automatically
      `.trim();

    case 'SEVEN_DAYS_TO_DIE':
      const telnetPort = config.telnetPort || queryPort + 1;
      const gameWorld = config.world || config.gameWorld || 'Navezgane';
      const worldSeed = config.worldSeed || config.seed || 'asd123';
      const difficulty = config.difficulty || config.gameDifficulty || '2';
      const lootRespawnDays = config.lootRespawnDays || '7';
      
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<ServerSettings>
    <property name="ServerName" value="${name}"/>
    <property name="ServerPort" value="${port}"/>
    <property name="ServerMaxPlayerCount" value="${maxPlayers}"/>
    <property name="ServerPassword" value="${config.password || ''}"/>
    <property name="ServerVisibility" value="2"/>
    <property name="ServerIsPublic" value="true"/>
    <property name="ServerDescription" value="A 7 Days to Die szerver"/>
    <property name="ServerWebsiteURL" value=""/>
    <property name="GameWorld" value="${gameWorld}"/>
    <property name="WorldGenSeed" value="${worldSeed}"/>
    <property name="WorldGenSize" value="4096"/>
    <property name="GameName" value="My Game"/>
    <property name="GameMode" value="GameModeSurvival"/>
    <property name="Difficulty" value="${difficulty}"/>
    <property name="DayNightLength" value="60"/>
    <property name="DayLightLength" value="18"/>
    <property name="MaxSpawnedZombies" value="60"/>
    <property name="DropOnDeath" value="1"/>
    <property name="DropOnQuit" value="0"/>
    <property name="BedrollDeadZoneSize" value="15"/>
    <property name="BlockDamagePlayer" value="100"/>
    <property name="BlockDamageZombie" value="100"/>
    <property name="XPMultiplier" value="100"/>
    <property name="PlayerSafeZoneLevel" value="5"/>
    <property name="PlayerSafeZoneHours" value="24"/>
    <property name="BuildCreate" value="false"/>
    <property name="AdminFileName" value="serveradmin.xml"/>
    <property name="TelnetEnabled" value="true"/>
    <property name="TelnetPort" value="${telnetPort}"/>
    <property name="TelnetPassword" value=""/>
    <property name="ControlPanelEnabled" value="false"/>
    <property name="ControlPanelPort" value="8080"/>
    <property name="ControlPanelPassword" value=""/>
    <property name="MaxUncoveredMapChunksPerPlayer" value="131072"/>
    <property name="PersistentPlayerProfiles" value="false"/>
    <property name="EACEnabled" value="true"/>
    <property name="HideCommandExecutionLog" value="0"/>
    <property name="AirDropFrequency" value="72"/>
    <property name="AirDropMarker" value="false"/>
    <property name="LootAbundance" value="100"/>
    <property name="LootRespawnDays" value="${lootRespawnDays}"/>
    <property name="MaxSpawnedAnimals" value="50"/>
    <property name="LandClaimCount" value="1"/>
    <property name="LandClaimSize" value="41"/>
    <property name="LandClaimExpiryTime" value="7"/>
    <property name="LandClaimDeadZone" value="30"/>
    <property name="LandClaimOnlineDurabilityModifier" value="4"/>
    <property name="LandClaimOfflineDurabilityModifier" value="4"/>
    <property name="LandClaimOfflineDelay" value="0"/>
    <property name="PartySharedKillRange" value="100"/>
    <property name="EnemySenseMemory" value="45"/>
    <property name="EnemySpawnMode" value="true"/>
    <property name="BloodMoonFrequency" value="7"/>
    <property name="BloodMoonRange" value="0"/>
    <property name="BloodMoonWarning" value="8"/>
    <property name="BloodMoonEnemyCount" value="8"/>
    <property name="BloodMoonEnemyRange" value="0"/>
    <property name="UseAllowedZombieClasses" value="false"/>
    <property name="DisableRadio" value="false"/>
    <property name="DisablePoison" value="false"/>
    <property name="DisableInfection" value="false"/>
    <property name="DisableVault" value="false"/>
    <property name="TraderAreaProtection" value="0"/>
    <property name="TraderServiceAreaProtection" value="1"/>
    <property name="ShowFriendPlayerOnMap" value="true"/>
    <property name="FriendCantDamage" value="true"/>
    <property name="FriendCantLoot" value="false"/>
    <property name="BuildCraftTime" value="false"/>
    <property name="ShowAllPlayersOnMap" value="false"/>
    <property name="ShowSpawnWindow" value="false"/>
    <property name="AutoParty" value="false"/>
</ServerSettings>`;
      return xmlContent;

    case 'PALWORLD':
      return `
[/Script/Pal.PalGameWorldSettings]
OptionSettings=(
  Difficulty=None,
  DayTimeSpeedRate=1.000000,
  NightTimeSpeedRate=1.000000,
  ExpRate=1.000000,
  PalCaptureRate=1.000000,
  PalSpawnNumRate=1.000000,
  PalDamageRateAttack=1.000000,
  PalDamageRateDefense=1.000000,
  PlayerDamageRateAttack=1.000000,
  PlayerDamageRateDefense=1.000000,
  PlayerStaminaRateConsume=1.000000,
  PlayerAutoHPRegeneRate=1.000000,
  PlayerAutoHpRegeneRateInSleep=1.000000,
  PalStaminaRateConsume=1.000000,
  PalAutoHPRegeneRate=1.000000,
  PalAutoHpRegeneRateInSleep=1.000000,
  BuildObjectDamageRate=1.000000,
  BuildObjectDeteriorationDamageRate=1.000000,
  CollectionDropRate=1.000000,
  CollectionObjectHpRate=1.000000,
  CollectionObjectRespawnSpeedRate=1.000000,
  EnemyDropItemRate=1.000000,
  DeathPenalty=None,
  bEnablePlayerToPlayerDamage=False,
  bEnableFriendlyFire=False,
  bEnableInvaderEnemy=True,
  bActiveUNKO=False,
  bEnableAimAssistPad=True,
  bEnableAimAssistKeyboard=False,
  DropItemMaxNum=3000,
  DropItemMaxNum_UNKO=100,
  BaseCampMaxNum=128,
  BaseCampWorkerMaxNum=15,
  GuildPlayerMaxNum=20,
  PalEggDefaultHatchingTime=72.000000,
  WorkSpeedRate=1.000000,
  bIsMultiplay=False,
  bIsPvP=False,
  bCanPickupOtherGuildDeathPenaltyDrop=False,
  bEnableNonLoginPenalty=True,
  bEnableFastTravel=True,
  bIsStartLocationSelectByMap=True,
  bExistPlayerAfterLogout=False,
  bEnableDefenseOtherGuildPlayer=False,
  CoopPlayerMaxNum=4,
  ServerPlayerMaxNum=32,
  ServerName="${name}",
  ServerDescription="",
  AdminPassword="${config.adminPassword || 'changeme'}",
  ServerPassword="${config.password || ''}",
  PublicPort=${port},
  PublicIP="",
  RCONEnabled=True,
  RCONPort=25575,
  Region="",
  bUseAuth=True,
  BanListURL="https://api.palworldgame.com/api/banlist.txt"
)
      `.trim();

    case 'THE_FOREST':
      // The Forest szerver konfigurációs fájl
      // Az útmutató szerint a szerver generál egy alapértelmezett konfigurációt, ha a fájl nem létezik
      // De létrehozunk egy alapvető konfigurációt, hogy biztosan működjön
      return `# The Forest Dedicated Server Configuration
# Generated automatically

# Server Name
serverName="${name}"

# Server Password (leave empty for no password)
serverPassword="${config.password || ''}"

# Max Players
maxPlayers=${maxPlayers}

# Server Port
serverPort=${port}

# Query Port (usually port + 1)
queryPort=${queryPort}

# Admin Password
adminPassword="${config.adminPassword || 'changeme'}"

# Save Folder Path (relative to server directory)
saveFolderPath=./savefilesserver/

# Additional settings can be added here
# For more information, see the official The Forest server documentation
      `.trim();

    case 'SATISFACTORY':
      // Satisfactory szerver konfigurációs fájl (GameUserSettings.ini)
      // A port paraméter a QueryPort-ot tartalmazza (4 számjegyű port, alapértelmezett 7777)
      // A GamePort-ot és BeaconPort-ot számítjuk vagy a configuration-ből veszük
      const queryPortSatisfactory = port || 7777; // QueryPort az adatbázisból (4 számjegyű port)
      
      // BeaconPort és GamePort a configuration JSON-ből vagy számítva
      // Ha van a configuration-ben, akkor azt használjuk (provisioning során generált)
      const beaconPort = config.beaconPort || queryPortSatisfactory + 7223; // BeaconPort = QueryPort + 7223 (alapértelmezett 15000 = 7777 + 7223)
      const gamePort = config.gamePort || queryPortSatisfactory + 10000; // GamePort = QueryPort + 10000 (alapértelmezett 17777 = 7777 + 10000)
      return `[/Script/Engine.GameSession]
MaxPlayers=${maxPlayers}

[/Script/FactoryGame.FGServerSubsystem]
ServerName="${name}"
ServerPassword="${config.password || ''}"
AdminPassword="${config.adminPassword || 'changeme123'}"
GamePort=${gamePort}
BeaconPort=${beaconPort}
QueryPort=${queryPortSatisfactory}
Autopause=${config.autopause !== undefined ? config.autopause : false}
AutoSaveOnDisconnect=${config.autoSaveOnDisconnect !== undefined ? config.autoSaveOnDisconnect : true}
AutoSaveInterval=${config.autoSaveInterval || 5}
NetworkQuality=${config.networkQuality || 3}
FriendlyFire=${config.friendlyFire !== undefined ? config.friendlyFire : false}
AutoArmor=${config.autoArmor !== undefined ? config.autoArmor : true}
EnableCheats=${config.enableCheats !== undefined ? config.enableCheats : false}
GamePhase=${config.gamePhase || 1}
StartingPhase=${config.startingPhase || 1}
SkipTutorial=${config.skipTutorial !== undefined ? config.skipTutorial : false}
      `.trim();

    default:
      return '';
  }
}

/**
 * ARK közös telepítés ellenőrzése
 */
async function checkARKSharedInstallation(
  userId: string,
  machineId: string,
  gameType: GameType,
  machine: any
): Promise<boolean> {
  const { getARKSharedPath } = await import('./ark-cluster');
  const sharedPath = getARKSharedPath(userId, machineId);
  try {
    const checkCommand = gameType === 'ARK_EVOLVED'
      ? `test -f ${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer && echo "installed" || echo "not_installed"`
      : `test -f ${sharedPath}/ShooterGame/Binaries/Linux/ShooterGameServer && echo "installed" || echo "not_installed"`;
    
    const result = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      checkCommand
    );

    return result.stdout?.includes('installed') || false;
  } catch (error) {
    logger.warn('Failed to check ARK shared installation', { sharedPath, gameType });
    return false;
  }
}

/**
 * ARK közös fájlok telepítése
 * Felhasználó + szervergép kombinációhoz telepíti az ARK fájlokat
 */
async function installARKSharedFiles(
  sharedPath: string,
  gameType: GameType,
  machine: any
): Promise<void> {
  const steamAppId = gameType === 'ARK_EVOLVED' ? 376030 : 2430930;
  
  logger.info('Installing ARK shared files', { 
    sharedPath, 
    gameType, 
    steamAppId,
    machineId: machine.id 
  });
  
  const installScript = `
    #!/bin/bash
    set -e
    echo "Creating shared directory: ${sharedPath}"
    mkdir -p ${sharedPath}
    cd ${sharedPath}
    
    # Globális SteamCMD használata
    STEAMCMD="/opt/steamcmd/steamcmd.sh"
    if [ ! -f "$STEAMCMD" ]; then
      echo "HIBA: Globális SteamCMD nem található: $STEAMCMD" >&2
      echo "Kérjük, telepítsd a SteamCMD-et az agent telepítés során!" >&2
      exit 1
    fi
    
    # ARK szerver fájlok letöltése
    echo "Installing ARK server files (this may take a while)..."
    $STEAMCMD +force_install_dir ${sharedPath} +login anonymous +app_update ${steamAppId} validate +quit
    
    # Szükséges könyvtárak létrehozása
    mkdir -p ShooterGame/Saved/Config/LinuxServer
    mkdir -p ShooterGame/Saved/SavedArks
    
    echo "ARK shared files installation completed"
  `;

  const scriptPath = `/tmp/install-ark-shared-${machine.id}-${Date.now()}.sh`;
  
  try {
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `cat > ${scriptPath} << 'EOF'\n${installScript}\nEOF && chmod +x ${scriptPath}`
    );

    // Script futtatása háttérben (hosszú folyamat lehet)
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `nohup ${scriptPath} > ${sharedPath}/install.log 2>&1 &`
    );

    logger.info('ARK shared files installation started', { 
      sharedPath, 
      gameType,
      machineId: machine.id,
      logFile: `${sharedPath}/install.log`
    });
  } catch (error: any) {
    logger.error('Failed to install ARK shared files', error as Error, {
      sharedPath,
      gameType,
      machineId: machine.id,
    });
    throw error;
  }
}

/**
 * Systemd service létrehozása (exportálva újratelepítéshez)
 */
export async function createSystemdServiceForServer(
  serverId: string,
  gameType: GameType,
  gameConfig: any,
  config: any,
  machine: any,
  paths?: {
    isARK: boolean;
    sharedPath: string | null;
    serverPath: string;
  }
): Promise<void> {
  // Ellenőrizzük, hogy a config létezik-e és tartalmazza-e a szükséges mezőket
  if (!config || typeof config !== 'object') {
    throw new Error(`Config objektum hiányzik vagy érvénytelen: ${JSON.stringify(config)}`);
  }
  
  // Port lekérése az adatbázisból, hogy a helyes portot használjuk
  // Ez biztosítja, hogy a generált port mindig használatban legyen
  const serverFromDb = await prisma.server.findUnique({
    where: { id: serverId },
    select: { port: true, configuration: true },
  });
  
  // Ellenőrizzük, hogy korlátlan RAM-e a csomag
  const serverConfig = (serverFromDb?.configuration as any) || {};
  const unlimitedRam = serverConfig.unlimitedRam || config.unlimitedRam || false;
  
  // Alapértelmezett értékek beállítása, ha hiányoznak
  // Először az adatbázisból lekérdezett portot használjuk, majd a config.port-ot, végül az alapértelmezettet
  const port = serverFromDb?.port || (config.port && typeof config.port === 'number' ? config.port : 25565);
  const maxPlayers = (config.maxPlayers && typeof config.maxPlayers === 'number') ? config.maxPlayers : 10;
  
  // RAM érték beállítása - először a config.ram-ot használjuk, majd a server.configuration.ram-ot
  // A config.ram MB-ban van, de lehet, hogy a server.configuration.ram GB-ban van
  let ram = (config.ram && typeof config.ram === 'number') ? config.ram : 2048;
  
  // Ha a config.ram kisebb, mint 1000, akkor valószínűleg GB-ban van (pl. 12 GB)
  // Ha nagyobb, mint 1000, akkor valószínűleg MB-ban van (pl. 12288 MB)
  if (ram < 1000 && !unlimitedRam) {
    // GB-ban van, konvertáljuk MB-ba
    ram = ram * 1024;
    logger.info('RAM érték konvertálva GB-ból MB-ba a systemd service generálásnál', {
      serverId,
      originalRamGB: config.ram,
      ramInMB: ram,
    });
  }
  
  // Ha a server.configuration.ram létezik és nagyobb, mint a config.ram, akkor azt használjuk
  if (serverConfig.ram && typeof serverConfig.ram === 'number' && !unlimitedRam) {
    const configRam = serverConfig.ram;
    if (configRam < 1000) {
      // GB-ban van, konvertáljuk MB-ba
      const configRamInMB = configRam * 1024;
      if (configRamInMB > ram) {
        ram = configRamInMB;
        logger.info('RAM érték frissítve server.configuration-ból', {
          serverId,
          originalRamGB: configRam,
          ramInMB: ram,
        });
      }
    } else {
      // Már MB-ban van
      if (configRam > ram) {
        ram = configRam;
      }
    }
  }
  
  const cpuCores = (config.cpuCores && typeof config.cpuCores === 'number') ? config.cpuCores : 1;
  // The Forest esetén a szerver nevet a konfigurációból vesszük (servername), ha nincs, akkor a config.name-t használjuk
  let name: string;
  if (gameType === 'THE_FOREST' && config.servername) {
    name = config.servername;
  } else {
    name = (config.name && typeof config.name === 'string') ? config.name : `Server-${serverId}`;
  }
  
  // CPU és RAM limitációk számítása systemd-hez
  // CPUQuota: 100% = 1 CPU core, 200% = 2 CPU core, stb.
  const cpuQuota = `${cpuCores * 100}%`;
  // MemoryLimit: RAM limitáció GB-ban (pl. "2G" = 2 GB)
  // Ha korlátlan RAM, akkor nincs MemoryMax beállítás
  let memoryLimit: string | null = null;
  if (!unlimitedRam) {
    // A ram értéke MB-ban van, konvertáljuk GB-ba
    // Satisfactory-nál minimum 4 GB RAM kell, mert memóriaigényes
    // DE csak akkor állítjuk be a minimumot, ha a csomag RAM értéke kisebb, mint 4 GB
    let ramGB = Math.ceil(ram / 1024); // MB -> GB (pl. 12288 MB = 12 GB)
    if (gameType === 'SATISFACTORY' && ramGB < 4) {
      // Csak akkor növeljük 4 GB-ra, ha a csomag RAM értéke kisebb, mint 4 GB
      ramGB = 4; // Satisfactory-nál minimum 4 GB
      logger.warn(`Satisfactory szerver RAM limit növelve 4 GB-ra (korábbi: ${Math.ceil(ram / 1024)} GB)`, {
        serverId,
        originalRam: ram,
        newRamGB: ramGB,
      });
    } else {
      // Ha a csomag RAM értéke 4 GB vagy nagyobb, akkor azt használjuk
      logger.info('Satisfactory szerver RAM limit a csomag értéke alapján', {
        serverId,
        ramMB: ram,
        ramGB: ramGB,
      });
    }
    memoryLimit = `${ramGB}G`;
  } else {
    logger.info('Korlátlan RAM beállítva, MemoryMax nincs beállítva', {
      serverId,
      gameType,
    });
  }
  
  // Ellenőrizzük, hogy a gameConfig létezik-e
  if (!gameConfig || typeof gameConfig !== 'object') {
    throw new Error(`GameConfig objektum hiányzik vagy érvénytelen: ${JSON.stringify(gameConfig)}`);
  }
  
  // Ellenőrizzük, hogy a startCommand létezik-e
  if (!gameConfig.startCommand || typeof gameConfig.startCommand !== 'string') {
    throw new Error(`GameConfig.startCommand hiányzik vagy érvénytelen: ${gameConfig.startCommand}`);
  }
  
  let startCommand = gameConfig.startCommand;
  
  // Változók definiálása az összes játékhoz (The Forest Windows verzióhoz is szükséges)
  // Ezeket az else blokkon kívül definiáljuk, hogy a The Forest Windows verzió kezelése is elérje
  let finalPort = port;
  let finalQueryPort = gameConfig.queryPort || port + 1;
  let finalSteamPeerPort: number | undefined;
  let finalRustPlusPort: number | undefined;
  
  // ARK-nál a közös fájlokat használjuk, de az instance könyvtárban dolgozunk
  if (paths?.isARK && paths.sharedPath) {
    // ARK start command a közös binárist használja, de az instance Saved könyvtárát
    // Fontos: az ARK-nál is az adatbázisból kinyert portokat használjuk
    const serverWithPortsARK = await prisma.server.findUnique({
      where: { id: serverId },
    });
    const serverWithPortsARKTyped = serverWithPortsARK as any;
    
    const map = config.map || 'TheIsland';
    const arkPort = serverWithPortsARK?.port || port;
    const arkQueryPort = serverWithPortsARKTyped?.queryPort || (gameConfig.queryPort || arkPort + 1);
    const adminPassword = config.adminPassword || 'changeme';
    
    startCommand = `cd ${paths.sharedPath} && ./ShooterGame/Binaries/Linux/ShooterGameServer ${map}?listen?Port=${arkPort}?QueryPort=${arkQueryPort}?ServerAdminPassword=${adminPassword} -servergamelog -servergamelogincludetribelogs -NoBattlEye -UseBattlEye -clusterid=${config.clusterId || ''} -ClusterDirOverride=${paths.serverPath}/ShooterGame/Saved`;
  } else {
    // Normál játékok
    // A változók már definiálva vannak az else blokkon kívül
    const beaconPort = gameConfig.beaconPort || (gameConfig.queryPort ? gameConfig.queryPort + 1 : port + 2);
    const queryPort = gameConfig.queryPort || port + 1;
    
    // Satisfactory esetén a portokat külön kell kezelni
    if (gameType === 'SATISFACTORY') {
      // Lekérjük a portokat az adatbázisból vagy a config-ból
      const serverWithPorts = await prisma.server.findUnique({
        where: { id: serverId },
      });
      const serverWithPortsTyped = serverWithPorts as any;
      
      // Satisfactory port számítások az adatbázisból (új logika):
      // Az adatbázisban:
      // - port mező = GamePort (alap port, pl. 7777)
      // - queryPort mező = QueryPort (GamePort + 2, pl. 7779)
      // - beaconPort mező = BeaconPort (QueryPort + 2, pl. 7781)
      
      // Lekérjük az adatbázisból a portokat
      // Fontos: az adatbázisban a port mező = GamePort (alap port)
      // A config.gamePort-ot NEM használjuk, mert az a régi logikából származik (QueryPort + 10000)
      const dbGamePort = serverWithPorts?.port || port || 7777; // GamePort = port mező
      const dbQueryPort = serverWithPortsTyped?.queryPort || (dbGamePort + 2); // QueryPort = queryPort mező (GamePort + 2)
      const dbBeaconPort = serverWithPortsTyped?.beaconPort || (dbQueryPort + 2); // BeaconPort = beaconPort mező (QueryPort + 2)
      
      // Mindig az adatbázisból kinyert portokat használjuk (config.gamePort-ot NEM használjuk)
      let finalGamePort = dbGamePort;
      let finalQueryPort = dbQueryPort;
      let finalBeaconPort = dbBeaconPort;
      
      // Biztosítjuk, hogy mindhárom port különböző legyen
      // Loop-ban újrageneráljuk a portokat, amíg biztosan különbözőek nem lesznek
      let maxAdjustmentAttempts = 10;
      let adjustmentAttempt = 0;
      
      while ((finalGamePort === finalQueryPort || finalGamePort === finalBeaconPort || finalQueryPort === finalBeaconPort) && adjustmentAttempt < maxAdjustmentAttempts) {
        adjustmentAttempt++;
        
        logger.warn('Port conflict detected in Satisfactory ports, recalculating', {
          serverId,
          attempt: adjustmentAttempt,
          gamePort: finalGamePort,
          queryPort: finalQueryPort,
          beaconPort: finalBeaconPort,
        });
        
        // Az adatbázisból a port mező a GamePort-ot tartalmazza (alap port)
        // Újraszámoljuk a portokat a GamePort alapján az új logika szerint
        const baseGamePort = finalGamePort || (finalQueryPort ? finalQueryPort - 2 : 7777);
        
        // Ha a GamePort hiányzik vagy ütközik, újraszámoljuk
        if (finalGamePort === finalQueryPort || finalGamePort === finalBeaconPort || !finalGamePort) {
          // GamePort = alap port (adatbázisból vagy számolva)
          finalGamePort = baseGamePort;
        }
        
        // QueryPort = GamePort + 2
        if (finalQueryPort === finalGamePort || finalQueryPort === finalBeaconPort || !finalQueryPort) {
          finalQueryPort = finalGamePort + 2;
        }
        
        // BeaconPort = QueryPort + 2
        if (finalBeaconPort === finalGamePort || finalBeaconPort === finalQueryPort || !finalBeaconPort) {
          finalBeaconPort = finalQueryPort + 2;
        }
        
        // Ha még mindig ütköznek, akkor újraszámoljuk az új logika szerint
        if (finalGamePort === finalQueryPort || finalGamePort === finalBeaconPort || finalQueryPort === finalBeaconPort) {
          logger.warn('Ports still conflict after initial recalculation, recalculating with new logic', {
            serverId,
            gamePort: finalGamePort,
            queryPort: finalQueryPort,
            beaconPort: finalBeaconPort,
            attempt: adjustmentAttempt,
          });
          
          // Újraszámoljuk az új logika szerint
          finalGamePort = baseGamePort;
          finalQueryPort = finalGamePort + 2;
          finalBeaconPort = finalQueryPort + 2;
        }
      }
      
      // Ha még mindig ütköznek, akkor hibaüzenet
      if (finalGamePort === finalQueryPort || finalGamePort === finalBeaconPort || finalQueryPort === finalBeaconPort) {
        logger.error('Could not resolve Satisfactory port conflicts after multiple attempts', new Error('Port conflict resolution failed'), {
          serverId,
          gamePort: finalGamePort,
          queryPort: finalQueryPort,
          beaconPort: finalBeaconPort,
          attempts: adjustmentAttempt,
        });
        throw new Error('Nem sikerült különböző portokat generálni a Satisfactory szerverhez. Kérjük, ellenőrizze az adatbázisban a portokat.');
      }
      
      logger.info('Ports verified and adjusted to ensure uniqueness', {
        serverId,
        queryPort: finalQueryPort,
        gamePort: finalGamePort,
        beaconPort: finalBeaconPort,
        attempts: adjustmentAttempt,
      });
      
      // A startCommand placeholder-eket cseréljük le
      // -Port={gamePort} -ServerQueryPort={queryPort} -BeaconPort={beaconPort} -multihome={multihome}
      // Fontos: a Satisfactory FactoryServer.sh a következő paramétereket várja:
      // -Port={gamePort} - a játékosok által használt port
      // -ServerQueryPort={queryPort} - a query port (a jelenlegi kódban queryPort mezőben van)
      // -BeaconPort={beaconPort} - a beacon port
      // -multihome={multihome} - a szervergép külső IP címe
      const multihomeIp = machine?.ipAddress || '0.0.0.0';
      startCommand = startCommand
        .replace(/{gamePort}/g, finalGamePort.toString())
        .replace(/{queryPort}/g, finalQueryPort.toString())
        .replace(/{beaconPort}/g, finalBeaconPort.toString())
        .replace(/{multihome}/g, multihomeIp)
        .replace(/{port}/g, finalGamePort.toString()); // {port} is GamePort-t jelent (backward compatibility)
      
      logger.info('Satisfactory start command generated with ports', {
        serverId,
        gamePort: finalGamePort,
        queryPort: finalQueryPort,
        beaconPort: finalBeaconPort,
        startCommand,
      });
    } else {
      // Más játékoknál (Valheim, The Forest, Rust, stb.) is az adatbázisból kinyerjük a portokat
      // A változók már definiálva vannak az else blokk elején
      
      // Lekérjük a portokat az adatbázisból
      const serverWithPorts = await prisma.server.findUnique({
        where: { id: serverId },
      });
      const serverWithPortsTyped = serverWithPorts as any;
      
      // Az adatbázisból kinyert portok használata
      if (serverWithPorts) {
        finalPort = serverWithPorts.port || port;
        finalQueryPort = serverWithPortsTyped?.queryPort || queryPort;
        
        // The Forest esetén steamPeerPort
        if (gameType === 'THE_FOREST') {
          const serverWithPortsTyped = serverWithPorts as any;
          finalSteamPeerPort = serverWithPortsTyped.steamPeerPort;
          // Ha nincs az adatbázisban, számoljuk ki
          if (!finalSteamPeerPort && finalQueryPort) {
            finalSteamPeerPort = finalQueryPort + 1;
          }
        }
        
        // Rust esetén rustPlusPort
        if (gameType === 'RUST') {
          const serverWithPortsTyped = serverWithPorts as any;
          finalRustPlusPort = serverWithPortsTyped.rustPlusPort;
          // Ha nincs az adatbázisban, számoljuk ki
          if (!finalRustPlusPort && finalPort) {
            finalRustPlusPort = finalPort + 67;
          }
        }
      }
      
      // 7 Days to Die esetén telnetPort és webMapPort az adatbázisból (mint a többi játéknál)
      let finalTelnetPort: number | undefined;
      if (gameType === 'SEVEN_DAYS_TO_DIE') {
        const serverWithPortsTyped = serverWithPorts as any;
        finalTelnetPort = serverWithPortsTyped.telnetPort;
        // Ha nincs az adatbázisban, számoljuk ki
        if (!finalTelnetPort && finalPort) {
          finalTelnetPort = finalPort + 2; // TelnetPort = GamePort + 2
        }
      }
      
      // Placeholder-ek cseréje az adatbázisból kinyert portokkal
      startCommand = startCommand
        .replace(/{port}/g, finalPort.toString())
        .replace(/{maxPlayers}/g, maxPlayers.toString())
        .replace(/{ram}/g, ram.toString())
        .replace(/{name}/g, name)
        .replace(/{world}/g, config.world || 'Dedicated')
        .replace(/{adminPassword}/g, config.adminPassword || 'changeme')
        .replace(/{queryPort}/g, finalQueryPort.toString())
        .replace(/{beaconPort}/g, beaconPort.toString())
        .replace(/{map}/g, config.map || 'TheIsland');
      
      // The Forest esetén steamPeerPort placeholder (ha van a startCommand-ban)
      if (gameType === 'THE_FOREST' && finalSteamPeerPort) {
        startCommand = startCommand.replace(/{steamPeerPort}/g, finalSteamPeerPort.toString());
      }
      
      // Rust esetén rustPlusPort placeholder (ha van a startCommand-ban)
      if (gameType === 'RUST' && finalRustPlusPort) {
        startCommand = startCommand.replace(/{rustPlusPort}/g, finalRustPlusPort.toString());
      }
      
      // 7 Days to Die esetén telnetPort placeholder (ha van a startCommand-ban)
      if (gameType === 'SEVEN_DAYS_TO_DIE' && finalTelnetPort) {
        startCommand = startCommand.replace(/{telnetPort}/g, finalTelnetPort.toString());
      }
      
      logger.info(`${gameType} start command generated with ports from database`, {
        serverId,
        port: finalPort,
        queryPort: finalQueryPort,
        steamPeerPort: finalSteamPeerPort,
        rustPlusPort: finalRustPlusPort,
        telnetPort: finalTelnetPort,
        startCommand,
      });
    }
    
    // Valheim specifikus placeholder-ek
    if (gameType === 'VALHEIM') {
      // Valheim jelszó validáció: minimum 5 karakter kell
      let valheimPassword = config.password || '';
      if (valheimPassword.length < 5) {
        // Ha a jelszó túl rövid vagy üres, generálunk egy alapértelmezettet
        // Használjuk a szerver nevét + egy random számot, hogy legalább 5 karakter legyen
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        valheimPassword = (name.substring(0, 1) + randomSuffix).substring(0, 5);
        logger.warn(`Valheim jelszó túl rövid, generált jelszó: ${valheimPassword}`);
      }
      startCommand = startCommand.replace(/{password}/g, valheimPassword);
      
      // Public flag: 1 = nyilvános, 0 = privát
      const isPublic = config.public !== undefined ? (config.public ? '1' : '0') : '1';
      startCommand = startCommand
        .replace(/{public}/g, isPublic);
    } else {
      // Más játékoknál nincs jelszó validáció
      startCommand = startCommand.replace(/{password}/g, config.password || '');
    }
    
    // The Forest specifikus placeholder-ek
    if (gameType === 'THE_FOREST') {
      // IP cím meghatározása (machine IP vagy 0.0.0.0, ha nincs)
      const serverIp = machine?.ipAddress || '0.0.0.0';
      
      // SteamPeerPort az adatbázisból (ha már kinyertük korábban, akkor azt használjuk)
      // Ha nincs, akkor számoljuk ki (QueryPort + 1)
      let steamPeerPortForForest = finalSteamPeerPort;
      if (!steamPeerPortForForest && finalQueryPort) {
        steamPeerPortForForest = finalQueryPort + 1;
      }
      
      startCommand = startCommand
        .replace(/{serverautosaveinterval}/g, (config.serverautosaveinterval || 15).toString())
        .replace(/{difficulty}/g, config.difficulty || 'Normal')
        .replace(/{inittype}/g, config.inittype || 'Continue')
        .replace(/{enableVAC}/g, config.enableVAC || 'on')
        // Slot fix érték (csomaghoz kötött, nem változtatható)
        .replace(/{slot}/g, (config.slot || 3).toString())
        // IP cím (Wine hálózati hiba elkerülése)
        .replace(/{serverip}/g, serverIp)
        // SteamPeerPort az adatbázisból (Windows verzióhoz)
        // Ha nincs az adatbázisban, számoljuk ki (QueryPort + 1)
        // Ha nincs QueryPort sem, akkor Port + 2
        const steamPeerPortValue = steamPeerPortForForest || (finalQueryPort ? (finalQueryPort + 1) : (finalPort ? (finalPort + 2) : (port ? (port + 2) : 8766)));
        startCommand = startCommand.replace(/{steamPeerPort}/g, steamPeerPortValue.toString());
    }
  }

  const workingDir = paths?.serverPath || `/opt/servers/${serverId}`;
  let execDir = paths?.isARK && paths.sharedPath ? paths.sharedPath : workingDir;
  
  // Ha a startCommand tartalmazza a "cd" parancsot, akkor eltávolítjuk és módosítjuk a WorkingDirectory-t
  // Systemd-ben nem lehet cd-t használni az ExecStart-ban
  // Satisfactory-nál a FactoryServer.sh script a szerver könyvtárban van, nincs szükség cd-re
  if (startCommand.includes('cd ') && startCommand.includes(' && ')) {
    // Kinyerjük a cd útvonalat
    const cdMatch = startCommand.match(/cd\s+([^\s&]+)/);
    if (cdMatch) {
      const cdPath = cdMatch[1];
      // Ha relatív útvonal, akkor hozzáadjuk a workingDir-hez
      if (!cdPath.startsWith('/')) {
        execDir = `${workingDir}/${cdPath}`;
      } else {
        execDir = cdPath;
      }
      // Eltávolítjuk a "cd ... && " részt a startCommand-ból
      startCommand = startCommand.replace(/cd\s+[^\s&]+\s+&&\s+/, '');
    }
  }
  
  // Systemd-ben nem lehet relatív útvonalat használni az ExecStart-ban
  // Ha a startCommand "./"-tal kezdődik, akkor abszolút útvonalra konvertáljuk
  if (startCommand.trim().startsWith('./')) {
    // Kinyerjük a bináris nevét és argumentumait
    const parts = startCommand.trim().split(/\s+/);
    let binary = parts[0].replace('./', '');
    const args = parts.slice(1).join(' ');
    
    // Satisfactory esetén natív Linux FactoryServer.sh scriptet keresünk
    // A telepítő script SteamCMD-vel letölti a natív Linux szervert
    if (gameType === 'SATISFACTORY') {
      try {
        // Ellenőrizzük, hogy létezik-e a FactoryServer.sh script a szerver könyvtárban
        const checkStartScript = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `test -f ${workingDir}/FactoryServer.sh && echo "found:${workingDir}/FactoryServer.sh" || echo "notfound"`
        );
        
        const scriptResult = checkStartScript.stdout?.trim();
        if (scriptResult && scriptResult.startsWith('found:')) {
          // Ha létezik a FactoryServer.sh, azt használjuk
          const scriptPath = scriptResult.replace('found:', '');
          // Abszolút útvonalat használunk systemd-hez
          // Fontos: a startCommand már tartalmazza a portokat (GamePort, QueryPort, BeaconPort),
          // csak az útvonalat cseréljük le, ne írjuk felül az egész parancsot
          // A startCommand formátuma: ./FactoryServer.sh -Port={gamePort} -ServerQueryPort={queryPort} -BeaconPort={beaconPort} -log -unattended
          // Csak a "./FactoryServer.sh" részt cseréljük le az abszolút útvonalra
          startCommand = startCommand.replace(/\.\/FactoryServer\.sh/, scriptPath);
          binary = null;
          execDir = workingDir;
          logger.info('Satisfactory FactoryServer.sh script found, port arguments preserved', {
            serverId,
            scriptPath,
            startCommand,
          });
        } else {
          throw new Error(`Satisfactory FactoryServer.sh script not found for server ${serverId}. Please check installation.`);
        }
      } catch (error) {
        logger.error('Error checking Satisfactory binary', error as Error, {
          serverId,
          execDir,
          workingDir,
        });
        throw error;
      }
    }
    
    // Abszolút útvonalra konvertáljuk (csak ha még nem állítottuk be)
    // Fontos: az args már tartalmazza az összes argumentumot, beleértve a portokat is az adatbázisból
    if (binary) {
      const fullBinaryPath = `${execDir}/${binary}`;
      // Az args már tartalmazza a portokat (pl. -server.port 28015 -server.queryport 28016)
      // Csak az útvonalat cseréljük le, az argumentumok (beleértve a portokat) megmaradnak
      startCommand = `${fullBinaryPath}${args ? ' ' + args : ''}`.trim();
      logger.info(`${gameType} start command converted to absolute path, ports preserved`, {
        serverId,
        binary,
        fullBinaryPath,
        args,
        startCommand,
      });
    }
    // Ha binary null, akkor már beállítottuk a startCommand-ot a Satisfactory ellenőrzés során
  }

  // Satisfactory esetén natív Linux szervert használunk (FactoryServer.sh)
  // Nincs szükség Wine-re

  // The Forest esetén ellenőrizzük, hogy Linux vagy Windows bináris van-e
  let useWineForForest = false;
  if (gameType === 'THE_FOREST') {
    // Ellenőrizzük, hogy van-e Linux bináris
    try {
      const checkLinuxBinary = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `test -f ${execDir}/TheForestDedicatedServer.x86_64 && echo "linux" || echo "windows"`
      );
      if (checkLinuxBinary.stdout?.trim() === 'linux') {
        useWineForForest = false;
        // Linux bináris esetén használjuk a startCommand-ot (nem tartalmazza a Wine-t)
        if (gameConfig.startCommandWindows) {
          // Ha van startCommandWindows, akkor a startCommand a Linux verzió
          // Nem cseréljük le, mert már a startCommand a Linux verzió
        }
      } else {
        useWineForForest = true;
        // Windows bináris esetén használjuk a startCommandWindows-ot
        // Fontos: az adatbázisból kinyert portokat használjuk
        if (gameConfig.startCommandWindows) {
          startCommand = gameConfig.startCommandWindows;
          // Az adatbázisból kinyert portokat használjuk (már korábban kinyertük)
          const forestPort = finalPort || port;
          const forestQueryPort = finalQueryPort || (gameConfig.queryPort || port + 1);
          const forestSteamPeerPort = finalSteamPeerPort || (forestQueryPort + 1);
          
          // The Forest specifikus konfigurációs értékek
          const serverConfig = config.configuration ? (typeof config.configuration === 'string' ? JSON.parse(config.configuration) : config.configuration) : {};
          const serverautosaveinterval = serverConfig.serverautosaveinterval || serverConfig.serverAutoSaveInterval || 15;
          const difficulty = serverConfig.difficulty || config.difficulty || 'Normal';
          const inittype = serverConfig.inittype || serverConfig.initType || config.inittype || 'Continue';
          const enableVAC = serverConfig.enableVAC || 'on';
          const slot = serverConfig.slot || config.slot || 3;
          const serverip = machine?.ipAddress || '0.0.0.0';
          
          startCommand = startCommand
            .replace(/{serverId}/g, serverId)
            .replace(/{port}/g, forestPort.toString())
            .replace(/{maxPlayers}/g, maxPlayers.toString())
            .replace(/{ram}/g, ram.toString())
            .replace(/{name}/g, name)
            .replace(/{world}/g, config.world || 'Dedicated')
            .replace(/{password}/g, config.password || '')
            .replace(/{adminPassword}/g, config.adminPassword || 'changeme')
            .replace(/{queryPort}/g, forestQueryPort.toString())
            .replace(/{steamPeerPort}/g, forestSteamPeerPort.toString())
            .replace(/{map}/g, config.map || 'TheIsland')
            .replace(/{serverautosaveinterval}/g, serverautosaveinterval.toString())
            .replace(/{difficulty}/g, difficulty)
            .replace(/{inittype}/g, inittype)
            .replace(/{enableVAC}/g, enableVAC)
            .replace(/{slot}/g, slot.toString())
            .replace(/{serverip}/g, serverip);
        }
      }
    } catch (error) {
      // Ha nem sikerül ellenőrizni, akkor feltételezzük, hogy Windows bináris van
      useWineForForest = true;
      if (gameConfig.startCommandWindows) {
        startCommand = gameConfig.startCommandWindows;
        // Az adatbázisból kinyert portokat használjuk (már korábban kinyertük)
        const forestPort = finalPort || port;
        const forestQueryPort = finalQueryPort || (gameConfig.queryPort || port + 1);
        const forestSteamPeerPort = finalSteamPeerPort || (forestQueryPort + 1);
        
        // The Forest specifikus konfigurációs értékek
        const serverConfig = config.configuration ? (typeof config.configuration === 'string' ? JSON.parse(config.configuration) : config.configuration) : {};
        const serverautosaveinterval = serverConfig.serverautosaveinterval || serverConfig.serverAutoSaveInterval || 15;
        const difficulty = serverConfig.difficulty || config.difficulty || 'Normal';
        const inittype = serverConfig.inittype || serverConfig.initType || config.inittype || 'Continue';
        const enableVAC = serverConfig.enableVAC || 'on';
        const slot = serverConfig.slot || config.slot || 3;
        const serverip = machine?.ipAddress || '0.0.0.0';
        
        startCommand = startCommand
          .replace(/{serverId}/g, serverId)
          .replace(/{port}/g, forestPort.toString())
          .replace(/{maxPlayers}/g, maxPlayers.toString())
          .replace(/{ram}/g, ram.toString())
          .replace(/{name}/g, name)
          .replace(/{world}/g, config.world || 'Dedicated')
          .replace(/{password}/g, config.password || '')
          .replace(/{adminPassword}/g, config.adminPassword || 'changeme')
          .replace(/{queryPort}/g, forestQueryPort.toString())
          .replace(/{steamPeerPort}/g, forestSteamPeerPort.toString())
          .replace(/{map}/g, config.map || 'TheIsland')
          .replace(/{serverautosaveinterval}/g, serverautosaveinterval.toString())
          .replace(/{difficulty}/g, difficulty)
          .replace(/{inittype}/g, inittype)
          .replace(/{enableVAC}/g, enableVAC)
          .replace(/{slot}/g, slot.toString())
          .replace(/{serverip}/g, serverip);
      }
    }
  }
  
  // Ha a játék Wine-t használ (pl. The Forest Windows verzió), létrehozunk egy wrapper scriptet
  let finalStartCommand = startCommand;
  let useWrapperScript = false;
  
  if ((gameType === 'THE_FOREST' && useWineForForest) || startCommand.includes('wine') || startCommand.includes('xvfb-run')) {
    useWrapperScript = true;
    // Escape-eljük a startCommand-ot, hogy biztonságosan beilleszthető legyen a scriptbe
    // A startCommand-ot közvetlenül beillesztjük a scriptbe, escape-eljük az idézőjeleket
    // Fontos: a $ karaktereket is escape-eljük, hogy ne legyenek változóként értelmezve
    // De a backslash-eket nem escape-eljük, mert azok szükségesek lehetnek
    const escapedStartCommand = startCommand
      .replace(/\\/g, '\\\\')  // Backslash escape-elése először
      .replace(/"/g, '\\"')    // Dupla idézőjelek escape-elése
      .replace(/\$/g, '\\$')   // $ karakterek escape-elése
      .replace(/`/g, '\\`');   // Backtick escape-elése
    
    // Wrapper script létrehozása, ami először telepíti az Xvfb-t, Wine-t, Winbind-et, majd futtatja a szervert
    const wrapperScript = `#!/bin/bash
set +e
cd ${execDir}

# Xvfb, xauth, Wine, Winbind telepítése, ha nincs
export DEBIAN_FRONTEND=noninteractive

# Apt-get update (hibaüzenetekkel) - csak akkor, ha valami hiányzik
if ! command -v xvfb-run >/dev/null 2>&1 || ! command -v xauth >/dev/null 2>&1 || ! command -v wine >/dev/null 2>&1; then
  echo "apt-get update futtatása..."
  apt-get update 2>&1
  UPDATE_EXIT=$?
  if [ $UPDATE_EXIT -ne 0 ]; then
    echo "FIGYELMEZTETÉS: apt-get update sikertelen (exit code: $UPDATE_EXIT), de folytatjuk..."
  else
    echo "apt-get update sikeres"
  fi
fi

# Xvfb telepítése (hibaüzenetekkel)
if ! command -v xvfb-run >/dev/null 2>&1; then
  echo "Xvfb telepítése..."
  apt-get install -y xvfb 2>&1
  XVFB_EXIT=$?
  if [ $XVFB_EXIT -ne 0 ]; then
    echo "HIBA: Xvfb telepítése sikertelen (exit code: $XVFB_EXIT)"
    echo "Próbáljuk meg a xvfb csomagot telepíteni..."
    apt-get install -y xvfb 2>&1
    XVFB_EXIT=$?
    if [ $XVFB_EXIT -ne 0 ]; then
      echo "HIBA: Xvfb telepítése még mindig sikertelen (exit code: $XVFB_EXIT)"
      exit 1
    fi
  fi
  echo "Xvfb telepítése sikeres"
else
  echo "Xvfb már telepítve van"
fi

# xauth telepítése (xvfb-run működéséhez szükséges)
if ! command -v xauth >/dev/null 2>&1; then
  echo "xauth telepítése..."
  apt-get install -y xauth 2>&1
  XAUTH_EXIT=$?
  if [ $XAUTH_EXIT -ne 0 ]; then
    echo "HIBA: xauth telepítése sikertelen (exit code: $XAUTH_EXIT)"
    echo "Próbáljuk meg az x11-xserver-utils csomagot telepíteni..."
    apt-get install -y x11-xserver-utils 2>&1
    XAUTH_EXIT=$?
    if [ $XAUTH_EXIT -ne 0 ]; then
      echo "HIBA: xauth telepítése még mindig sikertelen (exit code: $XAUTH_EXIT)"
      exit 1
    fi
  fi
  echo "xauth telepítése sikeres"
else
  echo "xauth már telepítve van"
fi

# Wine telepítése (hibaüzenetekkel)
if ! command -v wine >/dev/null 2>&1; then
  echo "Wine telepítése..."
  apt-get install -y wine-stable 2>&1
  WINE_EXIT=$?
  if [ $WINE_EXIT -ne 0 ]; then
    echo "HIBA: Wine telepítése sikertelen (exit code: $WINE_EXIT)"
    echo "Próbáljuk meg a wine csomagot telepíteni..."
    apt-get install -y wine 2>&1
    WINE_EXIT=$?
    if [ $WINE_EXIT -ne 0 ]; then
      echo "HIBA: Wine telepítése még mindig sikertelen (exit code: $WINE_EXIT)"
      exit 1
    fi
  fi
  echo "Wine telepítése sikeres"
else
  echo "Wine már telepítve van"
fi

# Winbind telepítése (hibaüzenetekkel)
if ! command -v winbind >/dev/null 2>&1; then
  echo "Winbind telepítése..."
  apt-get install -y winbind 2>&1
  WINBIND_EXIT=$?
  if [ $WINBIND_EXIT -ne 0 ]; then
    echo "FIGYELMEZTETÉS: Winbind telepítése sikertelen (exit code: $WINBIND_EXIT), de folytatjuk..."
  else
    echo "Winbind telepítése sikeres"
  fi
else
  echo "Winbind már telepítve van"
fi

# Ellenőrzés, hogy az xvfb-run és xauth most már elérhető-e
if ! command -v xvfb-run >/dev/null 2>&1; then
  echo "HIBA: xvfb-run még mindig nem található a telepítés után"
  echo "Keresés xvfb-run után:"
  which xvfb-run 2>&1 || find /usr -name xvfb-run 2>&1 | head -5
  exit 1
fi

if ! command -v xauth >/dev/null 2>&1; then
  echo "HIBA: xauth még mindig nem található a telepítés után"
  echo "Keresés xauth után:"
  which xauth 2>&1 || find /usr -name xauth 2>&1 | head -5
  exit 1
fi

echo "Xvfb, xauth, Wine, Winbind telepítése sikeres"
echo "xvfb-run elérhető: $(which xvfb-run)"
echo "xauth elérhető: $(which xauth)"

# The Forest szerver esetén a save könyvtárat is létrehozzuk
if echo "${escapedStartCommand}" | grep -q "TheForestDedicatedServer"; then
  echo "The Forest szerver észlelve, save könyvtár ellenőrzése..."
  mkdir -p ./savefilesserver
  chmod 755 ./savefilesserver
  echo "Save könyvtár: $(pwd)/savefilesserver"
  
  # Wine hálózati beállítások javítása (hálózati hiba elkerülése)
  echo "Wine hálózati beállítások beállítása..."
  export WINE_NETWORK_DRIVER=winetap
  # Alternatív: export WINEPREFIX="$HOME/.wine" (ha szükséges)
fi

# Szerver futtatása
set -e
# A startCommand közvetlenül futtatása bash-ben (nem eval)
bash -c "${escapedStartCommand}"
`;

    const wrapperScriptBase64 = Buffer.from(wrapperScript).toString('base64');
    const wrapperScriptPath = `${execDir}/start-server.sh`;
    
    // Wrapper script létrehozása
    await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      `echo '${wrapperScriptBase64}' | base64 -d > ${wrapperScriptPath} && chmod +x ${wrapperScriptPath} && chown root:root ${wrapperScriptPath}`
    );
    
    finalStartCommand = wrapperScriptPath;
  }

  // Escape speciális karakterek a startCommand-ban systemd-hez
  // Systemd service fájlokban az ExecStart sorban escape-elni kell a $ karaktereket
  // Fontos: az ExecStart sorban nem lehet sortörés, minden egy sorban kell legyen
  const escapedStartCommand = finalStartCommand
    .replace(/\$/g, '\\$')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ') // Új sorok eltávolítása
    .replace(/\r/g, '') // Carriage return eltávolítása
    .trim();
  
  // Környezeti változók beállítása
  let environmentVars = '';
  if (gameConfig.environmentVariables && Object.keys(gameConfig.environmentVariables).length > 0) {
    for (const [key, value] of Object.entries(gameConfig.environmentVariables)) {
      // Cseréljük le a {serverId} placeholder-t
      const envValue = typeof value === 'string' ? value.replace(/{serverId}/g, serverId) : String(value);
      environmentVars += `Environment="${key}=${envValue}"\n`;
    }
  }
  
  // Systemd service fájl tartalom
  // Fontos: minden kulcs=érték pár egy sorban kell legyen, nincs sortörés
  // CPU és RAM limitációk hozzáadása a GamePackage specifikációk alapján
  // Satisfactory és 7 Days to Die esetén külön felhasználót és sfgames csoportot használunk
  // 7 Days to Die-nál a felhasználó neve: seven{serverId} (pl. seven2, seven3...)
  let serviceUser = 'root';
  let serviceGroup: string | undefined = undefined;
  
  if (gameType === 'SATISFACTORY') {
    serviceUser = 'satis';
    serviceGroup = 'sfgames';
  } else if (gameType === 'SEVEN_DAYS_TO_DIE') {
    // A felhasználó neve a serverId alapján generálódik (pl. seven2, seven3...)
    // A telepítő script létrehozza a felhasználót: seven{serverId}
    serviceUser = `seven${serverId}`;
    serviceGroup = 'sfgames';
  } else if (gameType === 'THE_FOREST') {
    // A felhasználó neve a serverId alapján generálódik (pl. forest2, forest3...)
    // A telepítő script létrehozza a felhasználót: forest{serverId}
    serviceUser = `forest${serverId}`;
    serviceGroup = 'sfgames';
  }
  
  const groupLine = serviceGroup ? `Group=${serviceGroup}\n` : '';
  
  const serviceContent = `[Unit]
Description=Game Server ${serverId} (${gameType})
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=${serviceUser}
${groupLine}WorkingDirectory=${execDir}
${environmentVars}ExecStart=${escapedStartCommand}
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
LimitNOFILE=100000
# CPU limitáció (100% = 1 CPU core, 200% = 2 CPU core, stb.)
CPUQuota=${cpuQuota}
${memoryLimit ? `# RAM limitáció (pl. "2G" = 2 GB RAM) - MemoryLimit deprecated, csak MemoryMax
MemoryMax=${memoryLimit}` : '# Korlátlan RAM - MemoryMax nincs beállítva'}
# További erőforrás limitációk
TasksMax=1000

[Install]
WantedBy=multi-user.target`;

  // Base64 encoding használata a service fájl írásához, hogy elkerüljük az escape problémákat
  const serviceContentBase64 = Buffer.from(serviceContent).toString('base64');
  
  await executeSSHCommand(
    {
      host: machine.ipAddress,
      port: machine.sshPort,
      user: machine.sshUser,
      keyPath: machine.sshKeyPath || undefined,
    },
    `echo '${serviceContentBase64}' | base64 -d > /etc/systemd/system/server-${serverId}.service && systemctl daemon-reload`
  );

  logger.info('Systemd service created', {
    serverId,
    gameType,
  });
}

/**
 * Tűzfal portok automatikus engedélyezése
 */
export async function configureFirewallPorts(
  serverId: string,
  gameType: GameType,
  config: { port: number; [key: string]: any },
  machine: any,
  gameConfig: any,
  writeProgress?: boolean
): Promise<void> {
  try {
    const portsToOpen: Array<{ port: number; protocol: 'tcp' | 'udp' }> = [];
    
    // Alap port (játék típusonként TCP vagy UDP)
    const basePort = config.port;
    const baseProtocol = gameConfig.portProtocol || 'udp'; // Alapértelmezetten UDP a legtöbb játéknál
    
    portsToOpen.push({ port: basePort, protocol: baseProtocol as 'tcp' | 'udp' });
    
    // További portok (queryPort, beaconPort, stb.)
    if (gameConfig.queryPort) {
      portsToOpen.push({ port: gameConfig.queryPort, protocol: 'udp' });
    }
    
    if (gameConfig.beaconPort) {
      portsToOpen.push({ port: gameConfig.beaconPort, protocol: 'udp' });
    }
    
    // Additional ports a konfigurációból
    if (gameConfig.additionalPorts && Array.isArray(gameConfig.additionalPorts)) {
      for (const additionalPort of gameConfig.additionalPorts) {
        if (typeof additionalPort === 'number') {
          portsToOpen.push({ port: additionalPort, protocol: 'udp' });
        }
      }
    }
    
    if (portsToOpen.length === 0) {
      return; // Nincs port, amit megnyitnánk
    }
    
    if (writeProgress) {
      await appendInstallLog(serverId, `Tűzfal portok engedélyezése: ${portsToOpen.map(p => `${p.port}/${p.protocol}`).join(', ')}`);
    }
    
    // UFW vagy iptables használata
    // Először ellenőrizzük, hogy UFW van-e telepítve és aktív
    const checkUfwCommand = `command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active" && echo "ufw_active" || echo "ufw_inactive"`;
    const ufwCheck = await executeSSHCommand(
      {
        host: machine.ipAddress,
        port: machine.sshPort,
        user: machine.sshUser,
        keyPath: machine.sshKeyPath || undefined,
      },
      checkUfwCommand
    );
    
    const useUfw = ufwCheck.stdout?.trim() === 'ufw_active';
    
    if (useUfw) {
      // UFW használata
      for (const { port, protocol } of portsToOpen) {
        try {
          await executeSSHCommand(
            {
              host: machine.ipAddress,
              port: machine.sshPort,
              user: machine.sshUser,
              keyPath: machine.sshKeyPath || undefined,
            },
            `sudo ufw allow ${port}/${protocol} comment "Game server ${serverId} (${gameType})" 2>&1 || echo "UFW rule may already exist"`
          );
          
          if (writeProgress) {
            await appendInstallLog(serverId, `Port engedélyezve: ${port}/${protocol.toUpperCase()}`);
          }
        } catch (portError: any) {
          logger.warn('Failed to open firewall port', {
            serverId,
            port,
            protocol,
            error: portError.message,
          });
          if (writeProgress) {
            await appendInstallLog(serverId, `FIGYELMEZETÉS: Port engedélyezése sikertelen: ${port}/${protocol} - ${portError.message}`);
          }
        }
      }
    } else {
      // Ha nincs UFW, próbáljuk meg iptables-t használni (root jogosultság szükséges)
      // Megjegyzés: iptables esetén a szabályok nem maradnak meg újraindítás után, ezért ajánlott UFW-t használni
      logger.info('UFW not active, skipping firewall configuration', {
        serverId,
        gameType,
      });
      
      if (writeProgress) {
        await appendInstallLog(serverId, 'FIGYELMEZETÉS: UFW nincs aktív, tűzfal portok nem lettek automatikusan engedélyezve. Kérjük, manuálisan engedélyezd a portokat.');
      }
    }
    
    logger.info('Firewall ports configured', {
      serverId,
      gameType,
      ports: portsToOpen,
      useUfw,
    });
  } catch (error: any) {
    // Nem dobunk hibát, mert a tűzfal konfiguráció nem kritikus a telepítéshez
    logger.warn('Failed to configure firewall ports', {
      serverId,
      gameType,
      error: error.message,
    });
    
    if (writeProgress) {
      await appendInstallLog(serverId, `FIGYELMEZETÉS: Tűzfal portok automatikus engedélyezése sikertelen: ${error.message}. Kérjük, manuálisan engedélyezd a portokat.`);
    }
  }
}
