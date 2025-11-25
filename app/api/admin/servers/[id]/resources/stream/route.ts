import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Server-Sent Events (SSE) stream egy szerver erőforrás monitoringjához
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = params;

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: true,
      },
    });

    if (!server) {
      return new Response('Server not found', { status: 404 });
    }

    // SSE stream létrehozása
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendData = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Erőforrás adatok küldése 2 másodpercenként
        const resourcesInterval = setInterval(async () => {
          try {
            const updatedServer = await prisma.server.findUnique({
              where: { id },
              select: {
                id: true,
                resourceUsage: true,
                status: true,
              },
            });

            if (updatedServer && updatedServer.resourceUsage) {
              sendData({
                type: 'resources',
                data: {
                  resourceUsage: updatedServer.resourceUsage,
                  status: updatedServer.status,
                },
              });
            } else {
              // Mock adatok, ha nincs valós adat
              sendData({
                type: 'resources',
                data: {
                  resourceUsage: {
                    cpu: {
                      usage: Math.random() * 100,
                      cores: 4,
                    },
                    ram: {
                      used: Math.random() * 8 * 1024 * 1024 * 1024,
                      total: 8 * 1024 * 1024 * 1024,
                    },
                    disk: {
                      used: Math.random() * 100 * 1024 * 1024 * 1024,
                      total: 100 * 1024 * 1024 * 1024,
                    },
                  },
                  status: server.status,
                },
              });
            }
          } catch (error) {
            console.error('Resources stream error:', error);
          }
        }, 2000);

        // Kapcsolat megszakadásakor cleanup
        request.signal.addEventListener('abort', () => {
          clearInterval(resourcesInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('SSE stream error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

