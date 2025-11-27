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

    // Telepítési script generálása (csak ha nem ARK, vagy ha még nincs telepítve)
    if (!isARK || !(await checkARKSharedInstallation(server.userId, machine.id, gameType, machine))) {
      let installScript = gameConfig.installScript;
      
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
      const port = config.port || 25565;
      const maxPlayers = config.maxPlayers || 10;
      const ram = config.ram || 2048;
      const name = config.name || `Server-${serverId}`;
      const queryPort = gameConfig.queryPort || port + 1;
      
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
      const hasRealError = executeResult.stdout?.includes('ERROR') || 
                          executeResult.stdout?.includes('HIBA') ||
                          executeResult.stderr?.includes('ERROR') ||
                          executeResult.stderr?.includes('HIBA');
      
      // Ha exit code 8 és nincs valódi hiba a logban, lehet, hogy csak warning
      // De ha van valódi hiba vagy más exit code, akkor hibát dobunk
      if (executeResult.exitCode !== 0 && (executeResult.exitCode !== 8 || hasRealError)) {
        const error = `Telepítési script sikertelen (exit code: ${executeResult.exitCode}): ${executeResult.stderr || executeResult.stdout || 'Ismeretlen hiba'}`;
        
        logger.error('Installation script failed', new Error(executeResult.stderr || executeResult.stdout || 'Unknown error'), {
          serverId,
          gameType,
          scriptPath,
          logPath,
          exitCode: executeResult.exitCode,
          stdout: executeResult.stdout,
          stderr: executeResult.stderr,
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
            message: error,
            progress: 30,
            error,
          });
          await appendInstallLog(serverId, `HIBA: ${error}`);
        }
        
        throw new Error(error);
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
    
    const configContent = generateConfigFile(gameType, config, gameConfig);
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
      
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `mkdir -p $(dirname ${configPath}) && cat > ${configPath} << 'EOF'\n${configContent}\nEOF`
      );
      
      if (writeProgress) {
        await appendInstallLog(serverId, `Konfigurációs fájl létrehozva: ${configPath}`);
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
    
    await createSystemdServiceForServer(serverId, gameType, gameConfig, config, machine, {
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
      
      await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `systemctl enable ${serviceName} && systemctl start ${serviceName}`
      );
      
      if (writeProgress) {
        await appendInstallLog(serverId, 'Systemd service sikeresen elindítva');
      }
      
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
function generateConfigFile(
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
      return `
<property name="ServerName" value="${name}"/>
<property name="ServerPort" value="${port}"/>
<property name="ServerMaxPlayerCount" value="${maxPlayers}"/>
<property name="ServerPassword" value="${config.password || ''}"/>
      `.trim();

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
  
  // Alapértelmezett értékek beállítása, ha hiányoznak
  const port = (config.port && typeof config.port === 'number') ? config.port : 25565;
  const maxPlayers = (config.maxPlayers && typeof config.maxPlayers === 'number') ? config.maxPlayers : 10;
  const ram = (config.ram && typeof config.ram === 'number') ? config.ram : 2048;
  const name = (config.name && typeof config.name === 'string') ? config.name : `Server-${serverId}`;
  
  // Ellenőrizzük, hogy a gameConfig létezik-e
  if (!gameConfig || typeof gameConfig !== 'object') {
    throw new Error(`GameConfig objektum hiányzik vagy érvénytelen: ${JSON.stringify(gameConfig)}`);
  }
  
  // Ellenőrizzük, hogy a startCommand létezik-e
  if (!gameConfig.startCommand || typeof gameConfig.startCommand !== 'string') {
    throw new Error(`GameConfig.startCommand hiányzik vagy érvénytelen: ${gameConfig.startCommand}`);
  }
  
  let startCommand = gameConfig.startCommand;
  
  // ARK-nál a közös fájlokat használjuk, de az instance könyvtárban dolgozunk
  if (paths?.isARK && paths.sharedPath) {
    // ARK start command a közös binárist használja, de az instance Saved könyvtárát
    const map = config.map || 'TheIsland';
    const queryPort = gameConfig.queryPort || port + 1;
    const adminPassword = config.adminPassword || 'changeme';
    
    startCommand = `cd ${paths.sharedPath} && ./ShooterGame/Binaries/Linux/ShooterGameServer ${map}?listen?Port=${port}?QueryPort=${queryPort}?ServerAdminPassword=${adminPassword} -servergamelog -servergamelogincludetribelogs -NoBattlEye -UseBattlEye -clusterid=${config.clusterId || ''} -ClusterDirOverride=${paths.serverPath}/ShooterGame/Saved`;
  } else {
    // Normál játékok
    startCommand = startCommand
      .replace(/{port}/g, port.toString())
      .replace(/{maxPlayers}/g, maxPlayers.toString())
      .replace(/{ram}/g, ram.toString())
      .replace(/{name}/g, name)
      .replace(/{world}/g, config.world || 'Dedicated')
      .replace(/{password}/g, config.password || '')
      .replace(/{adminPassword}/g, config.adminPassword || 'changeme')
      .replace(/{queryPort}/g, (gameConfig.queryPort || port + 1).toString())
      .replace(/{map}/g, config.map || 'TheIsland');
  }

  const workingDir = paths?.serverPath || `/opt/servers/${serverId}`;
  const execDir = paths?.isARK && paths.sharedPath ? paths.sharedPath : workingDir;

  // Ha a játék Wine-t használ (pl. The Forest), létrehozunk egy wrapper scriptet
  let finalStartCommand = startCommand;
  let useWrapperScript = false;
  
  if (gameType === 'THE_FOREST' || startCommand.includes('wine') || startCommand.includes('xvfb-run')) {
    useWrapperScript = true;
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
if echo "${startCommand}" | grep -q "TheForestDedicatedServer.exe"; then
  echo "The Forest szerver észlelve, save könyvtár ellenőrzése..."
  mkdir -p ./savefilesserver
  chmod 755 ./savefilesserver
  echo "Save könyvtár: $(pwd)/savefilesserver"
fi

# Szerver futtatása
set -e
${startCommand.replace(/"/g, '\\"')}
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
  
  // Systemd service fájl tartalom
  // Fontos: minden kulcs=érték pár egy sorban kell legyen, nincs sortörés
  const serviceContent = `[Unit]
Description=Game Server ${serverId} (${gameType})
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${execDir}
ExecStart=${escapedStartCommand}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

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
