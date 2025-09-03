/**
 * Enhanced Error Handling and Resilience Utilities
 * 
 * Provides robust error handling, retry mechanisms, and circuit breakers
 * for high-availability email processing and API operations.
 */

import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringWindowMs: number;
}

/**
 * Advanced retry mechanism with exponential backoff and jitter
 */
export class RetryManager {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    context: string = 'operation'
  ): Promise<T> {
    const config: RetryOptions = {
      maxAttempts: options.maxAttempts || 3,
      baseDelayMs: options.baseDelayMs || 1000,
      maxDelayMs: options.maxDelayMs || 30000,
      backoffFactor: options.backoffFactor || 2,
      retryCondition: options.retryCondition || this.defaultRetryCondition,
      ...options
    };

    let lastError: Error;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          logger.info(`Operation succeeded after retry`, {
            context,
            attempt: attempt + 1,
            totalAttempts: config.maxAttempts
          });
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        // Check if we should retry this error
        if (!config.retryCondition(lastError)) {
          logger.error(`Operation failed with non-retryable error`, {
            context,
            error: lastError.message,
            attempt
          });
          throw lastError;
        }

        // Don't retry if we've exhausted attempts
        if (attempt >= config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          config.baseDelayMs * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelayMs
        );
        
        // Add jitter (±25% of delay)
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        const finalDelay = Math.max(0, delay + jitter);

        logger.warn(`Operation failed, retrying after delay`, {
          context,
          error: lastError.message,
          attempt,
          maxAttempts: config.maxAttempts,
          delayMs: Math.round(finalDelay)
        });

        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }

    logger.error(`Operation failed after all retry attempts`, {
      context,
      error: lastError!.message,
      totalAttempts: attempt,
      maxAttempts: config.maxAttempts
    });

    throw lastError!;
  }

  private static defaultRetryCondition(error: Error): boolean {
    // Retry on network errors, timeouts, and 5xx HTTP errors
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED', 
      'ETIMEDOUT',
      'ENOTFOUND',
      'ENETUNREACH'
    ];

    const errorMessage = error.message.toLowerCase();
    
    return (
      retryableErrors.some(code => errorMessage.includes(code.toLowerCase())) ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('5')  // 5xx errors
    );
  }
}

/**
 * Circuit breaker pattern to prevent cascading failures
 */
export class CircuitBreaker {
  private failures: number = 0;
  private nextAttempt: number = Date.now();
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureTimestamps: number[] = [];

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      monitoringWindowMs: 300000
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Clean up old failure timestamps
    this.cleanupOldFailures();

    // Check if circuit is open
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
        logger.warn('Circuit breaker prevented operation', {
          circuitBreaker: this.name,
          state: this.state,
          failures: this.failures,
          nextAttemptIn: this.nextAttempt - Date.now()
        });
        throw error;
      } else {
        // Try to close the circuit (half-open state)
        this.state = 'half-open';
        logger.info('Circuit breaker moving to half-open state', {
          circuitBreaker: this.name
        });
      }
    }

    try {
      const result = await operation();
      
      // Success - reset circuit breaker
      if (this.state === 'half-open' || this.failures > 0) {
        this.reset();
        logger.info('Circuit breaker reset after successful operation', {
          circuitBreaker: this.name,
          previousFailures: this.failures
        });
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      
      logger.error('Circuit breaker recorded failure', {
        circuitBreaker: this.name,
        error: error instanceof Error ? error.message : String(error),
        failures: this.failures,
        state: this.state,
        threshold: this.options.failureThreshold
      });
      
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.failureTimestamps.push(Date.now());

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
      
      logger.error('Circuit breaker opened due to failure threshold', {
        circuitBreaker: this.name,
        failures: this.failures,
        threshold: this.options.failureThreshold,
        resetIn: this.options.resetTimeoutMs
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.failureTimestamps = [];
  }

  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.options.monitoringWindowMs;
    this.failureTimestamps = this.failureTimestamps.filter(timestamp => timestamp > cutoff);
    this.failures = this.failureTimestamps.length;
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      threshold: this.options.failureThreshold,
      nextAttempt: this.state === 'open' ? new Date(this.nextAttempt).toISOString() : null
    };
  }
}

/**
 * Graceful degradation utility
 */
export class GracefulDegradation {
  /**
   * Execute operation with fallback
   */
  static async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (primaryError) {
      logger.warn('Primary operation failed, attempting fallback', {
        context,
        primaryError: primaryError instanceof Error ? primaryError.message : String(primaryError)
      });

      try {
        const result = await fallbackOperation();
        logger.info('Fallback operation succeeded', { context });
        return result;
      } catch (fallbackError) {
        logger.error('Both primary and fallback operations failed', {
          context,
          primaryError: primaryError instanceof Error ? primaryError.message : String(primaryError),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        });
        throw primaryError; // Throw the original error
      }
    }
  }

  /**
   * Execute with timeout
   */
  static async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context: string = 'operation'
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      logger.error('Operation failed or timed out', {
        context,
        timeoutMs,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

/**
 * Health check utility for monitoring system components
 */
export class HealthChecker {
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();

  registerCheck(name: string, checkFunction: () => Promise<boolean>): void {
    this.healthChecks.set(name, checkFunction);
  }

  async checkHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, { status: 'up' | 'down'; responseTime: number; error?: string }>;
  }> {
    const components: Record<string, { status: 'up' | 'down'; responseTime: number; error?: string }> = {};
    let healthyCount = 0;

    for (const [name, checkFn] of this.healthChecks) {
      const startTime = Date.now();
      try {
        const isHealthy = await GracefulDegradation.executeWithTimeout(
          checkFn,
          5000, // 5 second timeout for health checks
          `health-check-${name}`
        );
        
        const responseTime = Date.now() - startTime;
        components[name] = {
          status: isHealthy ? 'up' : 'down',
          responseTime
        };
        
        if (isHealthy) healthyCount++;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        components[name] = {
          status: 'down',
          responseTime,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    const totalChecks = this.healthChecks.size;
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    
    if (healthyCount === totalChecks) {
      overall = 'healthy';
    } else if (healthyCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return { overall, components };
  }
}

// Export singleton instances
export const emailServiceCircuitBreaker = new CircuitBreaker('email-service', {
  failureThreshold: 5,
  resetTimeoutMs: 60000,
  monitoringWindowMs: 300000
});

export const databaseCircuitBreaker = new CircuitBreaker('database', {
  failureThreshold: 3,
  resetTimeoutMs: 30000,
  monitoringWindowMs: 180000
});

export const healthChecker = new HealthChecker();