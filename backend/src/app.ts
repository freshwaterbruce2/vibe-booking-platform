import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { securityMiddleware } from './middleware/security';
import { apiRouter } from './routes';
import { logger } from './utils/logger';

// Create Express app for testing and server usage
export const createApp = async (): Promise<Express> => {
  const app = express();

  // Load config conditionally
  const loadConfig = async () => {
    if (process.env.LOCAL_SQLITE === 'true' || process.env.NODE_ENV === 'test') {
      const { sqliteConfig } = await import('./config/sqlite');
      return sqliteConfig;
    } else {
      const { config } = await import('./config');
      return config;
    }
  };

  const config = await loadConfig();

  // Apply security middleware
  app.use(securityMiddleware);

  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
return callback(null, true);
}

      // Allow localhost origins for development and testing
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Check against configured origins
      const allowedOrigins = Array.isArray(config.cors.origin)
        ? config.cors.origin
        : [config.cors.origin];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log rejected origin for debugging (skip in test environment)
      if (process.env.NODE_ENV !== 'test') {
        logger.warn(`CORS: Rejected origin ${origin}`);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  }));

  // Content-type headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.path.startsWith('/api')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    next();
  });

  // Raw body capture for Square webhooks BEFORE json parsing
  app.use('/api/payments/webhook/square', express.raw({ type: '*/*', limit: '1mb' }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Logging (skip in test environment)
  if (config.environment !== 'test' && process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    }));
  }

  // Custom middleware
  app.use(requestLogger);
  app.use(rateLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.environment,
      version: config.version,
    });
  });

  // API routes
  app.use('/api', apiRouter);

  // Error handling
  app.use(errorHandler);

  return app;
};

// Export the app instance for testing
export const app = await createApp();