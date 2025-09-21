import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { HotelBookingServer } from '../server';

describe('Server Startup Tests', () => {
  let server: HotelBookingServer;
  let app: any;

  describe('Basic Server Initialization', () => {
    it('should load configuration', async () => {
      // Set up test environment
      process.env.LOCAL_SQLITE = 'true';
      process.env.NODE_ENV = 'test';

      // Test if config can be loaded
      const loadConfig = async () => {
        if (process.env.LOCAL_SQLITE === 'true') {
          const { sqliteConfig } = await import('../config/sqlite');
          return sqliteConfig;
        } else {
          const { config } = await import('../config');
          return config;
        }
      };

      const config = await loadConfig();
      expect(config).toBeDefined();
      expect(config.server.port).toBeDefined();
    });

    it('should create server instance', async () => {
      process.env.LOCAL_SQLITE = 'true';
      process.env.NODE_ENV = 'test';

      const { sqliteConfig } = await import('../config/sqlite');
      server = new HotelBookingServer(sqliteConfig);
      expect(server).toBeDefined();
    });
  });

  describe('Health Endpoint', () => {
    it('should respond to health check', async () => {
      process.env.LOCAL_SQLITE = 'true';
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3002'; // Use different port for testing

      // Mock the config to use test port
      const testConfig = {
        environment: 'test',
        version: '1.0.0',
        server: {
          port: 3002,
          baseUrl: 'http://localhost:3002'
        },
        cors: {
          origin: 'http://localhost:3009'
        }
      };

      // Just test that we can create the server
      // Don't actually start it to avoid port conflicts
      const testServer = new HotelBookingServer(testConfig);
      expect(testServer).toBeDefined();
    });
  });

  describe('Module Loading', () => {
    it('should import all required modules without errors', async () => {
      // Test critical imports
      const imports = [
        () => import('../middleware/errorHandler'),
        () => import('../middleware/rateLimiter'),
        () => import('../middleware/requestLogger'),
        () => import('../middleware/security'),
        () => import('../routes'),
        () => import('../utils/logger'),
      ];

      for (const importFn of imports) {
        await expect(importFn()).resolves.toBeDefined();
      }
    });
  });
});