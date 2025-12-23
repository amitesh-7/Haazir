/**
 * Rate Limiting Middleware for Haazir API
 * Protects against brute force and DDoS attacks
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';
import logger from '../utils/logger';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

const defaultKeyGenerator = (req: Request): string => {
  // Use IP address as default key
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.ip || req.socket.remoteAddress || 'unknown';
  return `rate_limit:${ip}`;
};

/**
 * Create a rate limiter middleware
 */
export const createRateLimiter = (config: RateLimitConfig) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    // Create new entry or reset if window expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      logger.warn('Rate limit exceeded', { 
        key, 
        count: entry.count, 
        limit: maxRequests,
        path: req.path 
      });
      
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: resetSeconds,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Optionally skip counting failed requests
    if (skipFailedRequests) {
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          const currentEntry = rateLimitStore.get(key);
          if (currentEntry) {
            currentEntry.count = Math.max(0, currentEntry.count - 1);
          }
        }
      });
    }

    next();
  };
};

/**
 * Pre-configured rate limiters for common use cases
 */

// Strict limiter for authentication endpoints (5 attempts per 15 minutes)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  skipFailedRequests: false,
});

// Standard API limiter (100 requests per minute)
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many requests. Please slow down.',
});

// Relaxed limiter for read-heavy endpoints (200 requests per minute)
export const readLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 200,
  message: 'Too many requests. Please slow down.',
});

// Strict limiter for sensitive operations (10 per hour)
export const sensitiveLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many sensitive operations. Please try again later.',
});

// Upload limiter (20 uploads per hour)
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many uploads. Please try again later.',
});

export default {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  readLimiter,
  sensitiveLimiter,
  uploadLimiter,
};
