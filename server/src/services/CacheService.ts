/**
 * In-Memory Cache Service
 * Provides simple caching for frequently accessed data
 * For production, consider using Redis
 */

import logger from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(defaultTTLSeconds = 300) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean every minute
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      logger.debug('Cache cleanup completed', { removed, remaining: this.cache.size });
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deleted = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    logger.debug('Cache invalidation', { pattern, deleted });
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get or set pattern - fetch from cache or execute function
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetchFn();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const cacheKeys = {
  departments: () => 'departments:all',
  department: (id: number) => `department:${id}`,
  courses: (departmentId?: number) => departmentId ? `courses:dept:${departmentId}` : 'courses:all',
  course: (id: number) => `course:${id}`,
  teachers: (departmentId?: number) => departmentId ? `teachers:dept:${departmentId}` : 'teachers:all',
  teacher: (id: number) => `teacher:${id}`,
  timetable: (sectionId: number) => `timetable:section:${sectionId}`,
  teacherTimetable: (teacherId: number) => `timetable:teacher:${teacherId}`,
  studentTimetable: (studentId: number) => `timetable:student:${studentId}`,
};

export default cacheService;
