import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

function getProgressFilePath(serverId: string): string {
  return join(process.cwd(), 'logs', 'install', `server-${serverId}.progress.json`);
}

// GET - Telepítési állapot lekérése
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = (session.user as any).id;

    const server = await prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        machineId: true,
        agentId: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    // Ellenőrizzük, hogy a felhasználó a szerver tulajdonosa
    if (server.userId !== userId) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    // Ellenőrizzük, hogy van-e telepítési progress fájl
    const progressPath = getProgressFilePath(id);
    let installStatus = 'completed'; // Alapértelmezetten completed, ha nincs progress fájl
    let installProgress = null;

    if (existsSync(progressPath)) {
      try {
        const progressContent = await readFile(progressPath, 'utf-8');
        installProgress = JSON.parse(progressContent);
        
        // Ha a status 'completed' vagy 'error', akkor a telepítés befejeződött
        if (installProgress.status === 'completed') {
          installStatus = 'completed';
        } else if (installProgress.status === 'error') {
          installStatus = 'error';
        } else {
          installStatus = 'installing';
        }
      } catch (error) {
        // Ha nem lehet beolvasni, akkor completed
        installStatus = 'completed';
      }
    } else {
      // Ha nincs progress fájl, akkor ellenőrizzük, hogy van-e machineId és agentId
      // Ha nincs, akkor még nincs telepítve
      if (!server.machineId || !server.agentId) {
        installStatus = 'not_installed';
      } else {
        installStatus = 'completed';
      }
    }

    return NextResponse.json({
      success: true,
      installStatus,
      installProgress,
      isInstalled: installStatus === 'completed',
    });
  } catch (error) {
    console.error('Get install status error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a telepítési állapot lekérdezése során' },
      { status: 500 }
    );
  }
}

