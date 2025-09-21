import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { cacheService, CacheKeys, CacheTTL } from '../services/cacheService';
import { logger } from '../utils/logger';

/**
 * Performance Optimization Middleware Suite
 * Implements aggressive caching, compression, and response time optimization
 */

interface PerformanceMetrics {
  responseTime: number;
  cacheHit: boolean;
  compressionRatio?: number;
  memoryUsage: NodeJS.MemoryUsage;
  route: string;
  method: string;
  statusCode: number;
}

// Performance metrics collection
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_HISTORY = 1000;

/**
 * Intelligent response caching middleware
 */
export const intelligentCache = (ttl: number = CacheTTL.MEDIUM) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or if cache-control header present
    if (req.method !== 'GET' || req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const startTime = Date.now();

    try {
      // Try to get cached response
      const cached = await cacheService.get<{
        data: any;
        headers: Record<string, string>;
        statusCode: number;
      }>(cacheKey);

      if (cached) {
        // Set cached headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.status(cached.statusCode).json(cached.data);

        // Record cache hit metrics
        recordMetrics(req, res, Date.now() - startTime, true);
        return;
      }

      // Cache miss - intercept response
      const originalJson = res.json;
      const originalSend = res.send;
      const originalStatus = res.status;
      let statusCode = 200;
      let responseData: any;

      // Override status method to capture status code
      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      // Override json method to capture response data
      res.json = function(data: any) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Override send method for text responses
      res.send = function(data: any) {
        responseData = data;
        return originalSend.call(this, data);
      };

      // Intercept response finish to cache result
      res.on('finish', async () => {
        if (statusCode === 200 && responseData) {
          const headers: Record<string, string> = {};
          
          // Capture important headers
          ['content-type', 'cache-control', 'etag', 'last-modified'].forEach(header => {
            const value = res.getHeader(header);
            if (value) {
              headers[header] = String(value);
            }
          });

          // Cache the response
          await cacheService.set(cacheKey, {
            data: responseData,
            headers,
            statusCode
          }, ttl);

          logger.debug('Response cached', {
            cacheKey,
            ttl,
            dataSize: JSON.stringify(responseData).length
          });
        }

        // Record cache miss metrics
        recordMetrics(req, res, Date.now() - startTime, false);
      });

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      next();
    } catch (error) {
      logger.error('Cache middleware error', { error, cacheKey });
      next();
    }
  };
};

/**
 * Advanced compression middleware with dynamic settings
 */
export const dynamicCompression = compression({
  filter: (req, res) => {
    // Don't compress small responses
    const contentLength = res.getHeader('content-length');
    if (contentLength && parseInt(String(contentLength)) < 1024) {
      return false;
    }

    // Always compress JSON and text responses
    const contentType = res.getHeader('content-type');
    if (contentType) {
      const type = String(contentType).toLowerCase();
      if (type.includes('json') || type.includes('text') || type.includes('javascript')) {
        return true;
      }
    }

    return compression.filter(req, res);
  },
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  windowBits: 15,
  memLevel: 8
});

/**
 * Response time optimization middleware
 */
export const responseTimeOptimizer = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Set performance headers
  res.setHeader('X-Response-Time', '0ms');
  res.setHeader('X-Powered-By', 'Vibe-Hotels-Optimized');
  
  // Enable keep-alive for connection reuse
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');

  // Optimize for different content types
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('Mobile')) {
    // Mobile-specific optimizations
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  } else {
    // Desktop optimizations
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
  }

  // Track timing
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Log slow responses
    if (responseTime > 1000) {
      logger.warn('Slow response detected', {
        route: req.route?.path || req.path,
        method: req.method,
        responseTime: `${responseTime}ms`,
        userAgent: req.headers['user-agent']
      });
    }
  });

  next();
};

/**
 * Database query optimization middleware
 */
export const queryOptimizer = (req: Request, res: Response, next: NextFunction) => {
  // Add query hints to request for database optimizations
  req.queryHints = {
    useIndex: true,
    limit: req.query.limit ? Math.min(parseInt(String(req.query.limit)), 100) : 20,
    offset: req.query.offset ? parseInt(String(req.query.offset)) : 0,
    fields: req.query.fields ? String(req.query.fields).split(',') : undefined,
    cache: !req.headers['x-no-cache']
  };

  next();
};

/**
 * Asset optimization middleware for static files
 */
export const assetOptimizer = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path.toLowerCase();
  
  // Set aggressive caching for static assets
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  
  // WebP support detection and optimization
  const acceptsWebP = req.headers.accept?.includes('image/webp');
  if (acceptsWebP && path.match(/\.(jpg|jpeg|png)$/)) {
    res.setHeader('Vary', 'Accept');
    // In production, you'd serve WebP versions here
  }

  next();
};

/**
 * API rate limiting with intelligent throttling
 */
export const intelligentRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
      if (data.resetTime < windowStart) {
        requestCounts.delete(key);
      }
    }
    
    const current = requestCounts.get(String(identifier)) || { count: 0, resetTime: now + windowMs };
    
    if (current.count >= maxRequests) {
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', current.resetTime.toString());
      res.setHeader('Retry-After', Math.ceil((current.resetTime - now) / 1000).toString());
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }
    
    current.count++;
    requestCounts.set(String(identifier), current);
    
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - current.count).toString());
    res.setHeader('X-RateLimit-Reset', current.resetTime.toString());
    
    next();
  };
};

/**
 * Performance monitoring and metrics collection
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const metrics: PerformanceMetrics = {
      responseTime: endTime - startTime,
      cacheHit: res.getHeader('X-Cache') === 'HIT',
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      },
      route: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode
    };
    
    // Store metrics (keep only recent ones)
    performanceMetrics.push(metrics);
    if (performanceMetrics.length > MAX_METRICS_HISTORY) {
      performanceMetrics.shift();
    }
    
    // Log performance issues
    if (metrics.responseTime > 2000) {
      logger.warn('Very slow response', {
        route: metrics.route,
        responseTime: metrics.responseTime,
        memoryDelta: metrics.memoryUsage.heapUsed
      });
    }
  });
  
  next();
};

/**
 * Utility functions
 */
function generateCacheKey(req: Request): string {
  const base = `${req.method}:${req.path}`;
  const query = Object.keys(req.query).length > 0 ? `:${JSON.stringify(req.query)}` : '';
  const headers = req.headers['x-cache-vary'] ? `:${req.headers['x-cache-vary']}` : '';
  return Buffer.from(base + query + headers).toString('base64');
}

function recordMetrics(req: Request, res: Response, responseTime: number, cacheHit: boolean) {
  const metrics: PerformanceMetrics = {
    responseTime,
    cacheHit,
    memoryUsage: process.memoryUsage(),
    route: req.route?.path || req.path,
    method: req.method,
    statusCode: res.statusCode
  };
  
  performanceMetrics.push(metrics);
  if (performanceMetrics.length > MAX_METRICS_HISTORY) {
    performanceMetrics.shift();
  }
}

/**
 * Get performance statistics
 */
export const getPerformanceStats = () => {
  const recentMetrics = performanceMetrics.slice(-100); // Last 100 requests
  
  if (recentMetrics.length === 0) {
    return {
      averageResponseTime: 0,
      cacheHitRate: 0,
      totalRequests: 0,
      slowRequests: 0,
      errorRate: 0
    };
  }
  
  const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
  const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
  const slowRequests = recentMetrics.filter(m => m.responseTime > 1000).length;
  const errors = recentMetrics.filter(m => m.statusCode >= 400).length;
  
  return {
    averageResponseTime: Math.round(totalResponseTime / recentMetrics.length),
    cacheHitRate: Math.round((cacheHits / recentMetrics.length) * 100),
    totalRequests: recentMetrics.length,
    slowRequests,
    errorRate: Math.round((errors / recentMetrics.length) * 100),
    memoryUsage: process.memoryUsage()
  };
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      queryHints?: {
        useIndex: boolean;
        limit: number;
        offset: number;
        fields?: string[];
        cache: boolean;
      };
    }
  }
}