/**
 * Központi hibakezelő rendszer
 */

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Hibakódok
 */
export const ErrorCodes = {
  // Autentikáció
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Erőforrások
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Szerver műveletek
  SERVER_NOT_FOUND: 'SERVER_NOT_FOUND',
  SERVER_ALREADY_RUNNING: 'SERVER_ALREADY_RUNNING',
  SERVER_ALREADY_STOPPED: 'SERVER_ALREADY_STOPPED',
  SERVER_PROVISIONING_FAILED: 'SERVER_PROVISIONING_FAILED',
  
  // Agent műveletek
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_OFFLINE: 'AGENT_OFFLINE',
  AGENT_AUTH_FAILED: 'AGENT_AUTH_FAILED',
  
  // Task műveletek
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TASK_ALREADY_RUNNING: 'TASK_ALREADY_RUNNING',
  TASK_EXECUTION_FAILED: 'TASK_EXECUTION_FAILED',
  
  // Backup műveletek
  BACKUP_FAILED: 'BACKUP_FAILED',
  BACKUP_NOT_FOUND: 'BACKUP_NOT_FOUND',
  BACKUP_STORAGE_ERROR: 'BACKUP_STORAGE_ERROR',
  
  // Fizetés
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_PROVIDER_ERROR: 'PAYMENT_PROVIDER_ERROR',
  
  // Rendszer
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Általános
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

/**
 * Hibakezelő middleware Next.js API route-okhoz
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return Response.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: error.message || 'Ismeretlen hiba történt',
        },
      },
      { status: 500 }
    );
  }

  return Response.json(
    {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Ismeretlen hiba történt',
      },
    },
    { status: 500 }
  );
}

/**
 * Validációs hiba létrehozása
 */
export function createValidationError(field: string, message: string): AppError {
  return new AppError(
    ErrorCodes.VALIDATION_ERROR,
    `Validációs hiba: ${field} - ${message}`,
    400,
    { field, message }
  );
}

/**
 * Not Found hiba létrehozása
 */
export function createNotFoundError(resource: string, id?: string): AppError {
  return new AppError(
    ErrorCodes.NOT_FOUND,
    `${resource} nem található${id ? ` (ID: ${id})` : ''}`,
    404,
    { resource, id }
  );
}

/**
 * Unauthorized hiba létrehozása
 */
export function createUnauthorizedError(message: string = 'Nincs jogosultság'): AppError {
  return new AppError(ErrorCodes.UNAUTHORIZED, message, 401);
}

/**
 * Forbidden hiba létrehozása
 */
export function createForbiddenError(message: string = 'Hozzáférés megtagadva'): AppError {
  return new AppError(ErrorCodes.FORBIDDEN, message, 403);
}

