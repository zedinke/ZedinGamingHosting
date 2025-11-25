import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['hu', 'en'];
const defaultLocale = 'hu';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
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

