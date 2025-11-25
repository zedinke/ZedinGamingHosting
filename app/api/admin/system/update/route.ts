import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';

async function readLog(): Promise<string> {
  try {
    const data = await readFile(LOG_FILE, 'utf-8');
    return data;
  } catch {
    return '';
  }
}
import { join } from 'path';

const execAsync = promisify(exec);

// Progress tracking fájl
const PROGRESS_FILE = join(process.cwd(), '.update-progress.json');
const LOG_FILE = join(process.cwd(), '.update-log.txt');

async function updateProgress(progress: any) {
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function appendLog(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    await writeFile(LOG_FILE, logMessage, { flag: 'a' });
  } catch (error) {
    console.error('Log write error:', error);
  }
}

async function clearLog() {
  try {
    await writeFile(LOG_FILE, '');
  } catch (error) {
    console.error('Log clear error:', error);
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
    await updateProgress({
      status: 'starting',
      message: 'Frissítés indítása...',
      progress: 0,
      currentStep: 'starting',
      log: 'Frissítés indítása...\n',
    });

    // Frissítés indítása háttérben (nem blokkoló módon)
    startUpdateProcess().catch(async (error) => {
      console.error('Update process error:', error);
      const errorMessage = error.message || error.toString() || 'Ismeretlen hiba';
      await updateProgress({
        status: 'error',
        message: 'Frissítési hiba',
        progress: 0,
        error: errorMessage,
        log: await readLog(),
      });
    });

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
    await clearLog();
    await appendLog('=== Frissítés indítása ===');
    
    const steps = [
      {
        key: 'git_pull',
        label: 'Git változások letöltése',
        action: async () => {
        await appendLog('→ Git változások letöltése...');
        await updateProgress({
          status: 'in_progress',
          message: 'Git változások letöltése...',
          progress: 10,
          currentStep: 'git_pull',
          log: await readLog(),
        });
        
        try {
          // Először fetch (nem pull, hogy ne legyen merge conflict)
          await appendLog('  - Fetch origin main...');
          const { stdout: fetchOutput, stderr: fetchError } = await execAsync('git fetch origin main', { cwd: process.cwd() });
          await appendLog(`  ${fetchOutput || fetchError || 'Fetch sikeres'}`);
          
          // Ellenőrizzük, hogy van-e változás
          await appendLog('  - Git status ellenőrzése...');
          const { stdout: statusOutput } = await execAsync('git status -sb', { cwd: process.cwd() });
          await appendLog(`  Status: ${statusOutput.substring(0, 100)}...`);
          
          // Ha van változás, pull merge strategy-vel
          if (statusOutput.includes('behind')) {
            // Merge strategy beállítása (ha nincs beállítva)
            try {
              await execAsync('git config pull.rebase false', { cwd: process.cwd() });
              await appendLog('  - Merge strategy beállítva (no-rebase)');
            } catch {
              // Nem kritikus hiba
            }
            
            // Pull hard reset-tel (ha van conflict, akkor a remote verziót használjuk)
            try {
              await appendLog('  - Git pull futtatása...');
              const { stdout: pullOutput, stderr: pullError } = await execAsync('git pull origin main --no-rebase', { cwd: process.cwd() });
              await appendLog(`  ${pullOutput || pullError || 'Pull sikeres'}`);
            } catch (pullError: any) {
              // Ha merge conflict van, reset hard-ot használunk
              if (pullError.message.includes('conflict') || pullError.message.includes('merge')) {
                await appendLog('  ⚠️  Merge conflict észlelve, hard reset...');
                await updateProgress({
                  status: 'in_progress',
                  message: 'Merge conflict feloldása (remote verzió használata)...',
                  progress: 12,
                  currentStep: 'git_pull',
                  log: await readLog(),
                });
                const { stdout: resetOutput } = await execAsync('git reset --hard origin/main', { cwd: process.cwd() });
                await appendLog(`  ${resetOutput || 'Reset sikeres'}`);
              } else {
                await appendLog(`  ❌ Pull hiba: ${pullError.message}`);
                throw pullError;
              }
            }
          } else {
            await appendLog('  ✓ Nincs új változás');
            await updateProgress({
              status: 'in_progress',
              message: 'Nincs új változás a Git-ben',
              progress: 15,
              currentStep: 'git_pull',
              log: await readLog(),
            });
          }
        } catch (error: any) {
          // Részletes hibaüzenet
          const errorMessage = error.stderr || error.message || 'Ismeretlen hiba';
          await appendLog(`  ❌ Hiba: ${errorMessage}`);
          throw new Error(`Git pull hiba: ${errorMessage}`);
        }
      },
      },
    {
      key: 'npm_install',
      label: 'Függőségek telepítése',
      action: async () => {
        await appendLog('→ Függőségek telepítése...');
        await updateProgress({
          status: 'in_progress',
          message: 'Függőségek telepítése...',
          progress: 30,
          currentStep: 'npm_install',
          log: await readLog(),
        });
        try {
          await appendLog('  - npm install futtatása (ez eltarthat néhány percig)...');
          const { stdout, stderr } = await execAsync('npm install --legacy-peer-deps', { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 });
          await appendLog(`  ${stdout || stderr || 'NPM install sikeres'}`);
          await updateProgress({
            status: 'in_progress',
            message: 'Függőségek telepítése befejezve...',
            progress: 50,
            currentStep: 'npm_install',
            log: await readLog(),
          });
        } catch (error: any) {
          await appendLog(`  ❌ NPM install hiba: ${error.message}`);
          throw error;
        }
      },
    },
    {
      key: 'db_migrate',
      label: 'Adatbázis migrációk',
      action: async () => {
        await appendLog('→ Adatbázis migrációk...');
        await updateProgress({
          status: 'in_progress',
          message: 'Adatbázis migrációk futtatása...',
          progress: 50,
          currentStep: 'db_migrate',
          log: await readLog(),
        });
        try {
          await appendLog('  - Prisma client generálása...');
          const { stdout: genOutput } = await execAsync('npm run db:generate', { cwd: process.cwd() });
          await appendLog(`  ${genOutput || 'Prisma generate sikeres'}`);
          await updateProgress({
            status: 'in_progress',
            message: 'Adatbázis migrációk futtatása...',
            progress: 55,
            currentStep: 'db_migrate',
            log: await readLog(),
          });
          
          await appendLog('  - Adatbázis séma frissítése...');
          const { stdout: pushOutput } = await execAsync('npm run db:push', { cwd: process.cwd() });
          await appendLog(`  ${pushOutput || 'DB push sikeres'}`);
        } catch (error: any) {
          await appendLog(`  ❌ DB migráció hiba: ${error.message}`);
          throw error;
        }
      },
    },
    {
      key: 'docker_build',
      label: 'Production build',
      action: async () => {
        await appendLog('→ Production build...');
        await updateProgress({
          status: 'in_progress',
          message: 'Production build készítése...',
          progress: 70,
          currentStep: 'docker_build',
          log: await readLog(),
        });
        try {
          // Először próbáljuk a Docker-t
          await appendLog('  - Docker build próbálása...');
          try {
            const { stdout: dockerOutput } = await execAsync('docker-compose build', { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 });
            await appendLog(`  ${dockerOutput || 'Docker build sikeres'}`);
          } catch (dockerError) {
            // Ha nincs docker-compose, akkor Next.js build (standalone módban)
            await appendLog('  - Docker nem elérhető, Next.js build használata...');
            const { stdout: buildOutput } = await execAsync('npm run build', { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 });
            await appendLog(`  ${buildOutput || 'Next.js build sikeres'}`);
          }
        } catch (error: any) {
          await appendLog(`  ❌ Build hiba: ${error.message}`);
          throw error;
        }
      },
    },
    {
      key: 'docker_restart',
      label: 'Docker újraindítás',
      action: async () => {
        await appendLog('→ Szolgáltatások újraindítása...');
        await updateProgress({
          status: 'in_progress',
          message: 'Szolgáltatások újraindítása...',
          progress: 90,
          currentStep: 'docker_restart',
          log: await readLog(),
        });
        try {
          // Először próbáljuk a Docker-t
          await appendLog('  - Docker restart próbálása...');
          try {
            const { stdout: dockerOutput } = await execAsync('docker-compose up -d', { cwd: process.cwd() });
            await appendLog(`  ${dockerOutput || 'Docker restart sikeres'}`);
          } catch (dockerError) {
            // Ha nincs docker, akkor PM2 restart (standalone módban)
            await appendLog('  - Docker nem elérhető, PM2 restart használata...');
            try {
              const { stdout: pm2Output } = await execAsync('pm2 restart zedingaming', { cwd: process.cwd() });
              await appendLog(`  ${pm2Output || 'PM2 restart sikeres'}`);
            } catch (pm2Error) {
              // Ha nincs PM2 sem, akkor csak build
              await appendLog('  ⚠️  PM2 nem elérhető, restart kihagyva');
              console.log('No PM2 or Docker found, skipping restart');
            }
          }
        } catch (error: any) {
          await appendLog(`  ❌ Restart hiba: ${error.message}`);
          throw error;
        }
      },
    },
  ];

    for (const step of steps) {
      try {
        await step.action();
      } catch (error: any) {
        const errorMessage = error.message || error.toString() || 'Ismeretlen hiba';
        await updateProgress({
          status: 'error',
          message: `${step.label} hiba`,
          progress: 0,
          currentStep: step.key,
          error: errorMessage,
          stepLabel: step.label,
        });
        throw new Error(`${step.label} hiba: ${errorMessage}`);
      }
    }

    // Frissítés befejezve
    await appendLog('=== Frissítés sikeresen befejezve! ===');
    await updateProgress({
      status: 'completed',
      message: 'Frissítés sikeresen befejezve!',
      progress: 100,
      currentStep: 'completed',
      log: await readLog(),
    });

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
    const errorMessage = error.message || error.toString() || 'Ismeretlen hiba';
    await appendLog(`=== HIBÁBA ÜTKÖZÖTT: ${errorMessage} ===`);
    await updateProgress({
      status: 'error',
      message: 'Frissítési hiba',
      progress: 0,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      log: await readLog(),
    });

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

