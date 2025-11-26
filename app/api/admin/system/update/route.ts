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

function getProjectRoot(): string {
  let currentDir = process.cwd();
  const originalCwd = currentDir;
  
  // If we're in .next/standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    // .next/standalone -> .next -> project root
    currentDir = resolve(currentDir, '..', '..', '..');
  }
  
  // Verify it's the project root
  const checks = [
    join(currentDir, 'package.json'),
    join(currentDir, 'next.config.js'),
    join(currentDir, 'app'),
    join(currentDir, 'public'),
  ];
  
  const isValidRoot = checks.some(check => existsSync(check));
  
  if (isValidRoot) {
    return currentDir;
  }
  
  // Try parent directory
  const parentDir = resolve(currentDir, '..');
  const parentChecks = [
    join(parentDir, 'package.json'),
    join(parentDir, 'next.config.js'),
  ];
  
  if (parentChecks.some(check => existsSync(check))) {
    return parentDir;
  }
  
  // Last resort: return current directory
  console.warn('Could not find project root, using:', currentDir);
  return currentDir;
}

const PROJECT_ROOT = getProjectRoot();
const PROGRESS_FILE = join(PROJECT_ROOT, '.update-progress.json');
const LOG_FILE = join(PROJECT_ROOT, '.update-log.txt');

async function writeProgress(progress: any) {
  try {
    const progressWithTimestamp = {
      ...progress,
      timestamp: new Date().toISOString(),
    };
    await writeFile(PROGRESS_FILE, JSON.stringify(progressWithTimestamp, null, 2), 'utf-8');
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
    if (existsSync(LOG_FILE)) {
      await unlink(LOG_FILE);
    }
  } catch (error: any) {
    console.error('Error clearing log:', error.message);
  }
}

// POST: Start update
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    // Check if update is already running
    if (existsSync(PROGRESS_FILE)) {
      try {
        const currentProgress = JSON.parse(await readFile(PROGRESS_FILE, 'utf-8'));
        if (currentProgress.status === 'in_progress' || currentProgress.status === 'starting') {
          return NextResponse.json(
            { error: 'Már van egy frissítés folyamatban' },
            { status: 400 }
          );
        }
      } catch {
        // If we can't read it, assume it's safe to start
      }
    }

    // Clear old files
    try {
      if (existsSync(PROGRESS_FILE)) await unlink(PROGRESS_FILE);
      if (existsSync(LOG_FILE)) await unlink(LOG_FILE);
    } catch {
      // Ignore
    }

    // Initialize progress
    await clearLog();
    await appendLog('=== Frissítés indítása ===');
    await writeProgress({
      status: 'starting',
      message: 'Frissítés indítása...',
      progress: 0,
      currentStep: null,
    });

    // Start update process in background (don't await)
    startUpdateProcess().catch(async (error: any) => {
      console.error('Update process error:', error);
      await appendLog(`❌ Hiba: ${error.message || 'Ismeretlen hiba'}`);
      await writeProgress({
        status: 'error',
        message: 'Frissítési hiba',
        progress: 0,
        error: error.message || 'Ismeretlen hiba',
        currentStep: null,
      });
    });

    // Wait a bit to ensure files are created
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

// DELETE: Reset update (clear progress)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    try {
      if (existsSync(PROGRESS_FILE)) await unlink(PROGRESS_FILE);
      if (existsSync(LOG_FILE)) await unlink(LOG_FILE);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Hiba történt a progress törlése során: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Progress törölve' });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Hiba történt: ' + (error.message || 'Ismeretlen hiba') },
      { status: 500 }
    );
  }
}

async function startUpdateProcess() {
  console.log('=== Update process started ===');
  console.log('Project root:', PROJECT_ROOT);

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
          // Install all dependencies including devDependencies (needed for build)
          // Unset NODE_ENV to ensure devDependencies are installed
          const env = { ...process.env } as Record<string, string | undefined>;
          delete env.NODE_ENV;
          await execAsync('npm install --legacy-peer-deps', { 
            cwd: PROJECT_ROOT,
            maxBuffer: 1024 * 1024 * 10,
            timeout: 600000, // 10 minutes
            env: env as any,
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
          try {
            await execAsync('npm run db:generate', { 
              cwd: PROJECT_ROOT,
              timeout: 120000,
            });
            await appendLog('  ✓ Prisma generate sikeres');
          } catch (generateError: any) {
            await appendLog(`  ⚠️  Prisma generate figyelmeztetés: ${generateError.message}`);
            // Not critical if DATABASE_URL is missing during build, continue
            if (!generateError.message.includes('DATABASE_URL')) {
              throw generateError;
            }
          }

          await appendLog('  - Adatbázis séma frissítése...');
          try {
            await execAsync('npm run db:push', { 
              cwd: PROJECT_ROOT,
              timeout: 120000,
            });
            await appendLog('  ✓ DB push sikeres');
          } catch (pushError: any) {
            await appendLog(`  ⚠️  DB push figyelmeztetés: ${pushError.message}`);
            // Not critical if DATABASE_URL is missing, continue
            if (!pushError.message.includes('DATABASE_URL') && !pushError.message.includes('Environment variable')) {
              throw pushError;
            }
            await appendLog('  ⚠️  DB push kihagyva (DATABASE_URL hiányzik vagy nem elérhető)');
          }
        } catch (error: any) {
          await appendLog(`  ❌ DB migráció hiba: ${error.message}`);
          // Only throw if it's a critical error
          if (!error.message.includes('DATABASE_URL') && !error.message.includes('Environment variable')) {
            throw error;
          }
          await appendLog('  ⚠️  DB migráció kihagyva, folytatjuk a build-del');
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
          // Set NODE_ENV to production for build
          const buildEnv = { ...process.env, NODE_ENV: 'production' } as Record<string, string | undefined>;
          await execAsync('npm run build', { 
            cwd: PROJECT_ROOT,
            maxBuffer: 1024 * 1024 * 10,
            timeout: 600000, // 10 minutes
            env: buildEnv as any,
          });
          await appendLog('  ✓ Build sikeres');
          
          // Copy public files if needed (for standalone builds)
          try {
            await appendLog('  - Public fájlok másolása...');
            if (existsSync(join(PROJECT_ROOT, 'scripts', 'copy-public-to-standalone.js'))) {
              await execAsync('node scripts/copy-public-to-standalone.js', {
                cwd: PROJECT_ROOT,
                timeout: 60000,
              });
              await appendLog('  ✓ Public fájlok másolása sikeres');
            }
          } catch (copyError: any) {
            await appendLog(`  ⚠️  Public fájlok másolása figyelmeztetés: ${copyError.message}`);
            // Not critical, continue
          }
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
            let pm2Found = false;
            
            try {
              const { stdout: pm2List } = await execAsync('pm2 list --no-color', { 
                cwd: PROJECT_ROOT,
                timeout: 10000,
              });
              
              // Try to find process by name pattern
              const lines = pm2List.split('\n');
              for (const line of lines) {
                // Look for process name in PM2 list format
                if (line.includes('zedingaming') || line.includes('zedin') || line.includes('gaming')) {
                  const match = line.match(/\│\s+([^\s│]+)\s+│/);
                  if (match && match[1] && match[1] !== 'name' && match[1] !== 'id') {
                    pm2ProcessName = match[1].trim();
                    pm2Found = true;
                    await appendLog(`  - PM2 process találva: ${pm2ProcessName}`);
                    break;
                  }
                }
                // Fallback: look for any node/next process
                if (!pm2Found && (line.includes('node') || line.includes('next'))) {
                  const match = line.match(/\│\s+([^\s│]+)\s+│/);
                  if (match && match[1] && match[1] !== 'name' && match[1] !== 'id' && !match[1].match(/^\d+$/)) {
                    pm2ProcessName = match[1].trim();
                    pm2Found = true;
                    await appendLog(`  - PM2 process találva (fallback): ${pm2ProcessName}`);
                    break;
                  }
                }
              }
              
              if (!pm2Found) {
                await appendLog(`  ⚠️  PM2 process nem található, használjuk az alapértelmezett nevet: ${pm2ProcessName}`);
              }
            } catch (listError: any) {
              await appendLog(`  ⚠️  PM2 list hiba: ${listError.message}, használjuk az alapértelmezett nevet: ${pm2ProcessName}`);
            }

            try {
              await execAsync(`pm2 restart ${pm2ProcessName}`, { 
                cwd: PROJECT_ROOT,
                timeout: 30000,
              });
              await appendLog(`  ✓ PM2 restart sikeres (${pm2ProcessName})`);
            } catch (restartError: any) {
              // Try to reload instead of restart
              try {
                await appendLog(`  - PM2 restart sikertelen, próbáljuk a reload-ot...`);
                await execAsync(`pm2 reload ${pm2ProcessName}`, { 
                  cwd: PROJECT_ROOT,
                  timeout: 30000,
                });
                await appendLog(`  ✓ PM2 reload sikeres (${pm2ProcessName})`);
              } catch (reloadError: any) {
                await appendLog(`  ⚠️  PM2 restart/reload sikertelen: ${restartError.message}`);
                // Not critical, continue
              }
            }
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
      currentStep: null,
    });
    throw error;
  }
}

