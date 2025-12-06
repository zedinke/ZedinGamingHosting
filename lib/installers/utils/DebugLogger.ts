/**
 * Centralized debug logging system
 * Minden installer használja ezt az átlátható trace logoláshoz
 */

export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  error?: string;
}

export class DebugLogger {
  private logs: LogEntry[] = [];
  private context: string;
  private minLevel: LogLevel = LogLevel.DEBUG;

  constructor(context: string) {
    this.context = context;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.TRACE, LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      context: this.context,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
      error: error ? error.stack : undefined,
    };

    this.logs.push(entry);

    // Console output
    const prefix = `[${entry.timestamp}] [${level}] [${this.context}]`;
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case LogLevel.TRACE:
        console.trace(fullMessage, data || '');
        break;
      case LogLevel.DEBUG:
        console.debug(fullMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(fullMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, error || data || '');
        break;
    }
  }

  trace(message: string, data?: any): void {
    this.log(LogLevel.TRACE, message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsAsString(): string {
    return this.logs
      .map((entry) => `[${entry.timestamp}] [${entry.level}] [${entry.context}] ${entry.message}${entry.data ? '\n' + entry.data : ''}`)
      .join('\n');
  }

  clear(): void {
    this.logs = [];
  }
}
