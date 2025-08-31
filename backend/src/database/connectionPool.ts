import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import * as schema from './schema/index.js';

interface ConnectionPoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  statementTimeout: number;
}

interface DatabaseMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  queriesExecuted: number;
  averageQueryTime: number;
  lastHealthCheck: Date;
  errors: number;
}

class DatabaseConnectionManager {
  private postgresConnection: postgres.Sql | null = null;
  private sqliteConnection: Database.Database | null = null;
  private drizzleDb: any = null;
  private isPostgreSQL: boolean;
  private metrics: DatabaseMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.isPostgreSQL = !process.env.LOCAL_SQLITE || process.env.LOCAL_SQLITE !== 'true';
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): DatabaseMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      queriesExecuted: 0,
      averageQueryTime: 0,
      lastHealthCheck: new Date(),
      errors: 0
    };
  }

  /**
   * Initialize database connection with optimal pool settings
   */
  async initialize(): Promise<void> {
    try {
      if (this.isPostgreSQL) {
        await this.initializePostgreSQL();
      } else {
        await this.initializeSQLite();
      }

      // Start health monitoring
      this.startHealthMonitoring();
      
      logger.info('Database connection initialized successfully', {
        type: this.isPostgreSQL ? 'PostgreSQL' : 'SQLite',
        poolConfig: this.isPostgreSQL ? this.getPoolConfig() : 'N/A'
      });
    } catch (error) {
      logger.error('Database connection initialization failed:', error);
      throw error;
    }
  }

  private async initializePostgreSQL(): Promise<void> {
    const poolConfig = this.getPoolConfig();
    
    // Build connection string with SSL options
    const connectionOptions: postgres.Options<{}> = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.user,
      password: config.database.password,
      max: poolConfig.max,
      idle_timeout: poolConfig.idleTimeoutMillis,
      connect_timeout: poolConfig.connectionTimeoutMillis,
      prepare: true, // Use prepared statements for better performance
      transform: postgres.camel, // Convert snake_case to camelCase
      ssl: config.database.ssl ? {
        rejectUnauthorized: config.environment === 'production',
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY,
      } : false,
      onnotice: this.handlePostgresNotice.bind(this),
      onnotify: this.handlePostgresNotify.bind(this),
      debug: config.environment === 'development',
    };

    this.postgresConnection = postgres(connectionOptions);
    this.drizzleDb = drizzle(this.postgresConnection, { schema });
    
    // Test connection
    await this.testPostgreSQLConnection();
  }

  private async initializeSQLite(): Promise<void> {
    const dbPath = process.env.SQLITE_DB_PATH || './database.db';
    
    this.sqliteConnection = new Database(dbPath, {
      verbose: config.environment === 'development' ? logger.debug.bind(logger) : undefined
    });

    // Enable WAL mode for better concurrency
    this.sqliteConnection.exec('PRAGMA journal_mode = WAL;');
    this.sqliteConnection.exec('PRAGMA synchronous = NORMAL;');
    this.sqliteConnection.exec('PRAGMA cache_size = 1000000;'); // 1GB cache
    this.sqliteConnection.exec('PRAGMA foreign_keys = ON;');
    this.sqliteConnection.exec('PRAGMA temp_store = MEMORY;');

    this.drizzleDb = drizzleSqlite(this.sqliteConnection, { schema });
    
    logger.info('SQLite connection initialized', {
      path: dbPath,
      mode: 'WAL',
      cacheSize: '1GB'
    });
  }

  private getPoolConfig(): ConnectionPoolConfig {
    return {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '5000', 10),
      statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
    };
  }

  private async testPostgreSQLConnection(): Promise<void> {
    if (!this.postgresConnection) throw new Error('PostgreSQL connection not initialized');

    try {
      const result = await this.postgresConnection`SELECT 1 as test, NOW() as timestamp`;
      logger.info('PostgreSQL connection test successful', {
        result: result[0],
        ssl: config.database.ssl ? 'enabled' : 'disabled'
      });
    } catch (error) {
      logger.error('PostgreSQL connection test failed:', error);
      throw error;
    }
  }

  /**
   * Get the Drizzle database instance
   */
  getDatabase() {
    if (!this.drizzleDb) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.drizzleDb;
  }

  /**
   * Execute a query with metrics tracking
   */
  async executeQuery<T>(queryFn: (db: any) => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn(this.drizzleDb);
      
      // Update metrics
      this.metrics.queriesExecuted++;
      const queryTime = Date.now() - startTime;
      this.metrics.averageQueryTime = 
        (this.metrics.averageQueryTime * (this.metrics.queriesExecuted - 1) + queryTime) / this.metrics.queriesExecuted;
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Database query failed:', {
        error: error instanceof Error ? error.message : error,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Start transaction with proper isolation level
   */
  async transaction<T>(
    callback: (tx: any) => Promise<T>,
    isolationLevel: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable' = 'read committed'
  ): Promise<T> {
    if (this.isPostgreSQL && this.postgresConnection) {
      return await this.postgresConnection.begin(isolationLevel, callback);
    } else if (this.sqliteConnection) {
      // SQLite transactions
      return await this.drizzleDb.transaction(callback);
    } else {
      throw new Error('No database connection available');
    }
  }

  /**
   * Get current connection metrics
   */
  getMetrics(): DatabaseMetrics {
    if (this.isPostgreSQL && this.postgresConnection) {
      // Update PostgreSQL metrics
      const options = this.postgresConnection.options;
      this.metrics.totalConnections = options.max || 0;
      // Note: postgres.js doesn't expose detailed pool metrics
      // For production, consider using a monitoring tool
    }
    
    this.metrics.lastHealthCheck = new Date();
    return { ...this.metrics };
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const startTime = Date.now();
      
      if (this.isPostgreSQL && this.postgresConnection) {
        await this.postgresConnection`SELECT 1`;
      } else if (this.sqliteConnection) {
        this.sqliteConnection.prepare('SELECT 1').get();
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: true,
        details: {
          type: this.isPostgreSQL ? 'PostgreSQL' : 'SQLite',
          responseTime: `${responseTime}ms`,
          metrics: this.getMetrics(),
          ssl: this.isPostgreSQL ? (config.database.ssl ? 'enabled' : 'disabled') : 'N/A'
        }
      };
    } catch (error) {
      this.metrics.errors++;
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : error,
          lastError: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Close database connections gracefully
   */
  async close(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      if (this.isPostgreSQL && this.postgresConnection) {
        await this.postgresConnection.end();
        logger.info('PostgreSQL connection closed');
      } else if (this.sqliteConnection) {
        this.sqliteConnection.close();
        logger.info('SQLite connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }

  private startHealthMonitoring(): void {
    const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000', 10);
    
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.healthCheck();
      if (!health.healthy) {
        logger.warn('Database health check failed:', health.details);
      }
    }, interval);
  }

  private handlePostgresNotice(notice: any): void {
    logger.debug('PostgreSQL notice:', notice);
  }

  private handlePostgresNotify(channel: string, payload: string): void {
    logger.debug('PostgreSQL notification:', { channel, payload });
  }

  /**
   * Get connection pool statistics for monitoring
   */
  async getPoolStats(): Promise<any> {
    if (!this.isPostgreSQL) {
      return { type: 'SQLite', note: 'Pool statistics not applicable' };
    }

    return {
      type: 'PostgreSQL',
      config: this.getPoolConfig(),
      metrics: this.getMetrics(),
      ssl: config.database.ssl ? 'enabled' : 'disabled',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name
    };
  }
}

// Export singleton instance
export const dbConnectionManager = new DatabaseConnectionManager();

// Export database instance getter
export const getDb = () => dbConnectionManager.getDatabase();

// Initialize connection on module load
if (process.env.NODE_ENV !== 'test') {
  dbConnectionManager.initialize().catch((error) => {
    logger.error('Failed to initialize database connection:', error);
    process.exit(1);
  });
}

export default dbConnectionManager;