import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Server Configuration', () => {
  describe('Health Check Endpoint', () => {
    it('should return health status on GET /health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        version: '2.0.0'
      });
    });

    it('should include valid timestamp in ISO format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should include positive uptime', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('Basic API Test Endpoint', () => {
    it('should return success message on GET /api/test', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Vibe Booking Backend is working!',
        timestamp: expect.any(String),
        version: '2.0.0'
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not found',
        path: '/non-existent-route'
      });
    });

    it('should return 404 for non-existent API routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not found',
        path: '/api/non-existent'
      });
    });
  });

  describe('Security Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      // CORS headers should be present when origin is set
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include security headers from Helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Content Type Handling', () => {
    it('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/api/test-json')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Should not crash even if endpoint doesn't exist
      expect([200, 404]).toContain(response.status);
    });

    it('should handle URL encoded requests', async () => {
      const response = await request(app)
        .post('/api/test-form')
        .send('test=data')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      // Should not crash even if endpoint doesn't exist
      expect([200, 404]).toContain(response.status);
    });
  });
});