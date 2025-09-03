/**
 * API Response Time Optimization Utilities
 * 
 * Provides advanced caching, request batching, and response optimization
 * for high-performance API operations.
 */

import { logger } from './logger';
import { RetryManager } from './resilience';

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  staleWhileRevalidate?: number; // Serve stale data while revalidating
  prefix?: string;
  tags?: string[]; // For cache invalidation
}

export interface BatchOptions {
  maxBatchSize: number;
  maxWaitTimeMs: number;
  keyExtractor: (item: any) => string;
}

/**
 * Advanced caching with stale-while-revalidate support
 */
export class OptimizedCache {
  private cache: Map<string, { data: any; expires: number; stale: number; tags?: string[] }> = new Map();
  private pendingRevalidations: Map<string, Promise<any>> = new Map();

  /**
   * Get cached data with stale-while-revalidate support
   */
  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Cache hit - return fresh data
    if (cached && cached.expires > now) {
      return cached.data;
    }

    // Stale-while-revalidate: return stale data immediately, revalidate in background
    if (cached && options.staleWhileRevalidate && cached.stale > now) {
      // Return stale data immediately
      this.revalidateInBackground(key, fetcher, options);
      return cached.data;
    }

    // Cache miss or expired - fetch fresh data
    return await this.fetchAndCache(key, fetcher, options);
  }

  /**
   * Set cached data with expiration
   */
  set(key: string, data: any, options: CacheOptions): void {
    const now = Date.now();
    const expires = now + (options.ttl * 1000);
    const stale = options.staleWhileRevalidate 
      ? now + (options.staleWhileRevalidate * 1000)
      : expires;

    this.cache.set(key, {
      data,
      expires,
      stale,
      tags: options.tags
    });
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags: string[]): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.tags?.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Revalidate cache entry in background
   */
  private revalidateInBackground(
    key: string, 
    fetcher: () => Promise<any>, 
    options: CacheOptions
  ): void {
    if (this.pendingRevalidations.has(key)) {
      return; // Already revalidating
    }

    const revalidationPromise = this.fetchAndCache(key, fetcher, options)
      .finally(() => {
        this.pendingRevalidations.delete(key);
      });

    this.pendingRevalidations.set(key, revalidationPromise);
  }

  /**
   * Fetch data and update cache
   */
  private async fetchAndCache<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions
  ): Promise<T> {
    try {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    } catch (error) {
      // If fetch fails and we have stale data, return it
      const cached = this.cache.get(key);
      if (cached) {
        logger.warn('Cache fetch failed, returning stale data', {
          key,
          error: error instanceof Error ? error.message : String(error)
        });
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; pendingRevalidations: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need hit/miss tracking
      pendingRevalidations: this.pendingRevalidations.size
    };
  }
}

/**
 * Request batching for efficient API calls
 */
export class RequestBatcher<TInput, TOutput> {
  private pendingRequests: Map<string, {
    resolve: (value: TOutput) => void;
    reject: (error: Error) => void;
    input: TInput;
  }> = new Map();

  private batchTimer?: NodeJS.Timeout;

  constructor(
    private batchProcessor: (inputs: TInput[]) => Promise<TOutput[]>,
    private options: BatchOptions
  ) {}

  /**
   * Add request to batch
   */
  async request(input: TInput): Promise<TOutput> {
    return new Promise<TOutput>((resolve, reject) => {
      const key = this.options.keyExtractor(input);
      
      // If already pending, return existing promise
      if (this.pendingRequests.has(key)) {
        const existing = this.pendingRequests.get(key)!;
        existing.resolve = resolve;
        existing.reject = reject;
        return;
      }

      this.pendingRequests.set(key, { resolve, reject, input });

      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.options.maxWaitTimeMs);
      }

      // Process batch if we hit max size
      if (this.pendingRequests.size >= this.options.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  /**
   * Process current batch
   */
  private async processBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    if (this.pendingRequests.size === 0) {
      return;
    }

    const currentRequests = new Map(this.pendingRequests);
    this.pendingRequests.clear();

    try {
      const inputs = Array.from(currentRequests.values()).map(req => req.input);
      const outputs = await this.batchProcessor(inputs);

      // Resolve individual requests
      let index = 0;
      for (const [key, request] of currentRequests) {
        try {
          request.resolve(outputs[index]);
        } catch (error) {
          request.reject(error instanceof Error ? error : new Error(String(error)));
        }
        index++;
      }

      logger.debug('Batch processed successfully', {
        batchSize: inputs.length,
        processingTime: Date.now()
      });

    } catch (error) {
      // Reject all requests in batch
      for (const [key, request] of currentRequests) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }

      logger.error('Batch processing failed', {
        error: error instanceof Error ? error.message : String(error),
        batchSize: currentRequests.size
      });
    }
  }
}

/**
 * Response compression and optimization
 */
export class ResponseOptimizer {
  /**
   * Optimize API response by removing unnecessary fields
   */
  static optimizeHotelResponse(hotel: any): any {
    return {
      id: hotel.id,
      name: hotel.name,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      coordinates: {
        lat: hotel.latitude,
        lng: hotel.longitude
      },
      rating: hotel.starRating,
      description: hotel.description?.substring(0, 200) + '...', // Truncate description
      mainImage: hotel.images?.[0]?.url,
      imageCount: hotel.images?.length || 0,
      amenities: hotel.amenities?.slice(0, 10), // Limit amenities
      price: hotel.price,
      available: hotel.available
    };
  }

  /**
   * Optimize search results by paginating and filtering
   */
  static optimizeSearchResponse(hotels: any[], limit: number, offset: number): {
    hotels: any[];
    pagination: { limit: number; offset: number; total: number; hasMore: boolean };
  } {
    const total = hotels.length;
    const paginatedHotels = hotels
      .slice(offset, offset + limit)
      .map(hotel => this.optimizeHotelResponse(hotel));

    return {
      hotels: paginatedHotels,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Create optimized cache key
   */
  static createCacheKey(prefix: string, params: Record<string, any>): string {
    // Sort keys for consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    return `${prefix}:${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`;
  }
}

/**
 * Parallel request processor for concurrent operations
 */
export class ParallelProcessor {
  /**
   * Process requests in parallel with concurrency limit
   */
  static async processInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrencyLimit: number = 5
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += concurrencyLimit) {
      const batch = items.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(item => 
        RetryManager.executeWithRetry(
          async () => processor(item),
          { maxAttempts: 2, baseDelayMs: 100 },
          'parallel-processing'
        )
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.warn('Parallel processing item failed', {
            error: result.reason
          });
          // Could push null or skip, depending on requirements
        }
      }
    }

    return results;
  }
}

// Export singleton instances
export const optimizedCache = new OptimizedCache();

export const hotelDetailsBatcher = new RequestBatcher(
  async (hotelIds: string[]) => {
    // This would be implemented to batch hotel detail requests
    logger.info('Processing hotel details batch', { count: hotelIds.length });
    return []; // Placeholder
  },
  {
    maxBatchSize: 10,
    maxWaitTimeMs: 100,
    keyExtractor: (hotelId: string) => hotelId
  }
);