import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Server-Sent Events (SSE) stream a real-time monitoringhoz
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return new Response('Unauthorized', { status: 401 });
    }

    // SSE stream létrehozása
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendData = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Heartbeat küldése 30 másodpercenként
        const heartbeatInterval = setInterval(() => {
          sendData({ type: 'heartbeat', timestamp: new Date().toISOString() });
        }, 30000);

        // Monitoring adatok küldése 5 másodpercenként
        const monitoringInterval = setInterval(async () => {
          try {
            const [
              totalMachines,
              onlineMachines,
              totalAgents,
              onlineAgents,
              totalServers,
              onlineServers,
              pendingTasks,
              runningTasks,
            ] = await Promise.all([
              prisma.serverMachine.count(),
              prisma.serverMachine.count({ where: { status: 'ONLINE' } }),
              prisma.agent.count(),
              prisma.agent.count({ where: { status: 'ONLINE' } }),
              prisma.server.count(),
              prisma.server.count({ where: { status: 'ONLINE' } }),
              prisma.task.count({ where: { status: 'PENDING' } }),
              prisma.task.count({ where: { status: 'RUNNING' } }),
            ]);

            sendData({
              type: 'stats',
              data: {
                machines: {
                  total: totalMachines,
                  online: onlineMachines,
                  offline: totalMachines - onlineMachines,
                },
                agents: {
                  total: totalAgents,
                  online: onlineAgents,
                  offline: totalAgents - onlineAgents,
                },
                servers: {
                  total: totalServers,
                  online: onlineServers,
                  offline: totalServers - onlineServers,
                },
                tasks: {
                  pending: pendingTasks,
                  running: runningTasks,
                },
              },
            });
          } catch (error) {
            console.error('Monitoring stream error:', error);
          }
        }, 5000);

        // Kapcsolat megszakadásakor cleanup
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          clearInterval(monitoringInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx buffering kikapcsolása
      },
    });
  } catch (error) {
    console.error('SSE stream error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

