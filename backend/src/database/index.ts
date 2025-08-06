import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { config } from '../config';
import { logger } from '../utils/logger';
import * as schema from './schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

export async function initializeDatabase(): Promise<void> {
  try {
    // Create connection pool
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: config.database.poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    await pool.query('SELECT NOW()');
    logger.info('Database connection established');

    // Initialize Drizzle ORM
    db = drizzle(pool, { schema });

    // Run migrations in production
    if (config.environment === 'production') {
      await migrate(db, { migrationsFolder: './migrations' });
      logger.info('Database migrations completed');
    }

  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
}

// Export schema for use in other modules
export { schema };