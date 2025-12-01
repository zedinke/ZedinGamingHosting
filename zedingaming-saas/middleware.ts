import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateLicense } from './lib/license-validator';

/**
 * License ellenőrző middleware
 * Védett route-okhoz (admin, API)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin és API route-ok védése
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const licenseCheck = await validateLicense();

    if (!licenseCheck.valid) {
      // License érvénytelen vagy lejárt
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          {
            error: 'License érvénytelen vagy lejárt',
            expired: licenseCheck.expired,
            remainingDays: licenseCheck.remainingDays,
          },
          { status: 403 }
        );
      } else {
        // Redirect license aktiválás oldalra
        return NextResponse.redirect(
          new URL('/license-required', request.url)
        );
      }
    }

    // License hamarosan lejár - warning header
    if (licenseCheck.expiringSoon) {
      const response = NextResponse.next();
      response.headers.set(
        'X-License-Warning',
        `License ${licenseCheck.remainingDays} nap múlva lejár`
      );
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};

