/**
 * Cache Middleware
 * Provides HTTP response caching for GET requests
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/CacheService';

interface CacheOptions {
  ttlSeconds?: number;
  keyGenerator?: (req: Request) => string;
}

/**
 * Default cache key generator based on URL and query params
 */
const defaultKeyGenerator = (req: Request): string => {
  const queryString = Object.keys(req.query).length > 0
    ? `?${new URLSearchParams(req.query as Record<string, string>).toString()}`
    : '';
  return `http:${req.method}:${req.originalUrl}${queryString}`;
};

/**
 * Cache middleware factory
 * Only caches GET requests
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { ttlSeconds = 300, keyGenerator = defaultKeyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedResponse = cacheService.get<any>(cacheKey);

    if (cachedResponse) {
      // Add cache hit header
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (body: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, body, ttlSeconds);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Pre-configured cache middlewares
 */
export const shortCache = cacheMiddleware({ ttlSeconds: 60 });      // 1 minute
export const mediumCache = cacheMiddleware({ ttlSeconds: 300 });    // 5 minutes
export const longCache = cacheMiddleware({ ttlSeconds: 600 });      // 10 minutes
export const staticCache = cacheMiddleware({ ttlSeconds: 3600 });   // 1 hour

/**
 * Cache invalidation middleware
 * Clears cache for related resources after mutations
 */
export const invalidateCache = (patterns: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful mutation
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheService.invalidatePattern(pattern);
        });
      }
      return originalJson(body);
    };

    next();
  };
};

export default {
  cacheMiddleware,
  shortCache,
  mediumCache,
  longCache,
  staticCache,
  invalidateCache,
};
