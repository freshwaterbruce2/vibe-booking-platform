import { notificationScheduler } from '../services/notificationScheduler';
import { logger } from '../utils/logger';
import { RetryManager, databaseCircuitBreaker } from '../utils/resilience';
import { DatabaseOptimizer } from '../database/optimizations/indexOptimization';

/**
 * Email Scheduler Background Job
 *
 * Production-ready background job that processes scheduled emails
 * in batches to ensure reliable delivery without blocking the main application.
 *
 * Features:
 * - Batch processing for high-volume email delivery
 * - Error resilience with graceful failure handling
 * - Comprehensive logging for monitoring and debugging
 * - Configurable batch size and processing intervals
 * - Production-ready architecture for enterprise deployment
 */

interface JobConfig {
  intervalMinutes: number;
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
}

class EmailSchedulerJob {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: JobConfig;

  constructor(config: Partial<JobConfig> = {}) {
    this.config = {
      intervalMinutes: config.intervalMinutes || 5, // Process every 5 minutes
      batchSize: config.batchSize || 50, // Process 50 emails per batch
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 60000, // 1 minute retry delay
    };

    logger.info('Email Scheduler Job initialized', {
      config: this.config,
    });
  }

  /**
   * Start the background job
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('Email scheduler job is already running');
      return;
    }

    logger.info('Starting email scheduler background job', {
      interval: `${this.config.intervalMinutes} minutes`,
      batchSize: this.config.batchSize,
    });

    // Process immediately on startup
    this.processScheduledEmails().catch((error) => {
      logger.error('Initial email processing failed', { error });
    });

    // Set up recurring processing
    this.intervalId = setInterval(() => {
      this.processScheduledEmails().catch((error) => {
        logger.error('Scheduled email processing failed', { error });
      });
    }, this.config.intervalMinutes * 60 * 1000);

    logger.info('Email scheduler job started successfully');
  }

  /**
   * Stop the background job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Email scheduler job stopped');
    } else {
      logger.warn('Email scheduler job was not running');
    }
  }

  /**
   * Process scheduled emails with enhanced error handling and monitoring - OPTIMIZED
   */
  private async processScheduledEmails(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Email processing already in progress, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.debug('Starting optimized scheduled email processing batch');

      // OPTIMIZATION 1: Use circuit breaker for database operations
      const result = await databaseCircuitBreaker.execute(async () => {
        // OPTIMIZATION 2: Use retry logic for email processing
        return await RetryManager.executeWithRetry(
          async () => await notificationScheduler.processScheduledEmails(),
          {
            maxAttempts: 2, // Limited retries for background jobs
            baseDelayMs: 5000,
            maxDelayMs: 30000,
            backoffFactor: 2,
          },
          'email-batch-processing',
        );
      });

      const processingTime = Date.now() - startTime;
      const emailsPerSecond = result.processed > 0 ? (result.processed / (processingTime / 1000)).toFixed(2) : '0';

      logger.info('Scheduled email processing completed', {
        processed: result.processed,
        failed: result.failed,
        processingTimeMs: processingTime,
        emailsPerSecond,
        efficiency: this.calculateEfficiency(result.processed, result.failed, processingTime),
      });

      // OPTIMIZATION 3: Enhanced monitoring and alerting
      await this.performHealthChecks(result, processingTime);

      // OPTIMIZATION 4: Auto-cleanup old emails periodically (every hour)
      if (this.shouldPerformCleanup()) {
        this.performMaintenanceTasks().catch((error) => {
          logger.warn('Maintenance tasks failed', { error });
        });
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Email scheduler job encountered an error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processingTimeMs: processingTime,
        circuitBreakerState: databaseCircuitBreaker.getStatus(),
      });

      await this.handleProcessingError(error);

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Calculate processing efficiency metrics
   */
  private calculateEfficiency(processed: number, failed: number, timeMs: number): {
    successRate: number;
    throughput: number;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const total = processed + failed;
    const successRate = total > 0 ? (processed / total) * 100 : 100;
    const throughput = total > 0 ? (total / (timeMs / 1000)) : 0;

    let performance: 'excellent' | 'good' | 'fair' | 'poor';
    if (successRate >= 95 && throughput >= 10) {
performance = 'excellent';
} else if (successRate >= 85 && throughput >= 5) {
performance = 'good';
} else if (successRate >= 70 && throughput >= 2) {
performance = 'fair';
} else {
performance = 'poor';
}

    return { successRate: Number(successRate.toFixed(1)), throughput: Number(throughput.toFixed(2)), performance };
  }

  /**
   * Perform health checks and alerting
   */
  private async performHealthChecks(result: { processed: number; failed: number }, processingTime: number): Promise<void> {
    // Alert if failure rate is high
    if (result.failed > 0 && result.processed > 0) {
      const failureRate = (result.failed / (result.processed + result.failed)) * 100;
      if (failureRate > 10) {
        logger.warn('High email failure rate detected', {
          failureRate: `${failureRate.toFixed(1)}%`,
          failed: result.failed,
          processed: result.processed,
          recommendation: 'Check email service health and configuration',
        });
      }
    }

    // Alert if processing is too slow
    if (processingTime > 60000 && result.processed > 0) { // More than 1 minute
      logger.warn('Slow email processing detected', {
        processingTimeMs: processingTime,
        processed: result.processed,
        recommendation: 'Consider increasing concurrent processing or checking database performance',
      });
    }

    // Alert if no emails were processed (might indicate system issues)
    if (result.processed === 0 && result.failed === 0) {
      logger.debug('No scheduled emails ready for processing');
    }
  }

  /**
   * Check if maintenance tasks should be performed
   */
  private shouldPerformCleanup(): boolean {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Store last cleanup time in memory (in production, use Redis or database)
    if (!this.lastCleanupTime) {
this.lastCleanupTime = 0;
}

    return (now - this.lastCleanupTime) > oneHour;
  }

  private lastCleanupTime: number = 0;

  /**
   * Perform maintenance tasks like cleanup and optimization
   */
  private async performMaintenanceTasks(): Promise<void> {
    try {
      logger.info('Starting background maintenance tasks');

      // Cleanup old emails
      const cleanupResult = await DatabaseOptimizer.cleanupOldEmails();

      // Get performance metrics
      const metrics = await DatabaseOptimizer.getPerformanceMetrics();

      logger.info('Maintenance tasks completed', {
        emailsDeleted: cleanupResult.deletedCount,
        performanceMetrics: metrics,
      });

      this.lastCleanupTime = Date.now();

    } catch (error) {
      logger.error('Maintenance tasks failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle processing errors with retry logic
   */
  private async handleProcessingError(error: unknown): Promise<void> {
    logger.warn('Implementing error recovery for email processing', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Wait before allowing next processing cycle
    await new Promise((resolve) => setTimeout(resolve, this.config.retryDelayMs));

    // In production, you might want to:
    // - Send alerts to monitoring systems
    // - Implement exponential backoff
    // - Store failed processing attempts for analysis
  }

  /**
   * Get current job status for health monitoring
   */
  getStatus(): {
    isRunning: boolean;
    isProcessing: boolean;
    config: JobConfig;
    nextProcessing: string | null;
  } {
    const nextProcessing = this.intervalId
      ? new Date(Date.now() + (this.config.intervalMinutes * 60 * 1000)).toISOString()
      : null;

    return {
      isRunning: this.intervalId !== null,
      isProcessing: this.isRunning,
      config: this.config,
      nextProcessing,
    };
  }

  /**
   * Force immediate processing (useful for testing or manual triggers)
   */
  async processNow(): Promise<{ processed: number; failed: number }> {
    logger.info('Manual email processing triggered');

    try {
      return await notificationScheduler.processScheduledEmails();
    } catch (error) {
      logger.error('Manual email processing failed', { error });
      throw error;
    }
  }
}

// Export singleton instance for production use
export const emailSchedulerJob = new EmailSchedulerJob({
  intervalMinutes: process.env.EMAIL_SCHEDULER_INTERVAL_MINUTES
    ? parseInt(process.env.EMAIL_SCHEDULER_INTERVAL_MINUTES)
    : 5,
  batchSize: process.env.EMAIL_SCHEDULER_BATCH_SIZE
    ? parseInt(process.env.EMAIL_SCHEDULER_BATCH_SIZE)
    : 50,
  maxRetries: process.env.EMAIL_SCHEDULER_MAX_RETRIES
    ? parseInt(process.env.EMAIL_SCHEDULER_MAX_RETRIES)
    : 3,
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down email scheduler gracefully');
  emailSchedulerJob.stop();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down email scheduler gracefully');
  emailSchedulerJob.stop();
});

export { EmailSchedulerJob };