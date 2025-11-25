import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const locales = ['hu', 'en'];
const defaultLocale = 'hu';

// Cache a karbantartási módhoz (5 másodperc)
let maintenanceCache: { value: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 5000; // 5 másodperc

// Prisma client singleton a middleware-hez
let prismaClient: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

async function checkMaintenanceMode(): Promise<boolean> {
  // Cache ellenőrzése
  if (maintenanceCache && Date.now() - maintenanceCache.timestamp < CACHE_DURATION) {
    return maintenanceCache.value;
  }

  try {
    const prisma = getPrismaClient();
    const setting = await prisma.setting.findUnique({
      where: { key: 'maintenance_mode' },
    });
    const isMaintenance = setting?.value === 'true';
    
    // Cache frissítése
    maintenanceCache = {
      value: isMaintenance,
      timestamp: Date.now(),
    };
    
    return isMaintenance;
  } catch (error) {
    console.error('Maintenance mode check error:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Kivételek: API routes, static files, admin routes, auth routes, maintenance page
  const isExcludedPath = 
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('/admin') ||
    pathname.includes('/auth') ||
    pathname.includes('/maintenance') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/);

  // Ha nem kivétel, ellenőrizzük a karbantartási módot
  if (!isExcludedPath) {
    const isMaintenance = await checkMaintenanceMode();
    
    if (isMaintenance) {
      // Session token ellenőrzése
      const sessionToken = request.cookies.get('next-auth.session-token') || 
                          request.cookies.get('__Secure-next-auth.session-token');
      
      // Ha nincs session token, biztosan nem admin, redirect
      if (!sessionToken) {
        const locale = getLocale(request) || defaultLocale;
        return NextResponse.redirect(
          new URL(`/${locale}/maintenance`, request.url)
        );
      }
      
      // Ha van session token, lehet hogy admin - ezt a layout-ban ellenőrizzük
      // A middleware-ben nem tudjuk biztosan, hogy admin-e, ezért átengedjük
      // de a layout-ban/server component-ben ellenőrizzük
    }
  }
  
  // Root path kezelése
  if (pathname === '/') {
    const locale = getLocale(request) || defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}`, request.url)
    );
  }
  
  // Ellenőrizzük, hogy van-e locale a pathban
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Ha nincs locale, hozzáadjuk
  if (!pathnameHasLocale) {
    const locale = getLocale(request) || defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }
}

function getLocale(request: NextRequest): string | undefined {
  // Accept-Language header alapján
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    for (const locale of locales) {
      if (acceptLanguage.includes(locale)) {
        return locale;
      }
    }
  }
  return defaultLocale;
}

export const config = {
  matcher: [
    // Kivételek: API routes, static files, _next
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|).*)',
  ],
};

