import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  // API route-ok rate limit ellenőrzése
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Admin API-k esetén szigorúbb limit
    if (request.nextUrl.pathname.startsWith('/api/admin/')) {
      const result = rateLimitMiddleware(50, 60 * 1000)(request);
      if (result) return result;
    }
    // Agent API-k esetén közepes limit
    else if (request.nextUrl.pathname.startsWith('/api/agent/')) {
      const result = rateLimitMiddleware(200, 60 * 1000)(request);
      if (result) return result;
    }
    // Publikus API-k esetén alapértelmezett limit
    else {
      const result = rateLimitMiddleware(100, 60 * 1000)(request);
      if (result) return result;
    }
  }

  // CORS headers hozzáadása API kérésekhez
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // CORS origin korlátozása biztonsági okokból
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.NEXTAUTH_URL || 'http://localhost:3000',
      process.env.NEXT_PUBLIC_BASE_URL || '',
    ].filter(Boolean);
    
    // Ha van origin és az engedélyezett listában van, vagy nincs origin (same-origin)
    const allowedOrigin = origin && allowedOrigins.includes(origin) 
      ? origin 
      : allowedOrigins[0] || '*';
    
    // Webhook és agent API-k esetén szigorúbb CORS
    if (request.nextUrl.pathname.startsWith('/api/webhooks/') || 
        request.nextUrl.pathname.startsWith('/api/agent/')) {
      // Webhook/agent API-k csak specifikus origin-öket fogadnak el
      if (origin && !allowedOrigins.includes(origin)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Webhook-Signature');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // OPTIONS kérés kezelése
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
