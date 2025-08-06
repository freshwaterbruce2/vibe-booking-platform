import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { apiRouter } from './routes';
import { initializeDatabase } from './database/migrations';
import { initializeCache } from './cache';
import { initializeWebSocket } from './websocket';
import { logger } from './utils/logger';

export class HotelBookingServer {
  private app: Express;
  private httpServer: ReturnType<typeof createServer>;
  private io: SocketIOServer;
  private port: number;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
    });
    this.port = config.server.port;
  }

  private async initializeMiddleware(): Promise<void> {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.environment !== 'test') {
      this.app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
      }));
    }

    // Custom middleware
    this.app.use(requestLogger);
    this.app.use(rateLimiter);

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.environment,
        version: config.version,
      });
    });

    // API routes
    this.app.use('/api', apiRouter);

    // Error handling
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();
      logger.info('Database initialized successfully');

      // Initialize cache
      await initializeCache();
      logger.info('Cache initialized successfully');

      // Initialize WebSocket
      initializeWebSocket(this.io);
      logger.info('WebSocket initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initializeMiddleware();
      await this.initializeServices();

      this.httpServer.listen(this.port, () => {
        logger.info(`Hotel Booking API server running on port ${this.port}`);
        logger.info(`Environment: ${config.environment}`);
        logger.info(`API Base URL: ${config.server.baseUrl}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down server...');

    this.httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    // Close database connections
    // Close cache connections
    // Close other resources

    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new HotelBookingServer();
  server.start();
}