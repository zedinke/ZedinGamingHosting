import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { isMaintenanceMode } from '@/lib/maintenance';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // API route-ok rate limit ellenőrzése
  if (pathname.startsWith('/api/')) {
    // Admin API-k esetén szigorúbb limit
    if (pathname.startsWith('/api/admin/')) {
      const result = rateLimitMiddleware(50, 60 * 1000)(request);
      if (result) return result;
    }
    // Agent API-k esetén közepes limit
    else if (pathname.startsWith('/api/agent/')) {
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
  if (pathname.startsWith('/api/')) {
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
    if (pathname.startsWith('/api/webhooks/') || 
        pathname.startsWith('/api/agent/')) {
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

  // Karbantartási mód ellenőrzése (csak nem API és nem statikus fájlok esetén)
  // Kivételek: API, Next.js belső fájlok, statikus fájlok
  const isApiRoute = pathname.startsWith('/api/');
  const isNextInternal = pathname.startsWith('/_next/') || pathname.startsWith('/_vercel/');
  const isStaticFile = pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot|json|xml|txt)$/);
  
  if (!isApiRoute && !isNextInternal && !isStaticFile) {
    // Kivételek: login, maintenance, auth oldalak
    const isLoginPage = pathname.includes('/login');
    const isMaintenancePage = pathname.includes('/maintenance');
    const isAuthPage = pathname.includes('/auth/');
    
    // Csak akkor ellenőrizzük, ha nem login, maintenance vagy auth oldal
    if (!isLoginPage && !isMaintenancePage && !isAuthPage) {
      try {
        const maintenance = await isMaintenanceMode();
        
        if (maintenance) {
          // Token ellenőrzése (admin esetén engedélyezzük)
          let isAdmin = false;
          try {
            const token = await getToken({ 
              req: request, 
              secret: process.env.NEXTAUTH_SECRET 
            });
            isAdmin = !!(token && token.role === UserRole.ADMIN);
          } catch (tokenError) {
            // Token hiba esetén nem admin
            isAdmin = false;
          }
          
          // Ha admin, engedélyezzük a hozzáférést
          if (isAdmin) {
            return NextResponse.next();
          }
          
          // Ha nem admin, átirányítjuk a karbantartási oldalra
          const validLocales = ['hu', 'en'];
          let locale = 'hu';
          
          // Próbáljuk meg kinyerni a locale-t az útvonalból
          const pathParts = pathname.split('/').filter(Boolean);
          if (pathParts.length > 0 && validLocales.includes(pathParts[0])) {
            locale = pathParts[0];
          }
          
          // Ha root path, akkor is átirányítjuk
          if (pathname === '/') {
            locale = 'hu';
          }
          
          const maintenanceUrl = new URL(`/${locale}/maintenance`, request.url);
          return NextResponse.redirect(maintenanceUrl);
        }
      } catch (error) {
        // Hiba esetén logoljuk, de folytatjuk
        console.error('Maintenance check error:', error);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files (images, fonts, etc.)
     */
    '/',
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|json|xml|txt)$).*)',
  ],
};
