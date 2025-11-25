/**
 * Biztonsági segédfüggvények
 */

import { randomBytes, createHash } from 'crypto';

/**
 * Biztonságos random string generálása
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * SHA256 hash generálása
 */
export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * IP cím validálása
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Regex.test(ip);
}

/**
 * Email cím validálása
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * SQL injection elleni védelem (egyszerű)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

/**
 * XSS védelem (egyszerű HTML escape)
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Jelszó erősség ellenőrzése
 */
export function checkPasswordStrength(password: string): {
  strong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('A jelszónak legalább 8 karakter hosszúnak kell lennie');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Használj kisbetűket');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Használj nagybetűket');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Használj számokat');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Használj speciális karaktereket');
  }

  return {
    strong: score >= 4,
    score,
    feedback: feedback.length > 0 ? feedback : ['Erős jelszó'],
  };
}

/**
 * Rate limiting kulcs generálása
 */
export function getRateLimitKey(identifier: string, endpoint: string): string {
  return `rate_limit:${identifier}:${endpoint}`;
}

/**
 * CSRF token generálása
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * CSRF token validálása
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }
  
  // Egyszerű összehasonlítás (valós implementációban HMAC-et használj)
  return token === sessionToken;
}

