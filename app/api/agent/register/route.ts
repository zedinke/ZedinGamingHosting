import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// POST - Agent regisztráció (amikor egy agent először csatlakozik)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { machineId, version, capabilities } = body;

    if (!machineId) {
      return NextResponse.json(
        { error: 'machineId szükséges' },
        { status: 400 }
      );
    }

    // Machine ellenőrzése
    const machine = await prisma.serverMachine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Szerver gép nem található' },
        { status: 404 }
      );
    }

    // Agent ID generálása
    const randomId = randomBytes(4).toString('hex');
    const agentId = `agent-${machine.ipAddress.replace(/\./g, '-')}-${randomId}`;

    // API kulcs generálása
    const { generateApiKey } = await import('@/lib/api-key');
    const apiKey = generateApiKey();

    // Agent létrehozása
    const agent = await prisma.agent.create({
      data: {
        machineId,
        agentId,
        apiKey,
        version: version || '1.0.0',
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        capabilities: capabilities || {},
      },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
          },
        },
      },
    });

    // Machine státusz frissítése
    await prisma.serverMachine.update({
      where: { id: machineId },
      data: {
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        agentVersion: version || '1.0.0',
      },
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        agentId: agent.agentId,
        machine: agent.machine,
      },
      apiKey: apiKey, // API kulcs visszaadása (csak egyszer látható)
      message: 'Agent sikeresen regisztrálva. Mentsd el az API kulcsot!',
    });
  } catch (error: any) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Hiba történt az agent regisztrációja során' },
      { status: 500 }
    );
  }
}

