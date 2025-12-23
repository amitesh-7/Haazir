/**
 * Logger Utility for Haazir API
 * Provides structured logging with environment-aware output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private service: string;
  private isProduction: boolean;

  constructor(service = 'haazir-api') {
    this.service = service;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
    };

    if (data) {
      if (data instanceof Error) {
        entry.error = {
          message: data.message,
          stack: this.isProduction ? undefined : data.stack,
          code: (data as any).code,
        };
      } else {
        entry.data = this.sanitizeData(data);
      }
    }

    return entry;
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'authorization'];
    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  private output(entry: LogEntry): void {
    if (this.isProduction) {
      // In production, output JSON for log aggregation
      console.log(JSON.stringify(entry));
    } else {
      // In development, use colored console output
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      const color = colors[entry.level];
      
      const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`;
      const time = new Date(entry.timestamp).toLocaleTimeString();
      
      console.log(`${prefix} ${time} - ${entry.message}`);
      if (entry.data) console.log('  Data:', entry.data);
      if (entry.error) console.log('  Error:', entry.error);
    }
  }

  debug(message: string, data?: any): void {
    if (!this.isProduction) {
      this.output(this.formatLog('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    this.output(this.formatLog('info', message, data));
  }

  warn(message: string, data?: any): void {
    this.output(this.formatLog('warn', message, data));
  }

  error(message: string, error?: Error | any): void {
    this.output(this.formatLog('error', message, error));
  }
}

export const logger = new Logger();
export default logger;
