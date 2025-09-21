import express from 'express';
import cors from 'cors';
import { sqliteConfig } from './config/sqlite';

export function createSimpleServer() {
  const app = express();

  // Basic middleware
  app.use(cors({
    origin: sqliteConfig.cors.origin,
    credentials: true
  }));
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: sqliteConfig.environment,
      version: sqliteConfig.version,
      database: 'SQLite',
      port: sqliteConfig.server.port
    });
  });

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: 'ready'
    });
  });

  return app;
}

// Start server if this file is run directly
if (require.main === module) {
  const app = createSimpleServer();
  const port = sqliteConfig.server.port;

  app.listen(port, () => {
    console.log(`✅ Simple server running on port ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
    console.log(`🔗 API health: http://localhost:${port}/api/health`);
  });
}