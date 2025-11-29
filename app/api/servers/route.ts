import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withPerformanceMonitoring } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

export const GET = withPerformanceMonitoring(
  async (request: NextRequest) => {
    try {
      // Próbáljuk meg a session-t lekérni
      let session = await getServerSession(authOptions);
      
      // Ha nincs session, próbáljuk meg közvetlenül a token-t a cookie-kból
      if (!session) {
        const token = await getToken({ 
          req: request, 
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        if (token) {
          // Ha van token, de nincs session, létrehozzuk a session-t a token-ből
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              image: true,
            },
          });
          
          if (user) {
            session = {
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              },
            } as any;
            (session.user as any).role = user.role;
            (session.user as any).id = user.id;
          }
        }
      }

      if (!session || !session.user) {
        // Debug: ellenőrizzük a cookie-kat
        const cookies = request.cookies.getAll();
        logger.warn('No session found for servers request', {
          cookiesCount: cookies.length,
          cookieNames: cookies.map(c => c.name),
        });
        
        return NextResponse.json(
          { 
            error: 'Bejelentkezés szükséges',
            debug: process.env.NODE_ENV === 'development' ? {
              cookiesFound: cookies.length > 0,
              cookieNames: cookies.map(c => c.name),
            } : undefined,
          },
          { status: 401 }
        );
      }

      // Felhasználó ID lekérése
      const userId = (session.user as any)?.id;
      let finalUserId = userId;

      // Ha nincs ID, próbáljuk meg lekérni a user-t az email alapján
      if (!finalUserId && session.user.email) {
        try {
          const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          });
          
          if (user) {
            finalUserId = user.id;
          }
        } catch (error) {
          logger.error('Error fetching user:', error);
        }
      }

      if (!finalUserId) {
        return NextResponse.json(
          { error: 'Felhasználó nem található' },
          { status: 404 }
        );
      }

      // Szerverek lekérése
      const servers = await prisma.server.findMany({
        where: { userId: finalUserId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          gameType: true,
          maxPlayers: true,
          ipAddress: true,
          port: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Konvertáljuk az enum értékeket stringgé, hogy JSON-ban jól működjön
      const serializedServers = servers.map(server => ({
        id: String(server.id),
        name: String(server.name),
        gameType: String(server.gameType),
        maxPlayers: Number(server.maxPlayers),
        ipAddress: server.ipAddress ? String(server.ipAddress) : null,
        port: server.port ? Number(server.port) : null,
        status: String(server.status),
        createdAt: server.createdAt.toISOString(),
        updatedAt: server.updatedAt.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        servers: serializedServers,
      });
    } catch (error) {
      logger.error('Error fetching servers:', error);
      return NextResponse.json(
        { error: 'Hiba történt a szerverek lekérése során' },
        { status: 500 }
      );
    }
  },
  '/api/servers',
  'GET'
);

