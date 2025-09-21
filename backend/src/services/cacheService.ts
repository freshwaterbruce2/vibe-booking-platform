import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { MockCacheService, mockCacheService } from './mockCacheService';

export class CacheService {
  private redis: Redis | null = null;
  private mockCache: MockCacheService | null = null;
  private defaultTTL: number;
  private isRedisAvailable: boolean = false;

  constructor() {
    // Always use mock cache for local SQLite development
    if (process.env.LOCAL_SQLITE === 'true') {
      this.mockCache = mockCacheService;
      logger.info('Using mock cache service for local development');
      this.defaultTTL = 3600;
      return;
    }
    
    // Try to connect to Redis for production
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times: number) => {
          if (times > 3) {
            logger.warn('Redis unavailable after 3 attempts, using mock cache');
            this.isRedisAvailable = false;
            this.mockCache = mockCacheService;
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      };
      
      this.redis = new Redis(redisConfig);

      this.redis.on('connect', () => {
        logger.info('Redis connected');
        this.isRedisAvailable = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error', { error });
        this.isRedisAvailable = false;
        if (!this.mockCache) {
          this.mockCache = mockCacheService;
        }
      });
    } catch (error) {
      logger.warn('Redis initialization failed, using mock cache', { error });
      this.mockCache = mockCacheService;
    }
    
    this.defaultTTL = parseInt(process.env.REDIS_TTL || '3600');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.mockCache) {
        return this.mockCache.get<T>(key);
      }
      if (!this.redis || !this.isRedisAvailable) return null;
      
      const value = await this.redis.get(key);
      if (!value) return null;
      
      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache get error', { error, key });
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (this.mockCache) {
        return this.mockCache.set(key, value, ttl);
      }
      if (!this.redis || !this.isRedisAvailable) return;
      
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL || 3600;
      
      await this.redis.setex(key, expiry, serialized);
    } catch (error) {
      logger.error('Cache set error', { error, key });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.mockCache) {
        return this.mockCache.delete(key);
      }
      if (!this.redis || !this.isRedisAvailable) return;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error', { error, key });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.mockCache) {
        const keys = await this.mockCache.keys(pattern);
        await Promise.all(keys.map(key => this.mockCache!.delete(key)));
        return;
      }
      if (!this.redis || !this.isRedisAvailable) return;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error', { error, pattern });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.mockCache) {
        const value = await this.mockCache.get(key);
        return value !== null;
      }
      if (!this.redis || !this.isRedisAvailable) return false;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { error, key });
      return false;
    }
  }

  async increment(key: string, amount = 1): Promise<number> {
    try {
      if (this.mockCache) {
        const current = await this.mockCache.get<number>(key) || 0;
        const newValue = current + amount;
        await this.mockCache.set(key, newValue);
        return newValue;
      }
      if (!this.redis || !this.isRedisAvailable) return 0;
      return await this.redis.incrby(key, amount);
    } catch (error) {
      logger.error('Cache increment error', { error, key });
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      if (this.mockCache) {
        // Mock cache doesn't support expire, would need to re-set with new TTL
        const value = await this.mockCache.get(key);
        if (value) {
          await this.mockCache.set(key, value, ttl);
        }
        return;
      }
      if (!this.redis || !this.isRedisAvailable) return;
      await this.redis.expire(key, ttl);
    } catch (error) {
      logger.error('Cache expire error', { error, key });
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (this.mockCache) {
        return Promise.all(keys.map(key => this.mockCache!.get<T>(key)));
      }
      if (!this.redis || !this.isRedisAvailable) {
        return keys.map(() => null);
      }
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Cache mget error', { error, keys });
      return keys.map(() => null);
    }
  }

  async mset(items: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    try {
      if (this.mockCache) {
        await Promise.all(items.map(({ key, value, ttl }) =>
          this.mockCache!.set(key, value, ttl)
        ));
        return;
      }
      if (!this.redis || !this.isRedisAvailable) return;

      const pipeline = this.redis.pipeline();

      items.forEach(({ key, value, ttl }) => {
        const serialized = JSON.stringify(value);
        const expiry = ttl || this.defaultTTL;
        pipeline.setex(key, expiry, serialized);
      });

      await pipeline.exec();
    } catch (error) {
      logger.error('Cache mset error', { error });
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.mockCache) {
        await this.mockCache.clear();
        logger.info('Mock cache flushed');
        return;
      }
      if (!this.redis || !this.isRedisAvailable) return;
      await this.redis.flushdb();
      logger.info('Redis cache flushed');
    } catch (error) {
      logger.error('Cache flush error', { error });
    }
  }

  async close(): Promise<void> {
    try {
      if (this.redis && this.isRedisAvailable) {
        await this.redis.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection', { error });
    }
  }

  /**
   * Advanced caching methods for performance optimization
   */

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  async remember<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>
  ): Promise<T> {
    return this.getOrSet(key, callback, ttl);
  }

  async tags(tags: string[]): Promise<{
    set: (key: string, value: any, ttl?: number) => Promise<void>;
    get: <T>(key: string) => Promise<T | null>;
    flush: () => Promise<void>;
  }> {
    const taggedKey = (key: string) => `tag:${tags.join(':')}:${key}`;
    const tagPrefix = `tags:${tags.join(':')}`;

    return {
      set: async (key: string, value: any, ttl?: number) => {
        await this.set(taggedKey(key), value, ttl);
        // Track tagged keys for bulk operations
        const taggedKeys = await this.get<string[]>(`${tagPrefix}:keys`) || [];
        if (!taggedKeys.includes(key)) {
          taggedKeys.push(key);
          await this.set(`${tagPrefix}:keys`, taggedKeys, ttl);
        }
      },
      get: <T>(key: string) => this.get<T>(taggedKey(key)),
      flush: async () => {
        const taggedKeys = await this.get<string[]>(`${tagPrefix}:keys`) || [];
        await Promise.all([
          ...taggedKeys.map(key => this.delete(taggedKey(key))),
          this.delete(`${tagPrefix}:keys`)
        ]);
      }
    };
  }

  async performance(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    averageResponseTime: number;
  }> {
    const hits = await this.get<number>('cache:stats:hits') || 0;
    const misses = await this.get<number>('cache:stats:misses') || 0;
    const totalTime = await this.get<number>('cache:stats:totalTime') || 0;
    const total = hits + misses;

    return {
      hits,
      misses,
      hitRate: total > 0 ? (hits / total) * 100 : 0,
      averageResponseTime: total > 0 ? totalTime / total : 0
    };
  }

  private async recordHit(responseTime: number): Promise<void> {
    try {
      await this.increment('cache:stats:hits');
      await this.increment('cache:stats:totalTime', responseTime);
    } catch (error) {
      // Silent fail for metrics
    }
  }

  private async recordMiss(responseTime: number): Promise<void> {
    try {
      await this.increment('cache:stats:misses');
      await this.increment('cache:stats:totalTime', responseTime);
    } catch (error) {
      // Silent fail for metrics
    }
  }
}

// Enhanced cache service with performance monitoring
class PerformanceCacheService extends CacheService {
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    const result = await super.get<T>(key);
    const responseTime = Date.now() - startTime;

    if (result !== null) {
      await this.recordHit(responseTime);
    } else {
      await this.recordMiss(responseTime);
    }

    return result;
  }

  private async recordHit(responseTime: number): Promise<void> {
    try {
      await this.increment('cache:stats:hits');
      await this.increment('cache:stats:totalTime', responseTime);
    } catch (error) {
      // Silent fail for metrics
    }
  }

  private async recordMiss(responseTime: number): Promise<void> {
    try {
      await this.increment('cache:stats:misses');
      await this.increment('cache:stats:totalTime', responseTime);
    } catch (error) {
      // Silent fail for metrics
    }
  }
}

export const cacheService = new PerformanceCacheService();

// Cache key generators for consistency
export const CacheKeys = {
  hotel: (id: string) => `hotel:${id}`,
  hotelSearch: (query: string, filters: string) => `search:${Buffer.from(query + filters).toString('base64')}`,
  hotelAvailability: (hotelId: string, checkIn: string, checkOut: string) =>
    `availability:${hotelId}:${checkIn}:${checkOut}`,
  userBookings: (userId: string) => `bookings:user:${userId}`,
  popularDestinations: () => 'destinations:popular',
  exchangeRates: () => 'exchange:rates',
  weatherData: (location: string) => `weather:${location}`,
  aiResponse: (query: string) => `ai:${Buffer.from(query).toString('base64')}`
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 5 * 60,        // 5 minutes - for frequently changing data
  MEDIUM: 30 * 60,      // 30 minutes - for semi-static data
  LONG: 2 * 60 * 60,    // 2 hours - for relatively static data
  EXTENDED: 24 * 60 * 60, // 24 hours - for very static data
  SEARCH: 10 * 60,      // 10 minutes - for search results
  USER_DATA: 15 * 60,   // 15 minutes - for user-specific data
  EXTERNAL_API: 60 * 60 // 1 hour - for external API responses
};