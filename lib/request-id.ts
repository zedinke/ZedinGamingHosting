/**
 * Request ID generálás és tracking
 */

import { randomBytes } from 'crypto';

/**
 * Request ID generálása
 */
export function generateRequestId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Request ID hozzáadása response header-hez
 */
export function addRequestIdHeader(response: Response, requestId: string): Response {
  response.headers.set('X-Request-ID', requestId);
  return response;
}

/**
 * Request ID kinyerése request header-ből
 */
export function getRequestId(request: Request): string | null {
  return request.headers.get('X-Request-ID') || null;
}

