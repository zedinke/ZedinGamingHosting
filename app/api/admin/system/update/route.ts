import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, appendFile, unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

function getProjectRoot(): string {
  let currentDir = process.cwd();
  const originalCwd = currentDir;
  
  console.log('getProjectRoot: Starting from cwd:', currentDir);
  
  // If we're in .next/standalone, go up to project root
  if (currentDir.includes('.next/standalone')) {
    // .next/standalone -> .next -> public_html (project root)
    // Go up 2 levels to get to public_html
    let searchDir = resolve(currentDir, '..', '..');
    console.log('getProjectRoot: In standalone, going up 2 levels to:', searchDir);
    
    // Check if this is the project root (has .git and package.json)
    if (existsSync(join(searchDir, '.git')) && existsSync(join(searchDir, 'package.json'))) {
      console.log('getProjectRoot: Found project root with .git at:', searchDir);
      return searchDir;
    }
    
    // If not found, try going up one more level and then into public_html
    const parentDir = resolve(searchDir, '..');
    const publicHtmlDir = join(parentDir, 'public_html');
    console.log('getProjectRoot: Trying public_html at:', publicHtmlDir);
    
    if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
      console.log('getProjectRoot: Found project root in public_html at:', publicHtmlDir);
      return publicHtmlDir;
    }
    
    // Fallback: use the directory we found (public_html)
    console.log('getProjectRoot: Using fallback directory:', searchDir);
    currentDir = searchDir;
  }
  
  // Verify it's the project root
  const checks = [
    join(currentDir, 'package.json'),
    join(currentDir, 'next.config.js'),
    join(currentDir, 'app'),
    join(currentDir, 'public'),
  ];
  
  const isValidRoot = checks.some(check => existsSync(check));
  console.log('getProjectRoot: isValidRoot:', isValidRoot, 'for:', currentDir);
  
  if (isValidRoot) {
    // Check if .git exists, if not, try public_html
    if (!existsSync(join(currentDir, '.git'))) {
      console.log('getProjectRoot: No .git in currentDir, trying public_html');
      const publicHtmlDir = join(currentDir, 'public_html');
      if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
        console.log('getProjectRoot: Found .git in public_html:', publicHtmlDir);
        return publicHtmlDir;
      }
      // Also try parent/public_html
      const parentPublicHtml = join(resolve(currentDir, '..'), 'public_html');
      if (existsSync(join(parentPublicHtml, '.git')) && existsSync(join(parentPublicHtml, 'package.json'))) {
        console.log('getProjectRoot: Found .git in parent/public_html:', parentPublicHtml);
        return parentPublicHtml;
      }
    } else {
      console.log('getProjectRoot: Found .git in currentDir:', currentDir);
    }
    return currentDir;
  }
  
  // Try parent directory
  const parentDir = resolve(currentDir, '..');
  const parentChecks = [
    join(parentDir, 'package.json'),
    join(parentDir, 'next.config.js'),
  ];
  
  if (parentChecks.some(check => existsSync(check))) {
    console.log('getProjectRoot: Trying parent directory:', parentDir);
    // Check if .git exists in parent
    if (existsSync(join(parentDir, '.git'))) {
      console.log('getProjectRoot: Found .git in parent:', parentDir);
      return parentDir;
    }
    // Try public_html in parent
    const publicHtmlDir = join(parentDir, 'public_html');
    if (existsSync(join(publicHtmlDir, '.git')) && existsSync(join(publicHtmlDir, 'package.json'))) {
      console.log('getProjectRoot: Found .git in parent/public_html:', publicHtmlDir);
      return publicHtmlDir;
    }
    return parentDir;
  }
  
  // Try to find public_html directory from original cwd
  const possiblePublicHtml = resolve(originalCwd, '..', '..', 'public_html');
  console.log('getProjectRoot: Trying possiblePublicHtml:', possiblePublicHtml);
  if (existsSync(join(possiblePublicHtml, '.git')) && existsSync(join(possiblePublicHtml, 'package.json'))) {
    console.log('getProjectRoot: Found .git in possiblePublicHtml:', possiblePublicHtml);
    return possiblePublicHtml;
  }
  
  // Last resort: return current directory
  console.warn('getProjectRoot: Could not find project root with .git, using:', currentDir);
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
    // Ellenőrizzük, hogy a fájl tényleg le lett-e írva
    console.log('Progress frissítve:', JSON.stringify(progressWithTimestamp, null, 2));
  } catch (error: any) {
    console.error('Error writing progress:', error.message);
    throw error; // Dobjuk tovább a hibát, hogy lássuk, ha probléma van
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
        const status = currentProgress.status;
        const timestamp = currentProgress.timestamp ? new Date(currentProgress.timestamp) : null;
        
        // If status is in_progress or starting, check if it's recent (within last 30 minutes)
        if (status === 'in_progress' || status === 'starting') {
          if (timestamp) {
            const ageInMinutes = (Date.now() - timestamp.getTime()) / (1000 * 60);
            // If older than 30 minutes, consider it stuck and allow restart
            if (ageInMinutes > 30) {
              console.log(`Progress file is ${ageInMinutes.toFixed(1)} minutes old, considering it stuck. Allowing restart.`);
              // Delete the old progress file
              try {
                await unlink(PROGRESS_FILE);
                if (existsSync(LOG_FILE)) await unlink(LOG_FILE);
              } catch {
                // Ignore
              }
            } else {
              return NextResponse.json(
                { error: 'Már van egy frissítés folyamatban' },
                { status: 400 }
              );
            }
          } else {
            // No timestamp, assume it's old and allow restart
            console.log('Progress file has no timestamp, allowing restart.');
            try {
              await unlink(PROGRESS_FILE);
              if (existsSync(LOG_FILE)) await unlink(LOG_FILE);
            } catch {
              // Ignore
            }
          }
        } else if (status === 'error' || status === 'completed') {
          // If error or completed, delete old progress file (older than 5 minutes)
          if (timestamp) {
            const ageInMinutes = (Date.now() - timestamp.getTime()) / (1000 * 60);
            if (ageInMinutes > 5) {
              console.log(`Progress file is ${ageInMinutes.toFixed(1)} minutes old (${status}), deleting.`);
              try {
                await unlink(PROGRESS_FILE);
                if (existsSync(LOG_FILE)) await unlink(LOG_FILE);
              } catch {
                // Ignore
              }
            }
          } else {
            // No timestamp, delete it
            try {
              await unlink(PROGRESS_FILE);
              if (existsSync(LOG_FILE)) await unlink(LOG_FILE);
            } catch {
              // Ignore
            }
          }
        }
      } catch (error: any) {
        // If we can't read it, delete it and allow start
        console.log('Error reading progress file, deleting it:', error.message);
        try {
          await unlink(PROGRESS_FILE);
          if (existsSync(LOG_FILE)) await unlink(LOG_FILE);
        } catch {
          // Ignore
        }
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
      redirectUrl: '/update-status.html',
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

    // Újra számoljuk a PROJECT_ROOT-ot, hogy biztosan jó legyen
    const projectRoot = getProjectRoot();
    const progressFile = join(projectRoot, '.update-progress.json');
    const logFile = join(projectRoot, '.update-log.txt');

    console.log('DELETE: Törlés kezdése');
    console.log('DELETE: PROJECT_ROOT:', projectRoot);
    console.log('DELETE: PROGRESS_FILE:', progressFile);
    console.log('DELETE: PROGRESS_FILE exists:', existsSync(progressFile));
    console.log('DELETE: LOG_FILE:', logFile);
    console.log('DELETE: LOG_FILE exists:', existsSync(logFile));

    let deletedFiles = [];
    let errors = [];

    try {
      if (existsSync(progressFile)) {
        await unlink(progressFile);
        deletedFiles.push('progress');
        console.log('DELETE: Progress fájl törölve');
      } else {
        console.log('DELETE: Progress fájl nem létezik');
      }
    } catch (error: any) {
      console.error('DELETE: Progress törlés hiba:', error);
      errors.push(`Progress: ${error.message}`);
    }

    try {
      if (existsSync(logFile)) {
        await unlink(logFile);
        deletedFiles.push('log');
        console.log('DELETE: Log fájl törölve');
      } else {
        console.log('DELETE: Log fájl nem létezik');
      }
    } catch (error: any) {
      console.error('DELETE: Log törlés hiba:', error);
      errors.push(`Log: ${error.message}`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Hiba történt a progress törlése során: ' + errors.join(', '),
          deletedFiles,
        },
        { status: 500 }
      );
    }

    console.log('DELETE: Törlés sikeres, törölt fájlok:', deletedFiles);
    return NextResponse.json({ 
      success: true, 
      message: 'Progress törölve',
      deletedFiles,
    });
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
          // Set NODE_ENV to production for build és takarítsuk ki a Next.js privát env változóit,
          // mert ezek bizonyos környezetekben a "generate is not a function" hibához vezethetnek
          const buildEnv = { ...process.env, NODE_ENV: 'production' } as Record<string, string | undefined>;

          // Tisztítás a jól ismert problémás változókról
          delete buildEnv.__NEXT_PRIVATE_STANDALONE_CONFIG;
          delete buildEnv.__NEXT_PRIVATE_ORIGIN;
          delete buildEnv.NEXT_DEPLOYMENT_ID;
          delete buildEnv.__NEXT_PRIVATE_RUNTIME_TYPE;
          delete buildEnv.NEXT_OTEL_FETCH_DISABLED;

          await appendLog('  - Build környezet inicializálva (privát Next env változók törölve)...');

          // Töröljük a régi build fájlokat, hogy tiszta build legyen
          await appendLog('  - Régi build fájlok törlése...');
          try {
            const { execSync } = require('child_process');
            execSync('rm -rf .next', { cwd: PROJECT_ROOT, stdio: 'ignore' });
            await appendLog('  ✓ Régi build fájlok törölve');
          } catch (cleanError: any) {
            await appendLog(`  ⚠️  Build törlés figyelmeztetés: ${cleanError.message}`);
            // Not critical, continue
          }
          
          // Build futtatása output logolással és progress frissítéssel
          await appendLog('  - Build futtatása...');
          await writeProgress({
            status: 'in_progress',
            message: 'Production build folyamatban...',
            progress: 75,
            currentStep: 'build',
          });
          
          try {
            const buildProcess = exec('npm run build', {
              cwd: PROJECT_ROOT,
              maxBuffer: 1024 * 1024 * 10,
              timeout: 600000, // 10 minutes
              env: buildEnv as any,
            });
            
            let lastProgressUpdate = Date.now();
            
            // Logoljuk a build outputot és frissítsük a progress-t
            if (buildProcess.stdout) {
              buildProcess.stdout.on('data', async (data: Buffer) => {
                const output = data.toString().trim();
                if (output) {
                  await appendLog(`  [BUILD] ${output}`).catch(() => {});
                  
                  // Frissítsük a progress-t minden 5 másodpercben
                  const now = Date.now();
                  if (now - lastProgressUpdate > 5000) {
                    lastProgressUpdate = now;
                    await writeProgress({
                      status: 'in_progress',
                      message: 'Production build folyamatban...',
                      progress: 75,
                      currentStep: 'build',
                    }).catch(() => {});
                  }
                }
              });
            }
            
            if (buildProcess.stderr) {
              buildProcess.stderr.on('data', async (data: Buffer) => {
                const output = data.toString().trim();
                if (output && !output.includes('warning')) { // Csak a fontos hibákat logoljuk
                  await appendLog(`  [BUILD ERR] ${output}`).catch(() => {});
                }
              });
            }
            
            // Várjuk meg a build befejeződését
            await new Promise((resolve, reject) => {
              buildProcess.on('close', (code) => {
                if (code === 0) {
                  resolve(undefined);
                } else {
                  reject(new Error(`Build failed with code ${code}`));
                }
              });
              buildProcess.on('error', reject);
            });
            
            await appendLog('  ✓ Build sikeres');
            await writeProgress({
              status: 'in_progress',
              message: 'Production build befejezve',
              progress: 80,
              currentStep: 'build',
            });
          } catch (buildError: any) {
            await appendLog(`  ❌ Build hiba: ${buildError.message}`);
            throw buildError;
          }
          
          // Ellenőrizzük, hogy a build tartalmazza-e a szükséges route fájlokat
          await appendLog('  - Build ellenőrzése...');
          const requiredRoute = join(PROJECT_ROOT, '.next', 'server', 'app', 'api', 'admin', 'cms', 'slideshow', 'settings', 'route.js');
          if (existsSync(requiredRoute)) {
            await appendLog('  ✓ Szükséges route fájlok megtalálhatók');
          } else {
            await appendLog(`  ⚠️  Figyelmeztetés: ${requiredRoute} nem található a build-ben`);
            // Not critical, continue - lehet, hogy dinamikusan töltődik be
          }
          
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

          // AI rendszer automatikus telepítése (központi gép)
          try {
            await appendLog('  - AI rendszer telepítése...');
            await writeProgress({
              status: 'in_progress',
              message: 'AI rendszer telepítése...',
              progress: 85,
              currentStep: 'ai_setup',
            });
            
            try {
              await execAsync('node scripts/setup-ai-system.js', {
                cwd: PROJECT_ROOT,
                timeout: 300000, // 5 perc timeout (modell letöltés miatt)
                env: { ...process.env, AI_SERVER_MODE: 'false' } as any,
              });
              await appendLog('  ✓ AI rendszer telepítve');
            } catch (aiError: any) {
              await appendLog(`  ⚠️  AI telepítés figyelmeztetés: ${aiError.message}`);
              // Not critical, continue - az AI funkciók később is működhetnek
            }
          } catch (aiSetupError: any) {
            await appendLog(`  ⚠️  AI telepítés kihagyva: ${aiSetupError.message}`);
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

            // BEÁLLÍTJUK A COMPLETED STÁTUSZT A PM2 RESTART ELŐTT!
            // Ez fontos, mert a PM2 restart után a Node.js újraindul, és a folyamat megszakad
            await appendLog('  - Frissítés befejezése jelzése...');
            await writeProgress({
              status: 'completed',
              message: 'Frissítés sikeresen befejezve!',
              progress: 100,
              currentStep: 'completed',
            });
            
            // Save last update time
            try {
              await prisma.setting.upsert({
                where: { key: 'last_update' },
                update: { value: new Date().toISOString() },
                create: { key: 'last_update', value: new Date().toISOString() },
              });
              await appendLog('  ✓ Utolsó frissítés időpontja mentve');
            } catch (dbError: any) {
              await appendLog(`  ⚠️  DB mentés hiba: ${dbError.message}`);
              // Not critical, continue
            }
            
            await appendLog('=== Frissítés sikeresen befejezve! ===');
            
            // Most már biztonságosan újraindíthatjuk a PM2-t
            try {
              await execAsync(`pm2 restart ${pm2ProcessName}`, { 
                cwd: PROJECT_ROOT,
                timeout: 30000,
              });
              await appendLog(`  ✓ PM2 restart sikeres (${pm2ProcessName})`);
              
              // Várjunk egy kicsit, hogy a PM2 biztosan újrainduljon
              await appendLog('  - Várakozás a szolgáltatás újraindulására...');
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2 másodperc várakozás
              
              // Ellenőrizzük, hogy a PM2 process fut-e
              try {
                const { stdout: pm2Status } = await execAsync(`pm2 show ${pm2ProcessName} --no-color`, {
                  cwd: PROJECT_ROOT,
                  timeout: 10000,
                });
                if (pm2Status.includes('online')) {
                  await appendLog(`  ✓ PM2 process online (${pm2ProcessName})`);
                } else {
                  await appendLog(`  ⚠️  PM2 process státusz: ${pm2Status}`);
                }
              } catch (statusError: any) {
                await appendLog(`  ⚠️  PM2 státusz ellenőrzés hiba: ${statusError.message}`);
              }
            } catch (restartError: any) {
              // Try to reload instead of restart
              try {
                await appendLog(`  - PM2 restart sikertelen, próbáljuk a reload-ot...`);
                await execAsync(`pm2 reload ${pm2ProcessName}`, { 
                  cwd: PROJECT_ROOT,
                  timeout: 30000,
                });
                await appendLog(`  ✓ PM2 reload sikeres (${pm2ProcessName})`);
                
                // Várjunk egy kicsit, hogy a PM2 biztosan újrainduljon
                await appendLog('  - Várakozás a szolgáltatás újraindulására...');
                await new Promise(resolve => setTimeout(resolve, 3000)); // 3 másodperc várakozás
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
        
        // Ha ez a restart lépés, akkor már a restart action-ben beállítottuk a completed státuszt
        // Ne írjuk felül, csak ha nem restart lépés
        if (step.key !== 'restart') {
          await writeProgress({
            status: 'in_progress',
            message: `${step.label} befejezve`,
            progress: step.progress,
            currentStep: step.key,
          });
        }
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

    // Ha a restart lépés nem állította be a completed státuszt (pl. hiba esetén), akkor itt állítjuk be
    // De általában a restart lépés már beállította
    try {
      const currentProgress = JSON.parse(await readFile(PROGRESS_FILE, 'utf-8'));
      if (currentProgress.status !== 'completed') {
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
      }
    } catch (readError: any) {
      // Ha nem tudjuk beolvasni, akkor beállítjuk
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
    }

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

