/**
 * API route wrapper függvények a közös funkcionalitáshoz
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { UserRole } from '@prisma/client';
import { handleApiError, createUnauthorizedError, createForbiddenError } from './error-handler';
import { withPerformanceMonitoring } from './performance-monitor';
import { logger } from './logger';
import { cache } from './cache';
import { generateRequestId, addRequestIdHeader } from './request-id';

/**
 * Autentikált API route wrapper
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  endpoint: string,
  method: string = 'GET',
  requireRole?: UserRole
) {
  return withPerformanceMonitoring(
    async (request: NextRequest, ...args: T) => {
      try {
        const session = await getServerSession(authOptions);

        if (!session) {
          throw createUnauthorizedError('Bejelentkezés szükséges');
        }

        if (requireRole && (session.user as any).role !== requireRole) {
          throw createForbiddenError('Nincs jogosultság');
        }

        const requestId = generateRequestId();
        logger.debug('API request', {
          endpoint,
          method,
          userId: (session.user as any).id,
          requestId,
        });

        const response = await handler(request, ...args);
        return addRequestIdHeader(response, requestId);
      } catch (error) {
        logger.error('API error', error as Error, {
          endpoint,
          method,
        });
        return handleApiError(error);
      }
    },
    endpoint,
    method
  );
}

/**
 * Cache-elt API route wrapper
 */
export function withCache<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  endpoint: string,
  method: string = 'GET',
  ttl: number = 5 * 60 * 1000 // 5 perc
) {
  return withPerformanceMonitoring(
    async (request: NextRequest, ...args: T) => {
      const cacheKey = `${method}:${endpoint}:${request.nextUrl.search}`;
      const cached = cache.get<Response>(cacheKey);

      if (cached) {
        logger.debug('Cache hit', { endpoint, cacheKey });
        return cached;
      }

      const response = await handler(request, ...args);
      cache.set(cacheKey, response, ttl);

      return response;
    },
    endpoint,
    method
  );
}

/**
 * Autentikált és cache-elt API route wrapper
 */
export function withAuthAndCache<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  endpoint: string,
  method: string = 'GET',
  requireRole?: UserRole,
  ttl: number = 5 * 60 * 1000
) {
  return withAuth(
    async (request: NextRequest, ...args: T) => {
      const cacheKey = `${method}:${endpoint}:${(request as any).user?.id || 'anonymous'}:${request.nextUrl.search}`;
      const cached = cache.get<Response>(cacheKey);

      if (cached) {
        logger.debug('Cache hit', { endpoint, cacheKey });
        return cached;
      }

      const response = await handler(request, ...args);
      cache.set(cacheKey, response, ttl);

      return response;
    },
    endpoint,
    method,
    requireRole
  );
}

