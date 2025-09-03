import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, access, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

interface BackupResult {
  success: boolean;
  filePath?: string;
  error?: string;
  size?: number;
  duration?: number;
}

interface BackupOptions {
  includeData?: boolean;
  compress?: boolean;
  customTables?: string[];
  retentionDays?: number;
}

class BackupService {
  private backupDir: string;
  private maxRetentionDays: number;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
    this.maxRetentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await access(this.backupDir);
    } catch (error) {
      try {
        await mkdir(this.backupDir, { recursive: true });
        logger.info(`Created backup directory: ${this.backupDir}`);
      } catch (createError) {
        logger.error('Failed to create backup directory:', createError);
      }
    }
  }

  /**
   * Create a full PostgreSQL database backup
   */
  async createPostgreSQLBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = `${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]  }_${
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]}`;

    const fileName = options.compress
      ? `hotelbooking_backup_${timestamp}.sql.gz`
      : `hotelbooking_backup_${timestamp}.sql`;

    const backupPath = join(this.backupDir, fileName);

    try {
      // Build pg_dump command
      const command = this.buildPgDumpCommand(backupPath, options);

      logger.info('Starting PostgreSQL backup', {
        fileName,
        options,
        command: command.replace(/PGPASSWORD=\S+/g, 'PGPASSWORD=***'),
      });

      // Execute backup
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
        timeout: 30 * 60 * 1000, // 30 minutes timeout
      });

      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(stderr);
      }

      // Get file size
      const stats = await stat(backupPath);
      const duration = Date.now() - startTime;

      logger.info('PostgreSQL backup completed successfully', {
        fileName,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${(duration / 1000).toFixed(2)}s`,
      });

      return {
        success: true,
        filePath: backupPath,
        size: stats.size,
        duration,
      };
    } catch (error: any) {
      logger.error('PostgreSQL backup failed:', {
        error: error.message,
        fileName,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Create a SQLite database backup (for local development)
   */
  async createSQLiteBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = `${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]  }_${
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]}`;

    const fileName = `hotelbooking_sqlite_backup_${timestamp}.db`;
    const backupPath = join(this.backupDir, fileName);
    const sourcePath = process.env.SQLITE_DB_PATH || join(process.cwd(), 'database.db');

    try {
      // Use SQLite backup command
      const command = `sqlite3 "${sourcePath}" ".backup '${backupPath}'"`;

      logger.info('Starting SQLite backup', {
        fileName,
        sourcePath,
        backupPath,
      });

      await execAsync(command);

      // Get file size
      const stats = await stat(backupPath);
      const duration = Date.now() - startTime;

      logger.info('SQLite backup completed successfully', {
        fileName,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        duration: `${(duration / 1000).toFixed(2)}s`,
      });

      return {
        success: true,
        filePath: backupPath,
        size: stats.size,
        duration,
      };
    } catch (error: any) {
      logger.error('SQLite backup failed:', {
        error: error.message,
        fileName,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Test backup restoration (PostgreSQL)
   */
  async testPostgreSQLRestore(backupPath: string): Promise<BackupResult> {
    const startTime = Date.now();
    const testDbName = `hotelbooking_test_restore_${Date.now()}`;

    try {
      logger.info('Testing backup restoration', { backupPath, testDbName });

      // Create test database
      const createDbCommand = this.buildCreateDbCommand(testDbName);
      await execAsync(createDbCommand);

      // Restore backup to test database
      const restoreCommand = this.buildRestoreCommand(backupPath, testDbName);
      await execAsync(restoreCommand);

      // Verify restoration by checking table count
      const verifyCommand = this.buildVerifyCommand(testDbName);
      const { stdout } = await execAsync(verifyCommand);

      const tableCount = parseInt(stdout.trim(), 10);
      if (tableCount < 5) { // Expect at least 5 tables
        throw new Error(`Restoration verification failed: only ${tableCount} tables found`);
      }

      // Clean up test database
      const dropDbCommand = this.buildDropDbCommand(testDbName);
      await execAsync(dropDbCommand);

      const duration = Date.now() - startTime;

      logger.info('Backup restoration test passed', {
        backupPath,
        tableCount,
        duration: `${(duration / 1000).toFixed(2)}s`,
      });

      return {
        success: true,
        duration,
      };
    } catch (error: any) {
      logger.error('Backup restoration test failed:', {
        error: error.message,
        backupPath,
        duration: Date.now() - startTime,
      });

      // Attempt cleanup
      try {
        const dropDbCommand = this.buildDropDbCommand(testDbName);
        await execAsync(dropDbCommand);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup test database:', cleanupError);
      }

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<{ cleaned: number; errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      const files = await readdir(this.backupDir);
      const now = Date.now();
      const maxAge = this.maxRetentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.includes('backup_')) {
continue;
}

        try {
          const filePath = join(this.backupDir, file);
          const stats = await stat(filePath);
          const age = now - stats.mtime.getTime();

          if (age > maxAge) {
            await unlink(filePath);
            cleaned++;
            logger.info(`Deleted old backup: ${file}`);
          }
        } catch (error: any) {
          errors.push(`Failed to process ${file}: ${error.message}`);
        }
      }

      logger.info(`Backup cleanup completed: ${cleaned} files removed`);
    } catch (error: any) {
      errors.push(`Failed to read backup directory: ${error.message}`);
    }

    return { cleaned, errors };
  }

  /**
   * Schedule automated backups
   */
  async scheduleAutomatedBackups(): Promise<void> {
    const backupInterval = parseInt(process.env.BACKUP_INTERVAL_HOURS || '24', 10);

    logger.info(`Scheduling automated backups every ${backupInterval} hours`);

    const runBackup = async () => {
      try {
        // Determine backup type based on environment
        const isProduction = config.environment === 'production';
        const result = isProduction
          ? await this.createPostgreSQLBackup({ compress: true, includeData: true })
          : await this.createSQLiteBackup();

        if (result.success) {
          // Test restoration every 7 days
          const shouldTestRestore = Math.random() < 0.14; // ~daily chance for weekly test
          if (shouldTestRestore && result.filePath && isProduction) {
            await this.testPostgreSQLRestore(result.filePath);
          }

          // Cleanup old backups
          await this.cleanupOldBackups();
        }
      } catch (error) {
        logger.error('Automated backup failed:', error);
      }
    };

    // Run initial backup
    await runBackup();

    // Schedule recurring backups
    setInterval(runBackup, backupInterval * 60 * 60 * 1000);
  }

  private buildPgDumpCommand(backupPath: string, options: BackupOptions): string {
    const db = config.database;
    let command = `PGPASSWORD="${db.password}" pg_dump`;

    // Connection parameters
    command += ` -h ${db.host} -p ${db.port} -U ${db.user}`;

    // Backup options
    if (options.includeData !== false) {
      command += ' --data-only';
    }

    if (options.customTables && options.customTables.length > 0) {
      options.customTables.forEach((table) => {
        command += ` -t ${table}`;
      });
    }

    // Output options
    if (options.compress) {
      command += ' --compress=9 --format=custom';
    } else {
      command += ' --format=plain --no-owner --no-privileges';
    }

    command += ` ${db.name}`;

    if (options.compress) {
      command += ` > "${backupPath}"`;
    } else {
      command += ` > "${backupPath}"`;
    }

    return command;
  }

  private buildCreateDbCommand(dbName: string): string {
    const db = config.database;
    return `PGPASSWORD="${db.password}" createdb -h ${db.host} -p ${db.port} -U ${db.user} ${dbName}`;
  }

  private buildRestoreCommand(backupPath: string, dbName: string): string {
    const db = config.database;
    const isCompressed = backupPath.endsWith('.gz') || backupPath.includes('custom');

    if (isCompressed) {
      return `PGPASSWORD="${db.password}" pg_restore -h ${db.host} -p ${db.port} -U ${db.user} -d ${dbName} "${backupPath}"`;
    } else {
      return `PGPASSWORD="${db.password}" psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${dbName} < "${backupPath}"`;
    }
  }

  private buildVerifyCommand(dbName: string): string {
    const db = config.database;
    return `PGPASSWORD="${db.password}" psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${dbName} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_type = 'BASE TABLE';"`;
  }

  private buildDropDbCommand(dbName: string): string {
    const db = config.database;
    return `PGPASSWORD="${db.password}" dropdb -h ${db.host} -p ${db.port} -U ${db.user} ${dbName}`;
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: string | null;
    newestBackup: string | null;
    averageSize: number;
  }> {
    try {
      const files = await readdir(this.backupDir);
      const backupFiles = files.filter((file) => file.includes('backup_'));

      if (backupFiles.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
          oldestBackup: null,
          newestBackup: null,
          averageSize: 0,
        };
      }

      let totalSize = 0;
      let oldestTime = Infinity;
      let newestTime = 0;
      let oldestBackup = '';
      let newestBackup = '';

      for (const file of backupFiles) {
        const filePath = join(this.backupDir, file);
        const stats = await stat(filePath);
        totalSize += stats.size;

        if (stats.mtime.getTime() < oldestTime) {
          oldestTime = stats.mtime.getTime();
          oldestBackup = file;
        }

        if (stats.mtime.getTime() > newestTime) {
          newestTime = stats.mtime.getTime();
          newestBackup = file;
        }
      }

      return {
        totalBackups: backupFiles.length,
        totalSize,
        oldestBackup,
        newestBackup,
        averageSize: totalSize / backupFiles.length,
      };
    } catch (error) {
      logger.error('Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
        averageSize: 0,
      };
    }
  }
}

export const backupService = new BackupService();
export default backupService;