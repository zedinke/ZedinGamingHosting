import { NextResponse } from 'next/server';

/**
 * API v1 info endpoint
 */
export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    status: 'active',
    endpoints: {
      servers: '/api/v1/servers',
      users: '/api/v1/users',
      machines: '/api/v1/machines',
      agents: '/api/v1/agents',
    },
    documentation: '/api/v1/docs',
  });
}

