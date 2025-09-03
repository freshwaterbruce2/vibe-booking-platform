import { Router, Request, Response } from 'express';
import { backupService } from '../services/backupService.js';
import { ipWhitelist } from '../middleware/security.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Apply IP whitelist to all backup endpoints (admin only)
router.use(ipWhitelist([
  process.env.ADMIN_IP_1 || '127.0.0.1',
  process.env.ADMIN_IP_2 || '::1',
  // Add production admin IPs here
]));

/**
 * Create manual backup
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { type, options } = req.body;
    
    logger.info('Manual backup requested', {
      type,
      options,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    let result;
    
    if (type === 'postgresql' || process.env.NODE_ENV === 'production') {
      result = await backupService.createPostgreSQLBackup(options);
    } else {
      result = await backupService.createSQLiteBackup();
    }

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        backup: {
          filePath: result.filePath,
          size: result.size,
          duration: result.duration,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup creation failed',
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error('Backup creation endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Test backup restoration
 */
router.post('/test-restore/:backupId', async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    const backupPath = `${process.env.BACKUP_DIR || './backups'}/${backupId}`;
    
    logger.info('Backup restoration test requested', {
      backupId,
      backupPath,
      ip: req.ip
    });

    const result = await backupService.testPostgreSQLRestore(backupPath);

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup restoration test passed',
        duration: result.duration
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup restoration test failed',
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error('Backup restoration test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get backup statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await backupService.getBackupStats();
    
    res.json({
      success: true,
      stats: {
        totalBackups: stats.totalBackups,
        totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
        averageSize: `${(stats.averageSize / 1024 / 1024).toFixed(2)} MB`,
        oldestBackup: stats.oldestBackup,
        newestBackup: stats.newestBackup,
        retentionPolicy: `${process.env.BACKUP_RETENTION_DAYS || '30'} days`,
        backupDirectory: process.env.BACKUP_DIR || './backups'
      }
    });
  } catch (error: any) {
    logger.error('Backup stats endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup statistics',
      error: error.message
    });
  }
});

/**
 * Cleanup old backups
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    logger.info('Manual backup cleanup requested', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const result = await backupService.cleanupOldBackups();

    res.json({
      success: true,
      message: `Cleanup completed: ${result.cleaned} files removed`,
      cleaned: result.cleaned,
      errors: result.errors
    });
  } catch (error: any) {
    logger.error('Backup cleanup endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Backup cleanup failed',
      error: error.message
    });
  }
});

/**
 * Health check for backup system
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await backupService.getBackupStats();
    const hasRecentBackup = stats.newestBackup !== null;
    
    // Check if we have a backup from the last 48 hours
    let isRecentBackupHealthy = false;
    if (stats.newestBackup) {
      // Extract timestamp from filename (format: backup_YYYY-MM-DD_HH-MM-SS)
      const match = stats.newestBackup.match(/backup_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
      if (match) {
        const [, date, time] = match;
        const backupTime = new Date(`${date}T${time.replace(/-/g, ':')}`);
        const hoursSinceBackup = (Date.now() - backupTime.getTime()) / (1000 * 60 * 60);
        isRecentBackupHealthy = hoursSinceBackup <= 48;
      }
    }

    const health = {
      status: hasRecentBackup && isRecentBackupHealthy ? 'healthy' : 'warning',
      hasBackups: hasRecentBackup,
      recentBackupHealthy: isRecentBackupHealthy,
      totalBackups: stats.totalBackups,
      newestBackup: stats.newestBackup,
      checks: {
        backupDirectory: process.env.BACKUP_DIR || './backups',
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
        intervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS || '24', 10)
      }
    };

    res.json({
      success: true,
      health
    });
  } catch (error: any) {
    logger.error('Backup health check error:', error);
    res.status(500).json({
      success: false,
      health: {
        status: 'error',
        error: error.message
      }
    });
  }
});

export default router;