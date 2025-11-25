/**
 * Debug logging utility
 * Logs everything when debug mode is enabled
 */

import { prisma } from './prisma';
import { writeFile, appendFile, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const DEBUG_LOG_DIR = join(process.cwd(), 'logs', 'debug');
const DEBUG_LOG_FILE = join(DEBUG_LOG_DIR, `debug-${new Date().toISOString().split('T')[0]}.log`);

// Ensure log directory exists
if (!existsSync(DEBUG_LOG_DIR)) {
  mkdirSync(DEBUG_LOG_DIR, { recursive: true });
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Check if debug mode is enabled
 */
export async function isDebugModeEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'debug_mode' },
    });
    return setting?.value === 'true';
  } catch (error) {
    console.error('Error checking debug mode:', error);
    return false;
  }
}

/**
 * Enable or disable debug mode
 */
export async function setDebugMode(enabled: boolean): Promise<void> {
  try {
    await prisma.setting.upsert({
      where: { key: 'debug_mode' },
      update: { value: enabled ? 'true' : 'false' },
      create: {
        key: 'debug_mode',
        value: enabled ? 'true' : 'false',
      },
    });
  } catch (error) {
    console.error('Error setting debug mode:', error);
    throw error;
  }
}

/**
 * Log a debug entry
 */
async function writeLog(entry: LogEntry): Promise<void> {
  try {
    const logLine = JSON.stringify(entry) + '\n';
    await appendFile(DEBUG_LOG_FILE, logLine, 'utf-8');
  } catch (error) {
    console.error('Error writing debug log:', error);
  }
}

/**
 * Debug logger - only logs if debug mode is enabled
 */
export class DebugLogger {
  private static async log(
    level: LogEntry['level'],
    category: string,
    message: string,
    data?: any,
    context?: { userId?: string; ip?: string; userAgent?: string }
  ): Promise<void> {
    const isEnabled = await isDebugModeEnabled();
    if (!isEnabled) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data, null, 2)) : undefined,
      userId: context?.userId,
      ip: context?.ip,
      userAgent: context?.userAgent,
    };

    // Write to file
    await writeLog(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      consoleMethod(`[DEBUG ${level.toUpperCase()}] [${category}] ${message}`, data || '');
    }
  }

  static async info(category: string, message: string, data?: any, context?: { userId?: string; ip?: string; userAgent?: string }): Promise<void> {
    await this.log('info', category, message, data, context);
  }

  static async warn(category: string, message: string, data?: any, context?: { userId?: string; ip?: string; userAgent?: string }): Promise<void> {
    await this.log('warn', category, message, data, context);
  }

  static async error(category: string, message: string, data?: any, context?: { userId?: string; ip?: string; userAgent?: string }): Promise<void> {
    await this.log('error', category, message, data, context);
  }

  static async debug(category: string, message: string, data?: any, context?: { userId?: string; ip?: string; userAgent?: string }): Promise<void> {
    await this.log('debug', category, message, data, context);
  }
}

/**
 * Middleware helper to extract request context
 */
export function getRequestContext(request: Request): { ip?: string; userAgent?: string } {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ip, userAgent };
}

/**
 * Read debug logs
 */
export async function readDebugLogs(limit: number = 1000, level?: LogEntry['level']): Promise<LogEntry[]> {
  try {
    if (!existsSync(DEBUG_LOG_FILE)) {
      return [];
    }

    const content = await readFile(DEBUG_LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let logs: LogEntry[] = lines
      .map(line => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((log): log is LogEntry => log !== null);

    // Filter by level if specified
    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    // Sort by timestamp (newest first) and limit
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return logs.slice(0, limit);
  } catch (error) {
    console.error('Error reading debug logs:', error);
    return [];
  }
}

/**
 * Clear debug logs
 */
export async function clearDebugLogs(): Promise<void> {
  try {
    if (existsSync(DEBUG_LOG_FILE)) {
      await writeFile(DEBUG_LOG_FILE, '', 'utf-8');
    }
  } catch (error) {
    console.error('Error clearing debug logs:', error);
    throw error;
  }
}

