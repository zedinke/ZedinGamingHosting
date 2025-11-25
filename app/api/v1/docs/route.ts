import { NextResponse } from 'next/server';

/**
 * API v1 dokumentáció
 */
export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    title: 'ZedinGamingHosting API v1',
    description: 'REST API a game server hosting szolgáltatáshoz',
    baseUrl: '/api/v1',
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      description: 'NextAuth session token szükséges a legtöbb endpoint-hoz',
    },
    rateLimiting: {
      default: '100 requests per minute',
      admin: '50 requests per minute',
      agent: '200 requests per minute',
    },
    endpoints: {
      servers: {
        'GET /api/v1/servers': {
          description: 'Szerverek listázása',
          queryParams: {
            userId: 'string (opcionális) - Felhasználó ID',
            gameType: 'string (opcionális) - Játék típus',
            status: 'string (opcionális) - Szerver állapot',
          },
          response: {
            success: 'boolean',
            data: 'Server[]',
            count: 'number',
          },
        },
      },
      users: {
        'GET /api/v1/users': {
          description: 'Felhasználók listázása (csak admin)',
          response: {
            success: 'boolean',
            data: 'User[]',
            count: 'number',
          },
        },
      },
      machines: {
        'GET /api/v1/machines': {
          description: 'Szerver gépek listázása (csak admin)',
          response: {
            success: 'boolean',
            data: 'ServerMachine[]',
            count: 'number',
          },
        },
      },
      agents: {
        'GET /api/v1/agents': {
          description: 'Agentek listázása (csak admin)',
          response: {
            success: 'boolean',
            data: 'Agent[]',
            count: 'number',
          },
        },
      },
    },
    errorCodes: {
      400: 'Hibás kérés',
      401: 'Nincs jogosultság',
      403: 'Tiltott művelet',
      404: 'Nem található',
      429: 'Rate limit túllépve',
      500: 'Szerver hiba',
    },
  });
}

