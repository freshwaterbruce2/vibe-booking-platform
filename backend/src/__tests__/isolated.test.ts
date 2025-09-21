import { describe, it, expect, beforeAll } from 'vitest';

describe('Isolated Backend Test', () => {
  beforeAll(() => {
    // Set environment variables for this test
    process.env.NODE_ENV = 'test';
    process.env.LOCAL_SQLITE = 'true';
  });

  it('should pass basic math test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have correct environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.LOCAL_SQLITE).toBe('true');
  });

  it('should be able to import basic Node.js modules', async () => {
    const path = await import('path');
    expect(path.join('a', 'b')).toBe(path.normalize('a/b'));
  });
});