import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/health-check';

// GET - Health check endpoint
export async function GET() {
  try {
    const health = await performHealthCheck();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date(),
      },
      { status: 503 }
    );
  }
}

