import { beforeEach, afterEach } from 'vitest';

// Setup and teardown for tests
beforeEach(() => {
  // Reset environment variables for each test
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Clean up after each test
});