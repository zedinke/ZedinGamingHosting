import { NextRequest } from 'next/server';

// In-memory rate limit store (production-ben Redis-t használjunk)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit ellenőrzése
 */
export function checkRateLimit(
  request: NextRequest,
  limit: number = 100, // Alapértelmezett limit: 100 kérés
  windowMs: number = 60 * 1000 // Alapértelmezett ablak: 1 perc
): { allowed: boolean; remaining: number; resetTime: number } {
  // IP cím meghatározása
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  // API kulcs ellenőrzése (ha van)
  const apiKey = request.headers.get('x-api-key');
  const identifier = apiKey ? `api-key:${apiKey}` : `ip:${ip}`;

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Ha nincs entry vagy lejárt, új entry létrehozása
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, newEntry);

    // Régi entryk törlése (cleanup)
    cleanupExpiredEntries();

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Ha elérte a limitet
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Számláló növelése
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Lejárt entryk törlése
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit middleware
 */
export function rateLimitMiddleware(
  limit: number = 100,
  windowMs: number = 60 * 1000
) {
  return (request: NextRequest) => {
    const result = checkRateLimit(request, limit, windowMs);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Túl sok kérés',
          message: 'Rate limit túllépve. Kérjük, próbáld újra később.',
          resetTime: new Date(result.resetTime).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Nincs hiba, folytathatjuk
  };
}

/**
 * API kulcs alapú rate limit (magasabb limit)
 */
export function checkApiKeyRateLimit(
  request: NextRequest,
  limit: number = 1000, // API kulcs esetén magasabb limit
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    // Ha nincs API kulcs, normál rate limit
    return checkRateLimit(request, 100, windowMs);
  }

  return checkRateLimit(request, limit, windowMs);
}

