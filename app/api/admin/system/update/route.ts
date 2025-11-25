import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, appendFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// Get project root directory
function getProjectRoot(): string {
  let currentDir = process.cwd();
  
  // If we're in .next/standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    // Go up: .next/standalone -> .next -> project root
    currentDir = resolve(currentDir, '..', '..');
  }
  
  // Verify it's the project root by checking for package.json
  if (existsSync(join(currentDir, 'package.json'))) {
    return currentDir;
  }
  
  // Fallback: try going up one more level
  const parentDir = resolve(currentDir, '..');
  if (existsSync(join(parentDir, 'package.json'))) {
    return parentDir;
  }
  
  // Last resort: use current directory
  return currentDir;
}

const PROJECT_ROOT = getProjectRoot();
const PROGRESS_FILE = join(PROJECT_ROOT, '.update-progress.json');
const LOG_FILE = join(PROJECT_ROOT, '.update-log.txt');

console.log('Update system initialized:', {
  projectRoot: PROJECT_ROOT,
  progressFile: PROGRESS_FILE,
  logFile: LOG_FILE,
});

async function writeProgress(progress: any) {
  try {
    const progressWithTimestamp = {
      ...progress,
      timestamp: new Date().toISOString(),
    };
    await writeFile(PROGRESS_FILE, JSON.stringify(progressWithTimestamp, null, 2), 'utf-8');
    console.log('Progress updated:', progress.status, progress.progress + '%');
  } catch (error: any) {
    console.error('Error writing progress:', error.message);
  }
}

async function appendLog(message: string) {
  try {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    await appendFile(LOG_FILE, logMessage);
  } catch (error: any) {
    console.error('Error writing log:', error.message);
  }
}

async function clearLog() {
  try {
    await writeFile(LOG_FILE, '', 'utf-8');
  } catch (error: any) {
    console.error('Error clearing log:', error.message);
  }
}

async function readProgress() {
  try {
    if (!existsSync(PROGRESS_FILE)) {
      return { status: 'idle', message: 'Nincs aktív frissítés', progress: 0, log: '' };
    }
    const data = await readFile(PROGRESS_FILE, 'utf-8');
    const progress = JSON.parse(data);
    
    // Add log to progress
    try {
      const log = await readFile(LOG_FILE, 'utf-8');
      progress.log = log;
    } catch {
      progress.log = '';
    }
    
    return progress;
  } catch (error) {
    return { status: 'idle', message: 'Nincs aktív frissítés', progress: 0, log: '' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    // Check if update is already running
    const currentProgress = await readProgress();
    if (currentProgress.status === 'in_progress' || currentProgress.status === 'starting') {
      return NextResponse.json(
        { error: 'Már van egy frissítés folyamatban' },
        { status: 400 }
      );
    }

    // Clear old progress and log files
    try {
      if (existsSync(PROGRESS_FILE)) await unlink(PROGRESS_FILE);
      if (existsSync(LOG_FILE)) await unlink(LOG_FILE);
    } catch {
      // Ignore errors
    }

    // Initialize progress
    await clearLog();
    await appendLog('=== Frissítés indítása ===');
    await writeProgress({
      status: 'starting',
      message: 'Frissítés indítása...',
      progress: 0,
      currentStep: 'starting',
      log: '',
    });

    // Start update process in background
    startUpdateProcess().catch(async (error: any) => {
      console.error('Update process error:', error);
      await appendLog(`❌ Hiba: ${error.message || 'Ismeretlen hiba'}`);
      await writeProgress({
        status: 'error',
        message: 'Frissítési hiba',
        progress: 0,
        error: error.message || 'Ismeretlen hiba',
        log: await readFile(LOG_FILE, 'utf-8').catch(() => ''),
      });
    });

    // Wait a bit to ensure progress file is created
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Frissítés elindítva',
    });
  } catch (error: any) {
    console.error('Update start error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a frissítés indítása során: ' + (error.message || 'Ismeretlen hiba') },
      { status: 500 }
    );
  }
}

async function startUpdateProcess() {
  console.log('=== Update process started ===');
  console.log('Project root:', PROJECT_ROOT);
  console.log('Progress file:', PROGRESS_FILE);

  const steps = [
    {
      key: 'git_pull',
      label: 'Git változások letöltése',
      progress: 20,
      action: async () => {
        await appendLog('→ Git változások letöltése...');
        await writeProgress({
          status: 'in_progress',
          message: 'Git változások letöltése...',
          progress: 10,
          currentStep: 'git_pull',
        });

        try {
          // Fetch latest changes
          await appendLog('  - Fetch origin main...');
          await execAsync('git fetch origin main', { 
            cwd: PROJECT_ROOT,
            timeout: 60000,
          });

          // Check if we're behind
          const { stdout: statusOutput } = await execAsync('git status -sb', { 
            cwd: PROJECT_ROOT,
            timeout: 10000,
          });

          if (statusOutput.includes('behind')) {
            // Set merge strategy
            try {
              await execAsync('git config pull.rebase false', { cwd: PROJECT_ROOT });
            } catch {
              // Ignore
            }

            // Pull changes
            await appendLog('  - Git pull...');
            try {
              await execAsync('git pull origin main --no-rebase', { 
                cwd: PROJECT_ROOT,
                timeout: 60000,
              });
              await appendLog('  ✓ Pull sikeres');
            } catch (pullError: any) {
              // If merge conflict, use hard reset
              if (pullError.message.includes('conflict') || pullError.message.includes('merge')) {
                await appendLog('  ⚠️  Merge conflict, hard reset...');
                await execAsync('git reset --hard origin/main', { 
                  cwd: PROJECT_ROOT,
                  timeout: 30000,
                });
                await appendLog('  ✓ Hard reset sikeres');
              } else {
                throw pullError;
              }
            }
          } else {
            await appendLog('  ✓ Nincs új változás');
          }
        } catch (error: any) {
          await appendLog(`  ❌ Git hiba: ${error.message}`);
          throw new Error(`Git pull hiba: ${error.message}`);
        }
      },
    },
    {
      key: 'npm_install',
      label: 'Függőségek telepítése',
      progress: 40,
      action: async () => {
        await appendLog('→ Függőségek telepítése...');
        await writeProgress({
          status: 'in_progress',
          message: 'Függőségek telepítése...',
          progress: 30,
          currentStep: 'npm_install',
        });

        try {
          await appendLog('  - npm install (ez eltarthat néhány percig)...');
          const { stdout, stderr } = await execAsync('npm install --legacy-peer-deps', { 
            cwd: PROJECT_ROOT,
            maxBuffer: 1024 * 1024 * 10,
            timeout: 600000, // 10 minutes
          });
          await appendLog('  ✓ NPM install sikeres');
        } catch (error: any) {
          await appendLog(`  ❌ NPM install hiba: ${error.message}`);
          throw error;
        }
      },
    },
    {
      key: 'db_migrate',
      label: 'Adatbázis migrációk',
      progress: 60,
      action: async () => {
        await appendLog('→ Adatbázis migrációk...');
        await writeProgress({
          status: 'in_progress',
          message: 'Adatbázis migrációk...',
          progress: 50,
          currentStep: 'db_migrate',
        });

        try {
          await appendLog('  - Prisma client generálása...');
          await execAsync('npm run db:generate', { 
            cwd: PROJECT_ROOT,
            timeout: 120000,
          });
          await appendLog('  ✓ Prisma generate sikeres');

          await appendLog('  - Adatbázis séma frissítése...');
          await execAsync('npm run db:push', { 
            cwd: PROJECT_ROOT,
            timeout: 120000,
          });
          await appendLog('  ✓ DB push sikeres');
        } catch (error: any) {
          await appendLog(`  ❌ DB migráció hiba: ${error.message}`);
          throw error;
        }
      },
    },
    {
      key: 'build',
      label: 'Production build',
      progress: 80,
      action: async () => {
        await appendLog('→ Production build...');
        await writeProgress({
          status: 'in_progress',
          message: 'Production build...',
          progress: 70,
          currentStep: 'build',
        });

        try {
          // Check if app or pages directory exists
          if (!existsSync(join(PROJECT_ROOT, 'app')) && !existsSync(join(PROJECT_ROOT, 'pages'))) {
            throw new Error(`Nem található 'app' vagy 'pages' mappa: ${PROJECT_ROOT}`);
          }

          await appendLog('  - Next.js build...');
          const { stdout, stderr } = await execAsync('npm run build', { 
            cwd: PROJECT_ROOT,
            maxBuffer: 1024 * 1024 * 10,
            timeout: 600000, // 10 minutes
          });
          await appendLog('  ✓ Build sikeres');
        } catch (error: any) {
          await appendLog(`  ❌ Build hiba: ${error.message}`);
          throw error;
        }
      },
    },
    {
      key: 'restart',
      label: 'Szolgáltatás újraindítás',
      progress: 100,
      action: async () => {
        await appendLog('→ Szolgáltatás újraindítás...');
        await writeProgress({
          status: 'in_progress',
          message: 'Szolgáltatás újraindítás...',
          progress: 90,
          currentStep: 'restart',
        });

        try {
          // Try PM2 restart
          await appendLog('  - PM2 restart...');
          try {
            // Find PM2 process name
            let pm2ProcessName = 'zedingaming';
            try {
              const { stdout: pm2List } = await execAsync('pm2 list --no-color', { 
                cwd: PROJECT_ROOT,
                timeout: 10000,
              });
              const lines = pm2List.split('\n');
              for (const line of lines) {
                if (line.includes('node') || line.includes('next')) {
                  const match = line.match(/\│\s+(\w+)\s+│/);
                  if (match && match[1] && match[1] !== 'name') {
                    pm2ProcessName = match[1];
                    break;
                  }
                }
              }
            } catch {
              // Use default
            }

            await execAsync(`pm2 restart ${pm2ProcessName}`, { 
              cwd: PROJECT_ROOT,
              timeout: 30000,
            });
            await appendLog(`  ✓ PM2 restart sikeres (${pm2ProcessName})`);
          } catch (pm2Error: any) {
            await appendLog(`  ⚠️  PM2 nem elérhető: ${pm2Error.message}`);
            // Not critical, continue
          }
        } catch (error: any) {
          await appendLog(`  ⚠️  Restart hiba: ${error.message}`);
          // Not critical, continue
        }
      },
    },
  ];

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`[${i + 1}/${steps.length}] ${step.label}`);
      await appendLog(`[${i + 1}/${steps.length}] ${step.label}`);
      
      try {
        await step.action();
        await appendLog(`✓ ${step.label} befejezve`);
        await writeProgress({
          status: 'in_progress',
          message: `${step.label} befejezve`,
          progress: step.progress,
          currentStep: step.key,
        });
      } catch (error: any) {
        await appendLog(`❌ ${step.label} hiba: ${error.message}`);
        await writeProgress({
          status: 'error',
          message: `${step.label} hiba`,
          progress: 0,
          currentStep: step.key,
          error: error.message,
          log: await readFile(LOG_FILE, 'utf-8').catch(() => ''),
        });
        throw error;
      }
    }

    // Update completed
    await appendLog('=== Frissítés sikeresen befejezve! ===');
    await writeProgress({
      status: 'completed',
      message: 'Frissítés sikeresen befejezve!',
      progress: 100,
      currentStep: 'completed',
      log: await readFile(LOG_FILE, 'utf-8').catch(() => ''),
    });

    // Save last update time
    await prisma.setting.upsert({
      where: { key: 'last_update' },
      update: { value: new Date().toISOString() },
      create: { key: 'last_update', value: new Date().toISOString() },
    });

    console.log('=== Update process completed successfully ===');
  } catch (error: any) {
    console.error('=== Update process failed ===', error);
    await appendLog(`=== HIBÁBA ÜTKÖZÖTT: ${error.message} ===`);
    await writeProgress({
      status: 'error',
      message: 'Frissítési hiba',
      progress: 0,
      error: error.message || 'Ismeretlen hiba',
      log: await readFile(LOG_FILE, 'utf-8').catch(() => ''),
    });
    throw error;
  }
}
