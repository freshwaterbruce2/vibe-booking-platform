const request = require('supertest');
const validator = require('validator');

// Mock external dependencies
jest.mock('liteapi-node-sdk', () => jest.fn(() => global.mockLiteApi));
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => global.mockOpenAI),
}));

describe('Hotel Booking Security Tests', () => {
  let app;
  
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.OPEN_API_KEY = 'test-key';
    process.env.SAND_API_KEY = 'test-key';
    process.env.PROD_API_KEY = 'test-key';
    
    app = require('../server/server.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    global.mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  searchParams: {
                    city: 'Paris',
                    countryCode: 'FR',
                    checkin: '2025-08-05',
                    checkout: '2025-08-06',
                    adults: 2,
                  },
                  funnyResponse: 'Secure test response',
                }),
              },
            }],
          }),
        },
      },
    };
    
    global.mockLiteApi = {
      getHotels: jest.fn().mockResolvedValue({ data: [] }),
      getFullRates: jest.fn().mockResolvedValue({ data: [] }),
      getHotelDetails: jest.fn().mockResolvedValue({ data: {} }),
      preBook: jest.fn().mockResolvedValue({ prebookId: 'test', status: 'success' }),
      book: jest.fn().mockResolvedValue({ data: { bookingId: 'test' } })
    };
  });

  describe('Input Validation and Sanitization', () => {
    test('should reject queries that are too long', async () => {
      const longQuery = 'a'.repeat(501); // Exceeds 500 character limit
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: longQuery, environment: 'sandbox' })
        .expect(400);
        
      expect(response.body.error).toContain('too long');
    });
    
    test('should handle XSS attempts in search queries', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '\"\'>\"<script>alert(String.fromCharCode(88,83,83))</script>',
        '<svg onload=alert("xss")>'
      ];
      
      for (const payload of xssPayloads) {
        const response = await request(app)
          .get('/api/search-hotels')
          .query({ q: payload, environment: 'sandbox' });
          
        // Should either reject malicious input or sanitize it
        if (response.status === 200) {
          // If accepted, ensure the response doesn't contain the raw payload
          expect(JSON.stringify(response.body)).not.toContain('<script>');
          expect(JSON.stringify(response.body)).not.toContain('javascript:');
        } else {
          // Or it should be rejected with appropriate error
          expect(response.status).toBeGreaterThanOrEqual(400);
        }
      }
    });
    
    test('should validate email format strictly in booking', async () => {
      const invalidEmails = [
        'not-an-email',
        '@domain.com',
        'email@',
        'email..email@domain.com',
        'email@domain',
        '<script>alert("xss")</script>@domain.com',
        'email@domain.com<script>alert("xss")</script>'
      ];
      
      for (const email of invalidEmails) {
        const response = await request(app)
          .get('/book')
          .query({
            prebookId: 'test',
            guestFirstName: 'John',
            guestLastName: 'Doe',
            guestEmail: email,
            transactionId: 'test',
            environment: 'sandbox'
          })
          .expect(400);
          
        expect(response.text).toContain('Invalid email address format');
      }
    });
    
    test('should validate date formats and prevent date manipulation', async () => {
      const invalidDates = [
        '1900-01-01', // Too far in past
        '2100-01-01', // Too far in future
        'invalid-date',
        '2025-13-01', // Invalid month
        '2025-01-32', // Invalid day
        '2025/01/01', // Wrong format
        "'; DROP TABLE hotels; --" // SQL injection attempt
      ];
      
      for (const date of invalidDates) {
        const response = await request(app)
          .get('/search-rates')
          .query({
            hotelId: 'hotel1',
            checkin: date,
            checkout: '2025-08-06',
            adults: 2,
            environment: 'sandbox'
          });
          
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
    
    test('should prevent SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE hotels; --",
        '1\' OR \'1\'=\'1',
        'UNION SELECT * FROM users',
        '1; DELETE FROM bookings; --',
        "admin'/*",
        "' UNION SELECT null, version(); --"
      ];
      
      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .get('/api/search-hotels')
          .query({ q: payload, environment: 'sandbox' });
          
        // Should either reject or safely handle the input
        if (response.status === 200) {
          // If processed, should not contain SQL keywords in response
          const responseText = JSON.stringify(response.body).toLowerCase();
          expect(responseText).not.toContain('drop table');
          expect(responseText).not.toContain('delete from');
          expect(responseText).not.toContain('union select');
        }
      }
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should enforce search API rate limiting', async () => {
      const requests = [];
      const rateLimit = 31; // Exceeds the 30 requests per minute limit
      
      // Make requests rapidly
      for (let i = 0; i < rateLimit; i++) {
        requests.push(
          request(app)
            .get('/api/search-hotels')
            .query({ q: `rate limit test ${i}`, environment: 'sandbox' })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      expect(rateLimitedResponses[0].body.error).toContain('Too many');
      expect(rateLimitedResponses[0].body.retryAfter).toBeDefined();
    }, 10000);
    
    test('should enforce general API rate limiting', async () => {
      const requests = [];
      const rateLimit = 101; // Exceeds the 100 requests per 15 minutes limit
      
      // Mix different endpoints to test general rate limiting
      for (let i = 0; i < rateLimit; i++) {
        const endpoint = i % 3 === 0 ? '/api/health' : 
                        i % 3 === 1 ? '/api/analytics' : '/api/search-suggestions';
        const query = endpoint === '/api/search-suggestions' ? { query: `test${i}` } : {};
        
        requests.push(
          request(app)
            .get(endpoint)
            .query(query)
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Authentication and Authorization', () => {
    test('should handle missing API keys securely', async () => {
      // Temporarily remove API keys
      const originalSandKey = process.env.SAND_API_KEY;
      const originalProdKey = process.env.PROD_API_KEY;
      
      delete process.env.SAND_API_KEY;
      delete process.env.PROD_API_KEY;
      
      // Restart app to pick up missing keys
      delete require.cache[require.resolve('../server/server.js')];
      const appWithoutKeys = require('../server/server.js');
      
      const response = await request(appWithoutKeys)
        .get('/api/search-hotels')
        .query({ q: 'test query', environment: 'sandbox' })
        .expect(500);
        
      expect(response.body.error).toContain('configuration error');
      expect(response.body.code).toBe('API_KEY_MISSING');
      
      // Restore API keys
      process.env.SAND_API_KEY = originalSandKey;
      process.env.PROD_API_KEY = originalProdKey;
    });
    
    test('should not expose API keys in error messages', async () => {
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: 'test', environment: 'invalid' })
        .expect(400);
        
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain(process.env.SAND_API_KEY);
      expect(responseText).not.toContain(process.env.PROD_API_KEY);
      expect(responseText).not.toContain(process.env.OPEN_API_KEY);
    });
  });

  describe('Security Headers', () => {
    test('should include proper security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
        
      // Check for security headers set by Helmet
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });
    
    test('should have proper Content Security Policy', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
        
      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
      expect(csp).toContain('img-src');
    });
  });

  describe('Data Sanitization and Escaping', () => {
    test('should sanitize guest information in booking', async () => {
      const maliciousInput = {
        prebookId: 'test<script>alert(1)</script>',
        guestFirstName: 'John<img src=x onerror=alert(1)>',
        guestLastName: 'Doe\"<script>alert(1)</script>',
        guestEmail: 'test@example.com',
        transactionId: 'trans<script>alert(1)</script>',
        environment: 'sandbox'
      };
      
      const response = await request(app)
        .get('/book')
        .query(maliciousInput);
        
      // Should either reject malicious input or properly escape it
      if (response.status === 200) {
        expect(response.text).not.toContain('<script>');
        expect(response.text).not.toContain('onerror=');
        expect(response.text).not.toContain('javascript:');
      }
    });
    
    test('should prevent parameter pollution', async () => {
      const response = await request(app)
        .get('/api/search-hotels')
        .query({
          q: ['query1', 'query2'], // Array parameter pollution
          environment: ['sandbox', 'production'], // Should use only one
        });
        
      // Should handle parameter pollution gracefully
      expect(response.status).not.toBe(500); // Should not crash
    });
  });

  describe('Error Information Disclosure', () => {
    test('should not expose sensitive information in error messages', async () => {
      // Cause an internal error
      global.mockLiteApi.getHotels.mockRejectedValue(
        new Error('Database connection failed: user=admin password=secret123 host=internal.db.com')
      );
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: 'test', environment: 'sandbox' })
        .expect(500);
        
      const responseText = JSON.stringify(response.body).toLowerCase();
      
      // Should not expose sensitive information
      expect(responseText).not.toContain('password');
      expect(responseText).not.toContain('secret');
      expect(responseText).not.toContain('admin');
      expect(responseText).not.toContain('internal.db.com');
      expect(responseText).not.toContain('stack trace');
    });
    
    test('should provide generic error messages for authentication failures', async () => {
      global.mockLiteApi.getHotels.mockRejectedValue(
        new Error('Authentication failed: Invalid API key xyz123')
      );
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: 'test', environment: 'sandbox' })
        .expect(500);
        
      expect(response.body.error).not.toContain('xyz123');
      expect(response.body.error).not.toContain('Authentication failed');
      expect(response.body.error).toContain('fetching hotel data');
    });
  });

  describe('Cross-Site Request Forgery (CSRF)', () => {
    test('should handle POST requests with proper validation', async () => {
      const response = await request(app)
        .post('/prebook')
        .set('Origin', 'http://malicious-site.com') // Different origin
        .send({
          rateId: 'test',
          environment: 'sandbox'
        });
        
      // Should either reject cross-origin requests or handle them securely
      if (response.status === 200) {
        // If CORS allows it, ensure proper validation is still performed
        expect(response.body).toHaveProperty('success');
      }
    });
  });

  describe('Denial of Service Protection', () => {
    test('should handle large payload attempts', async () => {
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB payload
      
      const response = await request(app)
        .post('/prebook')
        .send({
          rateId: largePayload,
          environment: 'sandbox'
        });
        
      // Should reject large payloads
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
    
    test('should handle excessive query parameters', async () => {
      const query = {};
      
      // Create query with many parameters
      for (let i = 0; i < 1000; i++) {
        query[`param${i}`] = `value${i}`;
      }
      query.q = 'test';
      query.environment = 'sandbox';
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query(query);
        
      // Should handle gracefully without crashing
      expect(response.status).not.toBe(500);
    });
  });

  describe('Session and State Management', () => {
    test('should not maintain sensitive state between requests', async () => {
      // Make a request with sensitive data
      await request(app)
        .get('/api/search-hotels')
        .query({ q: 'sensitive search', environment: 'sandbox' });
        
      // Make another request and ensure no state leakage
      const response = await request(app)
        .get('/api/health')
        .expect(200);
        
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('sensitive search');
    });
  });

  describe('Logging Security', () => {
    test('should not log sensitive information', async () => {
      // This test would need to check actual log files in a real scenario
      // For now, we ensure the response doesn't echo back sensitive info
      const sensitiveQuery = 'hotels with credit card 4111-1111-1111-1111';
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: sensitiveQuery, environment: 'sandbox' });
        
      // Response should not contain credit card numbers
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toMatch(/\d{4}-\d{4}-\d{4}-\d{4}/);
    });
  });
});

// Additional security utility tests
describe('Security Utility Functions', () => {
  test('validator.isEmail should work correctly', () => {
    expect(validator.isEmail('test@example.com')).toBe(true);
    expect(validator.isEmail('invalid-email')).toBe(false);
    expect(validator.isEmail('test@')).toBe(false);
    expect(validator.isEmail('@example.com')).toBe(false);
  });
  
  test('validator.escape should sanitize HTML', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const escaped = validator.escape(maliciousInput);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});
