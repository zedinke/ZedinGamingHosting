import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

// Progress tracking fájl
const PROGRESS_FILE = join(process.cwd(), '.update-progress.json');

async function updateProgress(progress: any) {
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
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

    // Frissítés indítása háttérben (nem blokkoló módon)
    startUpdateProcess().catch((error) => {
      console.error('Update process error:', error);
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
  const steps = [
    {
      key: 'git_pull',
      label: 'Git változások letöltése',
      action: async () => {
        await updateProgress({
          status: 'in_progress',
          message: 'Git változások letöltése...',
          progress: 10,
          currentStep: 'git_pull',
        });
        await execAsync('git pull origin main');
      },
    },
    {
      key: 'npm_install',
      label: 'Függőségek telepítése',
      action: async () => {
        await updateProgress({
          status: 'in_progress',
          message: 'Függőségek telepítése...',
          progress: 30,
          currentStep: 'npm_install',
        });
        await execAsync('npm install');
      },
    },
    {
      key: 'db_migrate',
      label: 'Adatbázis migrációk',
      action: async () => {
        await updateProgress({
          status: 'in_progress',
          message: 'Adatbázis migrációk futtatása...',
          progress: 50,
          currentStep: 'db_migrate',
        });
        await execAsync('npm run db:generate');
        await execAsync('npm run db:push');
      },
    },
    {
      key: 'docker_build',
      label: 'Docker build',
      action: async () => {
        await updateProgress({
          status: 'in_progress',
          message: 'Docker konténerek buildelése...',
          progress: 70,
          currentStep: 'docker_build',
        });
        try {
          await execAsync('docker-compose build');
        } catch (error) {
          // Ha nincs docker-compose, akkor csak build
          await execAsync('npm run build');
        }
      },
    },
    {
      key: 'docker_restart',
      label: 'Docker újraindítás',
      action: async () => {
        await updateProgress({
          status: 'in_progress',
          message: 'Docker konténerek újraindítása...',
          progress: 90,
          currentStep: 'docker_restart',
        });
        try {
          await execAsync('docker-compose up -d');
        } catch (error) {
          // Ha nincs docker, akkor PM2 restart
          try {
            await execAsync('pm2 restart zedingaming');
          } catch {
            // Ha nincs PM2 sem, akkor csak build
            console.log('No PM2 or Docker found, skipping restart');
          }
        }
      },
    },
  ];

  try {
    await updateProgress({
      status: 'starting',
      message: 'Frissítés indítása...',
      progress: 0,
    });

    for (const step of steps) {
      try {
        await step.action();
      } catch (error: any) {
        throw new Error(`${step.label} hiba: ${error.message}`);
      }
    }

    // Frissítés befejezve
    await updateProgress({
      status: 'completed',
      message: 'Frissítés sikeresen befejezve!',
      progress: 100,
      currentStep: 'completed',
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
  } catch (error: any) {
    await updateProgress({
      status: 'error',
      message: 'Frissítési hiba',
      progress: 0,
      error: error.message,
    });
  }
}

