/**
 * Security Middleware
 * Adds security headers and protections
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware
 * Implements common security headers without external dependencies
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Content Security Policy (relaxed for API)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'"
    );
  }
  
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

/**
 * Request sanitization middleware
 * Removes potentially dangerous characters from request body
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Recursively sanitize object values
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    // Remove null bytes
    return obj.replace(/\0/g, '');
  }
  
  return obj;
};

/**
 * Prevent parameter pollution
 * Ensures query parameters are not arrays when not expected
 */
export const preventParamPollution = (allowedArrayParams: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value) && !allowedArrayParams.includes(key)) {
          // Take only the last value
          req.query[key] = value[value.length - 1];
        }
      }
    }
    next();
  };
};

/**
 * Request size limiter
 * Additional protection against large payloads
 */
export const requestSizeLimiter = (maxSizeBytes: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request body exceeds maximum size of ${maxSizeBytes} bytes`,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
    
    next();
  };
};

/**
 * IP whitelist/blacklist middleware
 */
export const ipFilter = (options: { whitelist?: string[]; blacklist?: string[] } = {}) => {
  const { whitelist, blacklist } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    
    // Check blacklist first
    if (blacklist && blacklist.includes(clientIp)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_BLOCKED',
          message: 'Access denied',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
    
    // Check whitelist if defined
    if (whitelist && whitelist.length > 0 && !whitelist.includes(clientIp)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Access denied',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
    
    next();
  };
};

export default {
  securityHeaders,
  sanitizeRequest,
  preventParamPollution,
  requestSizeLimiter,
  ipFilter,
};
