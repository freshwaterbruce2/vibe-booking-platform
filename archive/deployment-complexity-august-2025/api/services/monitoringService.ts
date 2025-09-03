import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  uptime: number;
  timestamp: Date;
}

interface BusinessMetrics {
  totalBookings: number;
  successfulPayments: number;
  failedPayments: number;
  revenue: number;
  averageBookingValue: number;
  topDestinations: Array<{ city: string; count: number }>;
  userRegistrations: number;
  activeUsers: number;
  timestamp: Date;
}

interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

class MonitoringService {
  private metrics: MetricData[] = [];
  private systemMetricsInterval?: NodeJS.Timeout;
  private businessMetricsInterval?: NodeJS.Timeout;
  private apiMetrics: ApiMetrics[] = [];
  
  /**
   * Initialize monitoring service with Sentry and custom metrics
   */
  initializeMonitoring(app: Express): void {
    // Initialize Sentry if DSN is configured
    if (config.monitoring.sentryDsn) {
      this.initializeSentry(app);
    }

    // Start system metrics collection
    this.startSystemMetricsCollection();

    // Start business metrics collection
    this.startBusinessMetricsCollection();

    // Set up API metrics middleware
    this.setupApiMetricsMiddleware(app);

    // Set up health check endpoint
    this.setupHealthCheck(app);

    // Set up metrics export endpoint
    this.setupMetricsEndpoint(app);

    logger.info('Monitoring service initialized', {
      sentry: !!config.monitoring.sentryDsn,
      environment: config.environment
    });
  }

  /**
   * Initialize Sentry error tracking and performance monitoring
   */
  private initializeSentry(app: Express): void {
    try {
      Sentry.init({
        dsn: config.monitoring.sentryDsn,
        environment: config.environment,
        release: config.version,
        tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app }),
          nodeProfilingIntegration(),
        ],
        beforeSend(event) {
          // Filter out sensitive data
          if (event.request?.data && typeof event.request.data === 'object') {
            const sanitized = { ...event.request.data };
            // Remove sensitive fields
            delete sanitized.password;
            delete sanitized.cardNumber;
            delete sanitized.cvv;
            delete sanitized.ssn;
            event.request.data = sanitized;
          }
          return event;
        },
        beforeBreadcrumb(breadcrumb) {
          // Filter sensitive breadcrumbs
          if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('payment')) {
            breadcrumb.data = { ...breadcrumb.data, url: '[PAYMENT_URL_REDACTED]' };
          }
          return breadcrumb;
        }
      });

      // Sentry request handler must be the first middleware
      app.use(Sentry.Handlers.requestHandler());
      app.use(Sentry.Handlers.tracingHandler());

      logger.info('Sentry monitoring initialized', {
        environment: config.environment,
        release: config.version
      });
    } catch (error) {
      logger.error('Failed to initialize Sentry', { error });
    }
  }

  /**
   * Set up API metrics collection middleware
   */
  private setupApiMetricsMiddleware(app: Express): void {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      const originalSend = res.send;
      res.send = function(body) {
        const responseTime = Date.now() - startTime;
        
        // Record API metrics
        const apiMetric: ApiMetrics = {
          endpoint: req.route?.path || req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          timestamp: new Date(),
          userId: req.user?.id,
          userAgent: req.get('User-Agent')?.substring(0, 200),
          ip: req.ip
        };

        // Store metric (keep last 10000 entries)
        this.apiMetrics.push(apiMetric);
        if (this.apiMetrics.length > 10000) {
          this.apiMetrics.shift();
        }

        // Record custom metrics
        this.recordMetric({
          name: 'api_request_duration',
          value: responseTime,
          type: 'histogram',
          tags: {
            endpoint: apiMetric.endpoint,
            method: req.method,
            status: res.statusCode.toString()
          }
        });

        this.recordMetric({
          name: 'api_request_count',
          value: 1,
          type: 'counter',
          tags: {
            endpoint: apiMetric.endpoint,
            method: req.method,
            status: res.statusCode.toString()
          }
        });

        // Log slow requests
        if (responseTime > 5000) {
          logger.warn('Slow API request detected', {
            endpoint: apiMetric.endpoint,
            method: req.method,
            responseTime,
            statusCode: res.statusCode
          });
        }

        // Log error responses
        if (res.statusCode >= 400) {
          logger.warn('API error response', {
            endpoint: apiMetric.endpoint,
            method: req.method,
            statusCode: res.statusCode,
            responseTime
          });
        }

        return originalSend.call(this, body);
      }.bind(res);

      next();
    });
  }

  /**
   * Start collecting system metrics
   */
  private startSystemMetricsCollection(): void {
    this.systemMetricsInterval = setInterval(() => {
      const systemMetrics = this.collectSystemMetrics();
      
      this.recordMetric({
        name: 'system_cpu_usage',
        value: systemMetrics.cpuUsage,
        type: 'gauge'
      });

      this.recordMetric({
        name: 'system_memory_rss',
        value: systemMetrics.memoryUsage.rss,
        type: 'gauge'
      });

      this.recordMetric({
        name: 'system_memory_heap_used',
        value: systemMetrics.memoryUsage.heapUsed,
        type: 'gauge'
      });

      this.recordMetric({
        name: 'system_uptime',
        value: systemMetrics.uptime,
        type: 'gauge'
      });

    }, 30000); // Collect every 30 seconds
  }

  /**
   * Start collecting business metrics
   */
  private startBusinessMetricsCollection(): void {
    this.businessMetricsInterval = setInterval(async () => {
      try {
        const businessMetrics = await this.collectBusinessMetrics();
        
        this.recordMetric({
          name: 'business_total_bookings',
          value: businessMetrics.totalBookings,
          type: 'gauge'
        });

        this.recordMetric({
          name: 'business_successful_payments',
          value: businessMetrics.successfulPayments,
          type: 'gauge'
        });

        this.recordMetric({
          name: 'business_failed_payments',
          value: businessMetrics.failedPayments,
          type: 'gauge'
        });

        this.recordMetric({
          name: 'business_revenue',
          value: businessMetrics.revenue,
          type: 'gauge'
        });

        this.recordMetric({
          name: 'business_active_users',
          value: businessMetrics.activeUsers,
          type: 'gauge'
        });

      } catch (error) {
        logger.error('Failed to collect business metrics', { error });
      }
    }, 300000); // Collect every 5 minutes
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Simple CPU usage calculation
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    
    return {
      cpuUsage: cpuPercent,
      memoryUsage,
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  /**
   * Collect business metrics from database
   */
  private async collectBusinessMetrics(): Promise<BusinessMetrics> {
    // In production, these would be actual database queries
    // For now, return mock data structure
    return {
      totalBookings: 0,
      successfulPayments: 0,
      failedPayments: 0,
      revenue: 0,
      averageBookingValue: 0,
      topDestinations: [],
      userRegistrations: 0,
      activeUsers: 0,
      timestamp: new Date()
    };
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: MetricData): void {
    const metricWithTimestamp = {
      ...metric,
      timestamp: metric.timestamp || new Date()
    };

    this.metrics.push(metricWithTimestamp);

    // Keep only last 50000 metrics to prevent memory issues
    if (this.metrics.length > 50000) {
      this.metrics = this.metrics.slice(-25000);
    }

    // Send to external monitoring service if configured
    if (config.monitoring.sentryDsn) {
      Sentry.addBreadcrumb({
        category: 'metric',
        message: `${metric.name}: ${metric.value}`,
        level: 'info',
        data: {
          name: metric.name,
          value: metric.value,
          type: metric.type,
          tags: metric.tags
        }
      });
    }
  }

  /**
   * Record business event
   */
  recordBusinessEvent(event: string, data: Record<string, any>): void {
    logger.info('Business event', { event, data });
    
    if (config.monitoring.sentryDsn) {
      Sentry.addBreadcrumb({
        category: 'business',
        message: event,
        level: 'info',
        data
      });
    }

    // Record as metric
    this.recordMetric({
      name: `business_event_${event}`,
      value: 1,
      type: 'counter',
      tags: {
        event,
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        )
      }
    });
  }

  /**
   * Set up health check endpoint
   */
  private setupHealthCheck(app: Express): void {
    app.get('/health', (req: Request, res: Response) => {
      const systemMetrics = this.collectSystemMetrics();
      const recentApiMetrics = this.apiMetrics.slice(-100);
      const errorRate = recentApiMetrics.filter(m => m.statusCode >= 400).length / Math.max(recentApiMetrics.length, 1);
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: config.version,
        environment: config.environment,
        uptime: systemMetrics.uptime,
        memory: {
          used: systemMetrics.memoryUsage.heapUsed,
          total: systemMetrics.memoryUsage.heapTotal,
          percentage: Math.round((systemMetrics.memoryUsage.heapUsed / systemMetrics.memoryUsage.heapTotal) * 100)
        },
        api: {
          errorRate: Math.round(errorRate * 100),
          recentRequests: recentApiMetrics.length,
          averageResponseTime: Math.round(
            recentApiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / Math.max(recentApiMetrics.length, 1)
          )
        },
        services: {
          database: 'healthy', // In production, would check actual DB connection
          redis: 'healthy',    // In production, would check actual Redis connection
          email: 'healthy',    // In production, would check email service
          payment: 'healthy'   // In production, would check payment service
        }
      };

      // Determine overall health status
      if (health.memory.percentage > 90) {
        health.status = 'warning';
      }
      if (health.api.errorRate > 10) {
        health.status = 'warning';
      }
      if (health.api.averageResponseTime > 5000) {
        health.status = 'warning';
      }

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });
  }

  /**
   * Set up metrics export endpoint
   */
  private setupMetricsEndpoint(app: Express): void {
    app.get('/metrics', (req: Request, res: Response) => {
      const recentMetrics = this.metrics.slice(-1000);
      const systemMetrics = this.collectSystemMetrics();
      
      const metricsSummary = {
        timestamp: new Date().toISOString(),
        system: systemMetrics,
        metrics: {
          total: this.metrics.length,
          recent: recentMetrics.length,
          types: this.getMetricTypeCounts(),
          latest: recentMetrics.slice(-10)
        },
        api: {
          total: this.apiMetrics.length,
          recent: this.apiMetrics.slice(-100),
          topEndpoints: this.getTopEndpoints(),
          errorRate: this.calculateErrorRate(),
          averageResponseTime: this.calculateAverageResponseTime()
        }
      };

      res.json(metricsSummary);
    });
  }

  /**
   * Get metric type counts
   */
  private getMetricTypeCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.metrics.forEach(metric => {
      counts[metric.type] = (counts[metric.type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get top API endpoints by request count
   */
  private getTopEndpoints(): Array<{ endpoint: string; count: number; avgResponseTime: number }> {
    const endpointStats: Record<string, { count: number; totalResponseTime: number }> = {};
    
    this.apiMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointStats[key]) {
        endpointStats[key] = { count: 0, totalResponseTime: 0 };
      }
      endpointStats[key].count++;
      endpointStats[key].totalResponseTime += metric.responseTime;
    });

    return Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: Math.round(stats.totalResponseTime / stats.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate API error rate
   */
  private calculateErrorRate(): number {
    if (this.apiMetrics.length === 0) return 0;
    const errors = this.apiMetrics.filter(m => m.statusCode >= 400).length;
    return Math.round((errors / this.apiMetrics.length) * 100);
  }

  /**
   * Calculate average API response time
   */
  private calculateAverageResponseTime(): number {
    if (this.apiMetrics.length === 0) return 0;
    const total = this.apiMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return Math.round(total / this.apiMetrics.length);
  }

  /**
   * Capture exception with context
   */
  captureException(error: Error, context?: Record<string, any>): void {
    logger.error('Exception captured by monitoring service', { error: error.message, stack: error.stack, context });
    
    if (config.monitoring.sentryDsn) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        Sentry.captureException(error);
      });
    }
  }

  /**
   * Add performance monitoring for critical operations
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    let error: Error | null = null;
    
    try {
      const result = await fn();
      return result;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      this.recordMetric({
        name: `operation_duration_${operation}`,
        value: duration,
        type: 'timer',
        tags: {
          operation,
          status: error ? 'error' : 'success',
          ...tags
        }
      });

      if (error) {
        this.captureException(error, { operation, duration, tags });
      }

      if (duration > 10000) { // Log operations taking more than 10 seconds
        logger.warn('Slow operation detected', {
          operation,
          duration,
          status: error ? 'error' : 'success',
          tags
        });
      }
    }
  }

  /**
   * Clean up monitoring resources
   */
  cleanup(): void {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
    if (this.businessMetricsInterval) {
      clearInterval(this.businessMetricsInterval);
    }
    
    if (config.monitoring.sentryDsn) {
      Sentry.close(2000).then(() => {
        logger.info('Sentry monitoring closed');
      });
    }
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Export Sentry handlers for error middleware
export const sentryErrorHandler = config.monitoring.sentryDsn 
  ? Sentry.Handlers.errorHandler()
  : (error: any, req: Request, res: Response, next: NextFunction) => next(error);

export default monitoringService;