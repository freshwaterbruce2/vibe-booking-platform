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

  // Email collection endpoint for immediate monetization
  app.post('/api/waitlist', (req, res) => {
    try {
      const { email, destination, source = 'website' } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Log email for immediate collection (production would use database)
      console.log(`📧 NEW WAITLIST SIGNUP: ${email} | Destination: ${destination || 'Not specified'} | Source: ${source}`);

      // Immediate response with discount code
      const discountCode = `EARLY${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      res.json({
        success: true,
        message: 'Welcome to VIBE Hotels! Your early access discount is ready.',
        discountCode,
        discountPercent: 20,
        expiresIn: '30 days',
        email,
        waitlistPosition: Math.floor(Math.random() * 50) + 1 // Simulate position
      });

    } catch (error) {
      console.error('Waitlist signup error:', error);
      res.status(500).json({ error: 'Failed to join waitlist' });
    }
  });

  // Lead tracking endpoint
  app.post('/api/leads/track', (req, res) => {
    try {
      const { action, email, data } = req.body;
      console.log(`📊 LEAD ACTION: ${action} | Email: ${email} | Data:`, data);
      res.json({ success: true, tracked: action });
    } catch (error) {
      res.status(500).json({ error: 'Tracking failed' });
    }
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