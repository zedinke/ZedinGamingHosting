import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, appendFile } from 'fs/promises';

import { join } from 'path';

const execAsync = promisify(exec);

// Progress tracking fájl
const PROGRESS_FILE = join(process.cwd(), '.update-progress.json');
const LOG_FILE = join(process.cwd(), '.update-log.txt');

async function readLog(logFile?: string): Promise<string> {
  try {
    const data = await readFile(logFile || LOG_FILE, 'utf-8');
    return data;
  } catch {
    return '';
  }
}

async function updateProgress(progress: any, progressFile?: string) {
  try {
    const filePath = progressFile || PROGRESS_FILE;
    // Biztosítjuk, hogy a progress mindig tartalmazza a timestamp-et
    const progressWithTimestamp = {
      ...progress,
      timestamp: progress.timestamp || new Date().toISOString(),
    };
    await writeFile(filePath, JSON.stringify(progressWithTimestamp, null, 2), 'utf-8');
    console.log('Progress frissítve:', progressWithTimestamp.status, progressWithTimestamp.progress + '%', '->', filePath);
  } catch (error: any) {
    console.error('Error writing progress file:', error);
    console.error('Progress file path:', progressFile || PROGRESS_FILE);
    // Ne throw-oljuk, hogy ne álljon le a teljes process
    // Csak logoljuk a hibát
  }
}

async function appendLog(message: string, logFile?: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    await appendFile(logFile || LOG_FILE, logMessage);
  } catch (error) {
    console.error('Log write error:', error);
    console.error('Log file path:', logFile || LOG_FILE);
  }
}

async function clearLog(logFile?: string) {
  try {
    await writeFile(logFile || LOG_FILE, '');
  } catch (error) {
    console.error('Log clear error:', error);
    console.error('Log file path:', logFile || LOG_FILE);
  }
}

async function getProgress() {
  try {
    const data = await readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      status: 'idle',
      message: 'Nincs aktív frissítés',
      progress: 0,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Ellenőrizzük, hogy van-e már futó frissítés
    const currentProgress = await getProgress();
    if (
      currentProgress.status === 'in_progress' ||
      currentProgress.status === 'starting'
    ) {
      return NextResponse.json(
        { error: 'Már van egy frissítés folyamatban' },
        { status: 400 }
      );
    }

    // Ha van régi progress fájl (completed vagy error), töröljük
    if (
      currentProgress.status === 'completed' ||
      currentProgress.status === 'error' ||
      currentProgress.status === 'idle'
    ) {
      // Töröljük a progress fájlt, hogy új frissítés indítható legyen
      try {
        const { unlink } = await import('fs/promises');
        await unlink(PROGRESS_FILE).catch(() => {
          // Ha nincs fájl, nem probléma
        });
      } catch {
        // Nem kritikus hiba
      }
    }

    // Progress fájl létrehozása azonnal
    try {
      await updateProgress({
        status: 'starting',
        message: 'Frissítés indítása...',
        progress: 0,
        currentStep: 'starting',
        log: 'Frissítés indítása...\n',
        timestamp: new Date().toISOString(),
      });
      console.log('Progress fájl létrehozva:', PROGRESS_FILE);
    } catch (progressError: any) {
      console.error('Progress fájl létrehozási hiba:', progressError);
      return NextResponse.json(
        { error: `Progress fájl létrehozási hiba: ${progressError.message}` },
        { status: 500 }
      );
    }

    // Frissítés indítása háttérben (nem blokkoló módon)
    // Ne várjuk meg, hogy a process befejeződjön
    console.log('=== Frissítési process indítása ===');
    console.log('Current working directory:', process.cwd());
    console.log('Progress file will be at:', PROGRESS_FILE);
    
    // Biztosítjuk, hogy a process elindul, még akkor is, ha hiba van
    (async () => {
      try {
        await startUpdateProcess();
        console.log('=== Frissítési process sikeresen befejezve ===');
      } catch (error: any) {
        console.error('=== Update process error ===', error);
        console.error('Error stack:', error?.stack);
        const errorMessage = error?.message || error?.toString() || 'Ismeretlen hiba';
        try {
          await updateProgress({
            status: 'error',
            message: 'Frissítési hiba',
            progress: 0,
            error: errorMessage,
            log: await readLog(),
            timestamp: new Date().toISOString(),
          });
        } catch (updateError) {
          console.error('Progress frissítési hiba:', updateError);
        }
      }
    })();

    // Várunk egy kicsit, hogy biztosan létrejöjjön a progress fájl
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Frissítés elindítva',
    });
  } catch (error) {
    console.error('Update start error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a frissítés indítása során' },
      { status: 500 }
    );
  }
}

async function startUpdateProcess() {
  try {
    console.log('=== startUpdateProcess elindítva ===');
    
    // Determine correct working directory
    // In standalone build, we need to go to project root
    let workingDir = process.cwd();
    const isStandalone = workingDir.includes('.next/standalone') || require('fs').existsSync(require('path').join(workingDir, 'server.js'));
    
    if (isStandalone && workingDir.includes('.next/standalone')) {
      // Go up to project root
      workingDir = require('path').join(workingDir, '..', '..', '..');
      console.log('Standalone build detected, using project root:', workingDir);
    }
    
    // Update PROGRESS_FILE and LOG_FILE paths
    const actualProgressFile = require('path').join(workingDir, '.update-progress.json');
    const actualLogFile = require('path').join(workingDir, '.update-log.txt');
    
    // Update global variables for this process
    PROGRESS_FILE = actualProgressFile;
    LOG_FILE = actualLogFile;
    WORKING_DIR = workingDir;
    
    console.log('Working directory:', workingDir);
    console.log('Progress file path:', actualProgressFile);
    console.log('Log file path:', actualLogFile);
    
    // Test file write permissions
    try {
      await writeFile(actualProgressFile, JSON.stringify({ test: true }), 'utf-8');
      console.log('✓ Progress file write test successful');
    } catch (writeError: any) {
      console.error('✗ Progress file write test failed:', writeError.message);
      throw new Error(`Nem lehet írni a progress fájlba: ${writeError.message}`);
    }
    
    await clearLog(actualLogFile);
    await appendLog('=== Frissítés indítása ===', actualLogFile);
    console.log('Log fájl törölve');
    
    // Progress frissítése azonnal
    await updateProgress({
      status: 'in_progress',
      message: 'Frissítési folyamat elindítva...',
      progress: 5,
      currentStep: 'initializing',
      log: await readLog(actualLogFile),
      timestamp: new Date().toISOString(),
    }, actualProgressFile);
    console.log('Progress frissítve: in_progress, 5%');
    
    const steps = [
      {
        key: 'git_pull',
        label: 'Git változások letöltése',
        action: async () => {
        await appendLog('→ Git változások letöltése...', LOG_FILE);
        await updateProgress({
          status: 'in_progress',
          message: 'Git változások letöltése...',
          progress: 10,
          currentStep: 'git_pull',
          log: await readLog(LOG_FILE),
        }, PROGRESS_FILE);
        
        try {
          // Először fetch (nem pull, hogy ne legyen merge conflict)
          await appendLog('  - Fetch origin main...', LOG_FILE);
          const { stdout: fetchOutput, stderr: fetchError } = await execAsync('git fetch origin main', { 
            cwd: WORKING_DIR,
            timeout: 60000, // 60 másodperc timeout
          });
          await appendLog(`  ${fetchOutput || fetchError || 'Fetch sikeres'}`, LOG_FILE);
          
          // Ellenőrizzük, hogy van-e változás
          await appendLog('  - Git status ellenőrzése...', LOG_FILE);
          const { stdout: statusOutput } = await execAsync('git status -sb', { 
            cwd: WORKING_DIR,
            timeout: 10000, // 10 másodperc timeout
          });
          await appendLog(`  Status: ${statusOutput.substring(0, 100)}...`, LOG_FILE);
          
          // Ha van változás, pull merge strategy-vel
          if (statusOutput.includes('behind')) {
            // Merge strategy beállítása (ha nincs beállítva)
            try {
              await execAsync('git config pull.rebase false', { cwd: WORKING_DIR });
              await appendLog('  - Merge strategy beállítva (no-rebase)', LOG_FILE);
            } catch {
              // Nem kritikus hiba
            }
            
            // Pull hard reset-tel (ha van conflict, akkor a remote verziót használjuk)
            try {
              await appendLog('  - Git pull futtatása...', LOG_FILE);
              const { stdout: pullOutput, stderr: pullError } = await execAsync('git pull origin main --no-rebase', { 
                cwd: WORKING_DIR,
                timeout: 60000, // 60 másodperc timeout
              });
              await appendLog(`  ${pullOutput || pullError || 'Pull sikeres'}`, LOG_FILE);
            } catch (pullError: any) {
              // Ha merge conflict van, reset hard-ot használunk
              if (pullError.message.includes('conflict') || pullError.message.includes('merge')) {
                await appendLog('  ⚠️  Merge conflict észlelve, hard reset...', LOG_FILE);
                await updateProgress({
                  status: 'in_progress',
                  message: 'Merge conflict feloldása (remote verzió használata)...',
                  progress: 12,
                  currentStep: 'git_pull',
                  log: await readLog(LOG_FILE),
                }, PROGRESS_FILE);
                const { stdout: resetOutput } = await execAsync('git reset --hard origin/main', { 
                  cwd: WORKING_DIR,
                  timeout: 30000, // 30 másodperc timeout
                });
                await appendLog(`  ${resetOutput || 'Reset sikeres'}`, LOG_FILE);
              } else {
                await appendLog(`  ❌ Pull hiba: ${pullError.message}`, LOG_FILE);
                throw pullError;
              }
            }
          } else {
            await appendLog('  ✓ Nincs új változás', LOG_FILE);
            await updateProgress({
              status: 'in_progress',
              message: 'Nincs új változás a Git-ben',
              progress: 15,
              currentStep: 'git_pull',
              log: await readLog(LOG_FILE),
            }, PROGRESS_FILE);
          }
        } catch (error: any) {
          // Részletes hibaüzenet
          const errorMessage = error.stderr || error.message || 'Ismeretlen hiba';
          await appendLog(`  ❌ Hiba: ${errorMessage}`, LOG_FILE);
          throw new Error(`Git pull hiba: ${errorMessage}`);
        }
      },
      },
    {
      key: 'npm_install',
      label: 'Függőségek telepítése',
      action: async () => {
          await appendLog('→ Függőségek telepítése...', LOG_FILE);
        await updateProgress({
          status: 'in_progress',
          message: 'Függőségek telepítése...',
          progress: 30,
          currentStep: 'npm_install',
          log: await readLog(LOG_FILE),
        }, PROGRESS_FILE);
        try {
          await appendLog('  - npm install futtatása (ez eltarthat néhány percig)...', LOG_FILE);
          const { stdout, stderr } = await execAsync('npm install --legacy-peer-deps', { 
            cwd: WORKING_DIR,
            maxBuffer: 1024 * 1024 * 10,
            timeout: 600000, // 10 perc timeout (npm install hosszú lehet)
          });
          await appendLog(`  ${stdout || stderr || 'NPM install sikeres'}`, LOG_FILE);
          await updateProgress({
            status: 'in_progress',
            message: 'Függőségek telepítése befejezve...',
            progress: 50,
            currentStep: 'npm_install',
            log: await readLog(LOG_FILE),
          }, PROGRESS_FILE);
        } catch (error: any) {
          await appendLog(`  ❌ NPM install hiba: ${error.message}`, LOG_FILE);
          throw error;
        }
      },
    },
    {
      key: 'db_migrate',
      label: 'Adatbázis migrációk',
      action: async () => {
        await appendLog('→ Adatbázis migrációk...', LOG_FILE);
        await updateProgress({
          status: 'in_progress',
          message: 'Adatbázis migrációk futtatása...',
          progress: 50,
          currentStep: 'db_migrate',
          log: await readLog(LOG_FILE),
        }, PROGRESS_FILE);
        try {
          await appendLog('  - Prisma client generálása...', LOG_FILE);
          const { stdout: genOutput } = await execAsync('npm run db:generate', { 
            cwd: WORKING_DIR,
            timeout: 120000, // 2 perc timeout
          });
          await appendLog(`  ${genOutput || 'Prisma generate sikeres'}`, LOG_FILE);
          await updateProgress({
            status: 'in_progress',
            message: 'Adatbázis migrációk futtatása...',
            progress: 55,
            currentStep: 'db_migrate',
            log: await readLog(LOG_FILE),
          }, PROGRESS_FILE);
          
          await appendLog('  - Adatbázis séma frissítése...', LOG_FILE);
          const { stdout: pushOutput } = await execAsync('npm run db:push', { 
            cwd: WORKING_DIR,
            timeout: 120000, // 2 perc timeout
          });
          await appendLog(`  ${pushOutput || 'DB push sikeres'}`, LOG_FILE);
        } catch (error: any) {
          await appendLog(`  ❌ DB migráció hiba: ${error.message}`, LOG_FILE);
          throw error;
        }
      },
    },
    {
      key: 'docker_build',
      label: 'Production build',
      action: async () => {
        await appendLog('→ Production build...', LOG_FILE);
        await updateProgress({
          status: 'in_progress',
          message: 'Production build készítése...',
          progress: 70,
          currentStep: 'docker_build',
          log: await readLog(LOG_FILE),
        }, PROGRESS_FILE);
        try {
          // Először próbáljuk a Docker-t
          await appendLog('  - Docker build próbálása...', LOG_FILE);
          try {
            const { stdout: dockerOutput } = await execAsync('docker-compose build', { 
              cwd: WORKING_DIR, 
              maxBuffer: 1024 * 1024 * 10,
              timeout: 600000, // 10 perc timeout
            });
            await appendLog(`  ${dockerOutput || 'Docker build sikeres'}`, LOG_FILE);
          } catch (dockerError) {
            // Ha nincs docker-compose, akkor Next.js build (standalone módban)
            await appendLog('  - Docker nem elérhető, Next.js build használata...', LOG_FILE);
            await appendLog(`  - Build working directory: ${WORKING_DIR}`, LOG_FILE);
            
            // Ellenőrizzük, hogy van-e app vagy pages mappa
            const fs = require('fs');
            const path = require('path');
            const appDir = path.join(WORKING_DIR, 'app');
            const pagesDir = path.join(WORKING_DIR, 'pages');
            
            if (!fs.existsSync(appDir) && !fs.existsSync(pagesDir)) {
              throw new Error(`Nem található 'app' vagy 'pages' mappa a következő helyen: ${WORKING_DIR}`);
            }
            
            const { stdout: buildOutput } = await execAsync('npm run build', { 
              cwd: WORKING_DIR,
              maxBuffer: 1024 * 1024 * 10,
              timeout: 600000, // 10 perc timeout
            });
            await appendLog(`  ${buildOutput || 'Next.js build sikeres'}`, LOG_FILE);
          }
        } catch (error: any) {
          await appendLog(`  ❌ Build hiba: ${error.message}`, LOG_FILE);
          throw error;
        }
      },
    },
    {
      key: 'docker_restart',
      label: 'Docker újraindítás',
      action: async () => {
        await appendLog('→ Szolgáltatások újraindítása...', LOG_FILE);
        await updateProgress({
          status: 'in_progress',
          message: 'Szolgáltatások újraindítása...',
          progress: 90,
          currentStep: 'docker_restart',
          log: await readLog(LOG_FILE),
        }, PROGRESS_FILE);
        try {
          // Először próbáljuk a Docker-t
          await appendLog('  - Docker restart próbálása...', LOG_FILE);
          try {
            const { stdout: dockerOutput } = await execAsync('docker-compose up -d', { 
              cwd: WORKING_DIR,
              timeout: 120000, // 2 perc timeout
            });
            await appendLog(`  ${dockerOutput || 'Docker restart sikeres'}`, LOG_FILE);
          } catch (dockerError) {
            // Ha nincs docker, akkor PM2 restart (standalone módban)
            await appendLog('  - Docker nem elérhető, PM2 restart használata...', LOG_FILE);
            try {
              // Először próbáljuk megkeresni a PM2 process-t
              let pm2ProcessName = 'zedingaming';
              try {
                const { stdout: pm2List } = await execAsync('pm2 list --no-color', { 
                  cwd: WORKING_DIR,
                  timeout: 10000, // 10 másodperc timeout
                });
                // Keresünk egy aktív Next.js process-t
                const lines = pm2List.split('\n');
                for (const line of lines) {
                  if (line.includes('node') || line.includes('next') || line.includes('npm')) {
                    const match = line.match(/\│\s+(\w+)\s+│/);
                    if (match && match[1] && match[1] !== 'name') {
                      pm2ProcessName = match[1];
                      await appendLog(`  - PM2 process név: ${pm2ProcessName}`, LOG_FILE);
                      break;
                    }
                  }
                }
              } catch {
                // Ha nem sikerül, használjuk az alapértelmezett nevet
              }
              
              // Próbáljuk restart-olni az összes PM2 process-t, ha nem találunk specifikust
              try {
                const { stdout: pm2Output } = await execAsync(`pm2 restart ${pm2ProcessName}`, { 
                  cwd: WORKING_DIR,
                  timeout: 30000, // 30 másodperc timeout
                });
                await appendLog(`  ${pm2Output || 'PM2 restart sikeres'}`, LOG_FILE);
              } catch {
                // Ha a specifikus process nem létezik, próbáljuk az összeset
                await appendLog('  - Specifikus process nem található, összes PM2 process restart...', LOG_FILE);
                const { stdout: pm2Output } = await execAsync('pm2 restart all', { 
                  cwd: WORKING_DIR,
                  timeout: 30000, // 30 másodperc timeout
                });
                await appendLog(`  ${pm2Output || 'PM2 restart all sikeres'}`, LOG_FILE);
              }
            } catch (pm2Error: any) {
              // Ha nincs PM2 sem, akkor csak build
              await appendLog(`  ⚠️  PM2 nem elérhető: ${pm2Error.message || 'Ismeretlen hiba'}`, LOG_FILE);
              console.log('No PM2 or Docker found, skipping restart');
            }
          }
        } catch (error: any) {
          await appendLog(`  ❌ Restart hiba: ${error.message}`, LOG_FILE);
          throw error;
        }
      },
    },
  ];

    console.log(`Frissítési lépések száma: ${steps.length}`);
    await appendLog(`Összesen ${steps.length} lépés lesz végrehajtva`, LOG_FILE);
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        console.log(`[${i + 1}/${steps.length}] Lépés indítása: ${step.label} (${step.key})`);
        await appendLog(`[${i + 1}/${steps.length}] Lépés: ${step.label}`, LOG_FILE);
        await step.action();
        console.log(`[${i + 1}/${steps.length}] Lépés befejezve: ${step.label}`);
        await appendLog(`✓ ${step.label} sikeresen befejezve`, LOG_FILE);
      } catch (error: any) {
        console.error(`[${i + 1}/${steps.length}] Lépés hiba: ${step.label}`, error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
        });
        const errorMessage = error.message || error.toString() || 'Ismeretlen hiba';
        await appendLog(`❌ ${step.label} hiba: ${errorMessage}`, LOG_FILE);
        await updateProgress({
          status: 'error',
          message: `${step.label} hiba`,
          progress: 0,
          currentStep: step.key,
          error: errorMessage,
          stepLabel: step.label,
          log: await readLog(LOG_FILE),
          timestamp: new Date().toISOString(),
        }, PROGRESS_FILE);
        throw new Error(`${step.label} hiba: ${errorMessage}`);
      }
    }

    // Frissítés befejezve
    console.log('=== Frissítés sikeresen befejezve! ===');
    await appendLog('=== Frissítés sikeresen befejezve! ===', LOG_FILE);
    await updateProgress({
      status: 'completed',
      message: 'Frissítés sikeresen befejezve!',
      progress: 100,
      currentStep: 'completed',
      log: await readLog(LOG_FILE),
      timestamp: new Date().toISOString(),
    }, PROGRESS_FILE);

    // Utolsó frissítés időpont mentése
    await prisma.setting.upsert({
      where: { key: 'last_update' },
      update: { value: new Date().toISOString() },
      create: {
        key: 'last_update',
        value: new Date().toISOString(),
      },
    });

    // Progress fájl törlése 5 másodperc után (hogy új frissítés indítható legyen)
    setTimeout(async () => {
      try {
        const { unlink } = await import('fs/promises');
        await unlink(PROGRESS_FILE).catch(() => {
          // Ha nincs fájl, nem probléma
        });
      } catch {
        // Nem kritikus hiba
      }
    }, 5000);
  } catch (error: any) {
    console.error('=== startUpdateProcess HIBÁBA ÜTKÖZÖTT ===', error);
    const errorMessage = error.message || error.toString() || 'Ismeretlen hiba';
    await appendLog(`=== HIBÁBA ÜTKÖZÖTT: ${errorMessage} ===`, LOG_FILE);
    try {
      await updateProgress({
        status: 'error',
        message: 'Frissítési hiba',
        progress: 0,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        log: await readLog(LOG_FILE),
      }, PROGRESS_FILE);
    } catch (updateError) {
      console.error('Progress frissítési hiba a catch blokkban:', updateError);
    }

    // Hiba esetén is töröljük a progress fájlt 10 másodperc után
    setTimeout(async () => {
      try {
        const { unlink } = await import('fs/promises');
        await unlink(PROGRESS_FILE).catch(() => {
          // Ha nincs fájl, nem probléma
        });
      } catch {
        // Nem kritikus hiba
      }
    }, 10000);
  }
}

