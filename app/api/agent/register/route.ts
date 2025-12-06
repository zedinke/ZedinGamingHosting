import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// POST - Agent regisztráció (amikor egy agent először csatlakozik)
// Biztonsági megjegyzés: Admin hitelesítés szükséges vagy regisztrációs token
export async function POST(request: NextRequest) {
  try {
    // Admin hitelesítés ellenőrzése
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== UserRole.ADMIN) {
      // Alternatív: Regisztrációs token ellenőrzése (ha van)
      const registrationToken = request.headers.get('x-registration-token');
      const expectedToken = process.env.AGENT_REGISTRATION_TOKEN;
      
      if (!registrationToken || !expectedToken || registrationToken !== expectedToken) {
        return NextResponse.json(
          { error: 'Nincs jogosultság az agent regisztrációhoz' },
          { status: 403 }
        );
      }
    }
    
    const body = await request.json();
    const { agentId, agentIp, machineId, version, capabilities } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId szükséges' },
        { status: 400 }
      );
    }

    // Machine keresése: előbb agentIp alapján, majd machineId-val
    let machine = null;
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('cf-connecting-ip') ||
                     request.ip ||
                     '127.0.0.1';
    
    if (agentIp) {
      // Ha van agentIp, azt használjuk
      machine = await prisma.serverMachine.findFirst({
        where: {
          ipAddress: agentIp,
        },
      });
    }
    
    if (!machine && machineId) {
      // Ha van machineId, azt használjuk
      machine = await prisma.serverMachine.findUnique({
        where: { id: machineId },
      });
    }
    
    if (!machine) {
      // Machine keresése IP-cím alapján
      machine = await prisma.serverMachine.findFirst({
        where: {
          ipAddress: clientIp,
        },
      });
    }

    if (!machine) {
      // Ha a gép nincs az adatbázisban, automatikusan létrehozzuk
      // Ez lehetővé teszi az agent önregisztrációját
      const ipForMachine = agentIp || clientIp || '127.0.0.1';
      const machineName = `GameServer-${ipForMachine.split('.').pop()}`;
      
      machine = await prisma.serverMachine.create({
        data: {
          name: machineName,
          ipAddress: ipForMachine,
          sshPort: 22,
          sshUser: 'root',
          status: 'ONLINE',
        },
      });

      console.log(`New machine auto-registered: ${machine.id} (${machine.name}, ${machine.ipAddress})`);
    }

    // Az agent által küldött agentId-t használjuk
    const finalAgentId = agentId;

    // API kulcs generálása
    const { generateApiKey } = await import('@/lib/api-key');
    const apiKey = generateApiKey();

    // Agent CREATE or UPDATE (UPSERT)
    const agent = await prisma.agent.upsert({
      where: { agentId: finalAgentId },
      update: {
        machineId: machine.id,
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        version: version || '1.0.0',
        capabilities: capabilities || {},
      },
      create: {
        machineId: machine.id,
        agentId: finalAgentId,
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
      where: { id: machine.id },
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

