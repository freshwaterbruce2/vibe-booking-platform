const request = require('supertest');
const express = require('express');

// Mock external dependencies with more detailed control
jest.mock('liteapi-node-sdk', () => {
  return jest.fn(() => ({
    getHotels: jest.fn(),
    getFullRates: jest.fn(),
    getHotelDetails: jest.fn(),
    preBook: jest.fn(),
    book: jest.fn()
  }));
});

jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

jest.mock('axios', () => ({
  get: jest.fn()
}));

describe('Hotel Booking API Unit Tests', () => {
  let app;
  let mockLiteApi;
  let mockOpenAI;
  let mockAxios;
  
  beforeAll(() => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.OPEN_API_KEY = 'test-openai-key';
    process.env.PROD_API_KEY = 'test-prod-key';
    process.env.SAND_API_KEY = 'test-sandbox-key';
    
    // Get mocked modules
    const liteApiModule = require('liteapi-node-sdk');
    mockLiteApi = liteApiModule();
    
    const openaiModule = require('openai');
    mockOpenAI = new openaiModule.OpenAI();
    
    mockAxios = require('axios');
    
    // Create app instance
    app = require('../server/server.js');
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Price Calculation Functions', () => {
    test('should calculate price breakdown correctly', async () => {
      const response = await request(app)
        .get('/api/price-breakdown')
        .query({
          basePrice: 100,
          currency: 'USD',
          nights: 2
        })
        .expect(200);
        
      const breakdown = response.body.breakdown;
      
      expect(breakdown.subtotal).toBe(100);
      expect(breakdown.taxes).toBe(12); // 12% of 100
      expect(breakdown.serviceFee).toBe(5); // Max of 3% or $5 minimum
      expect(breakdown.cleaningFee).toBe(15); // $15 for <= 3 nights
      expect(breakdown.totalTaxesAndFees).toBe(32); // 12 + 5 + 15
      expect(breakdown.total).toBe(132); // 100 + 32
      expect(breakdown.currency).toBe('USD');
    });
    
    test('should handle different night counts for cleaning fee', async () => {
      // Test for more than 3 nights
      const response = await request(app)
        .get('/api/price-breakdown')
        .query({
          basePrice: 200,
          currency: 'USD',
          nights: 5
        })
        .expect(200);
        
      expect(response.body.breakdown.cleaningFee).toBe(25); // $25 for > 3 nights
    });
    
    test('should handle minimum service fee correctly', async () => {
      // Test with low base price where 3% would be less than $5
      const response = await request(app)
        .get('/api/price-breakdown')
        .query({
          basePrice: 50,
          currency: 'USD',
          nights: 1
        })
        .expect(200);
        
      const breakdown = response.body.breakdown;
      expect(breakdown.serviceFee).toBe(5); // Should be $5 minimum, not 3% of $50 ($1.50)
    });
    
    test('should validate price breakdown input', async () => {
      // Test missing base price
      await request(app)
        .get('/api/price-breakdown')
        .query({ currency: 'USD', nights: 1 })
        .expect(400);
        
      // Test invalid base price
      await request(app)
        .get('/api/price-breakdown')
        .query({ basePrice: 'invalid', currency: 'USD', nights: 1 })
        .expect(400);
    });
  });

  describe('Currency Conversion Functions', () => {
    beforeEach(() => {
      // Mock axios for currency API calls
      mockAxios.get.mockResolvedValue({
        data: {
          rates: {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110
          }
        }
      });
    });
    
    test('should handle currency conversion in search results', async () => {
      // Setup OpenAI mock
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              searchParams: {
                city: 'Paris',
                countryCode: 'FR',
                checkin: '2025-08-05',
                checkout: '2025-08-06',
                adults: 2
              },
              funnyResponse: 'Currency test!'
            })
          }
        }]
      });
      
      // Setup LiteAPI mocks
      mockLiteApi.getHotels.mockResolvedValue({
        data: [{ id: 'hotel1', name: 'Test Hotel' }]
      });
      
      mockLiteApi.getFullRates.mockResolvedValue({
        data: [{
          hotelId: 'hotel1',
          roomTypes: [{
            rates: [{
              name: 'Standard Room',
              retailRate: {
                total: [{ amount: 100 }], // USD
                suggestedSellingPrice: [{ amount: 150 }]
              },
              boardType: 'RO',
              boardName: 'Room Only',
              cancellationPolicies: { refundableTag: 'RFN' }
            }]
          }]
        }]
      });
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'Hotels in Paris',
          environment: 'sandbox',
          currency: 'EUR'
        })
        .expect(200);
        
      const rates = response.body.hotelData.rates;
      expect(rates[0].roomTypes[0].rates[0]).toMatchObject({
        originalPrice: 100,
        convertedPrice: 85, // 100 * 0.85
        currency: 'EUR'
      });
    });
    
    test('should handle currency API failures gracefully', async () => {
      // Mock axios to fail
      mockAxios.get.mockRejectedValue(new Error('Currency API unavailable'));
      
      const response = await request(app)
        .get('/api/price-breakdown')
        .query({
          basePrice: 100,
          currency: 'EUR',
          nights: 1
        })
        .expect(200);
        
      // Should still work with fallback rates
      expect(response.body.breakdown).toBeDefined();
    });
  });

  describe('Search Analytics Functions', () => {
    test('should track search analytics correctly', async () => {
      // Setup mocks for successful search
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              searchParams: {
                city: 'London',
                countryCode: 'GB',
                checkin: '2025-08-05',
                checkout: '2025-08-06',
                adults: 2
              },
              funnyResponse: 'Analytics test!'
            })
          }
        }]
      });
      
      mockLiteApi.getHotels.mockResolvedValue({ data: [{ id: 'hotel1' }] });
      mockLiteApi.getFullRates.mockResolvedValue({ data: [] });
      
      // Perform search
      await request(app)
        .get('/api/search-hotels')
        .query({ q: 'Hotels in London', environment: 'sandbox' })
        .expect(200);
        
      // Check analytics endpoint
      const analyticsResponse = await request(app)
        .get('/api/analytics')
        .expect(200);
        
      expect(analyticsResponse.body).toMatchObject({
        totalSearches: expect.any(Number),
        searchErrors: expect.any(Number),
        avgResponseTime: expect.any(Number),
        successRate: expect.any(Number),
        topDestinations: expect.any(Array),
        cacheStats: expect.any(Object)
      });
      
      expect(analyticsResponse.body.totalSearches).toBeGreaterThan(0);
    });
    
    test('should track search errors in analytics', async () => {
      // Setup mocks to simulate error
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API Error')
      );
      
      // Perform search that will fail
      await request(app)
        .get('/api/search-hotels')
        .query({ q: 'Error city test', environment: 'sandbox' })
        .expect(503);
        
      const analyticsResponse = await request(app)
        .get('/api/analytics')
        .expect(200);
        
      expect(analyticsResponse.body.searchErrors).toBeGreaterThan(0);
    });
  });

  describe('Retry Mechanism Functions', () => {
    test('should retry failed API calls', async () => {
      let callCount = 0;
      mockLiteApi.getHotels.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({ data: [{ id: 'hotel1' }] });
      });
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              searchParams: {
                city: 'Retry City',
                countryCode: 'US',
                checkin: '2025-08-05',
                checkout: '2025-08-06',
                adults: 2
              },
              funnyResponse: 'Retry test!'
            })
          }
        }]
      });
      
      mockLiteApi.getFullRates.mockResolvedValue({ data: [] });
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: 'Hotels in Retry City', environment: 'sandbox' })
        .expect(200);
        
      // Should have retried and eventually succeeded
      expect(callCount).toBe(3);
      expect(response.body.hotelData).toBeDefined();
    });
    
    test('should fail after maximum retries', async () => {
      mockLiteApi.getHotels.mockRejectedValue(new Error('Persistent failure'));
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              searchParams: {
                city: 'Fail City',
                countryCode: 'US',
                checkin: '2025-08-05',
                checkout: '2025-08-06',
                adults: 2
              },
              funnyResponse: 'Fail test!'
            })
          }
        }]
      });
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: 'Hotels in Fail City', environment: 'sandbox' })
        .expect(500);
        
      expect(response.body.error).toContain('Error fetching hotel data');
      expect(mockLiteApi.getHotels).toHaveBeenCalledTimes(3); // Should retry 3 times
    });
  });

  describe('Fallback Query Parser Functions', () => {
    test('should parse city from query when OpenAI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI unavailable')
      );
      
      mockLiteApi.getHotels.mockResolvedValue({ data: [] });
      mockLiteApi.getFullRates.mockResolvedValue({ data: [] });
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'hotels in paris 2025-08-05 2025-08-06 2 adults',
          environment: 'sandbox'
        })
        .expect(200);
        
      expect(response.body.funnyResponse).toContain('coffee break');
      expect(mockLiteApi.getHotels).toHaveBeenCalledWith('FR', 'paris', 0, 20);
    });
    
    test('should parse dates from query', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI unavailable')
      );
      
      mockLiteApi.getHotels.mockResolvedValue({ data: [] });
      mockLiteApi.getFullRates.mockResolvedValue({ data: [] });
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'hotels in london 2025-12-25 2025-12-27 for vacation',
          environment: 'sandbox'
        })
        .expect(200);
        
      expect(mockLiteApi.getFullRates).toHaveBeenCalledWith(
        expect.objectContaining({
          checkin: '2025-12-25',
          checkout: '2025-12-27'
        })
      );
    });
    
    test('should parse adults count from query', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI unavailable')
      );
      
      mockLiteApi.getHotels.mockResolvedValue({ data: [] });
      mockLiteApi.getFullRates.mockResolvedValue({ data: [] });
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'hotels in tokyo for 4 adults',
          environment: 'sandbox'
        })
        .expect(200);
        
      expect(mockLiteApi.getFullRates).toHaveBeenCalledWith(
        expect.objectContaining({
          occupancies: [{ adults: 4, children: 0 }]
        })
      );
    });
    
    test('should handle unparseable queries gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI unavailable')
      );
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'random text with no city or dates',
          environment: 'sandbox'
        })
        .expect(503);
        
      expect(response.body.code).toBe('AI_SERVICE_ERROR');
      expect(response.body.fallbackSuggestions).toBeDefined();
    });
  });

  describe('Input Validation Functions', () => {
    test('should validate search query length', async () => {
      const longQuery = 'a'.repeat(501);
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: longQuery, environment: 'sandbox' })
        .expect(400);
        
      expect(response.body.error).toContain('too long');
    });
    
    test('should validate currency parameter', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              searchParams: {
                city: 'Paris',
                countryCode: 'FR',
                checkin: '2025-08-05',
                checkout: '2025-08-06',
                adults: 2
              },
              funnyResponse: 'Currency validation test!'
            })
          }
        }]
      });
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'Hotels in Paris',
          environment: 'sandbox',
          currency: 'INVALID'
        })
        .expect(400);
        
      expect(response.body.error).toContain('Unsupported currency');
      expect(response.body.supportedCurrencies).toContain('USD');
    });
    
    test('should validate environment parameter', async () => {
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'test query',
          environment: 'invalid'
        })
        .expect(400);
        
      expect(response.body.error).toContain('Environment must be');
    });
    
    test('should validate date formats in rate search', async () => {
      const response = await request(app)
        .get('/search-rates')
        .query({
          hotelId: 'hotel1',
          checkin: 'invalid-date',
          checkout: '2025-08-06',
          adults: 2,
          environment: 'sandbox'
        })
        .expect(400);
        
      expect(response.body.error).toContain('Invalid date format');
    });
    
    test('should validate date logic in rate search', async () => {
      const response = await request(app)
        .get('/search-rates')
        .query({
          hotelId: 'hotel1',
          checkin: '2025-08-06',
          checkout: '2025-08-05', // Before checkin
          adults: 2,
          environment: 'sandbox'
        })
        .expect(400);
        
      expect(response.body.error).toContain('Check-out date must be after check-in date');
    });
  });

  describe('Error Response Functions', () => {
    test('should return structured error responses', async () => {
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ environment: 'sandbox' }) // Missing required 'q' parameter
        .expect(400);
        
      expect(response.body).toMatchObject({
        error: expect.any(String),
        code: 'INVALID_QUERY',
        suggestions: expect.any(Array)
      });
    });
    
    test('should handle missing API keys appropriately', async () => {
      // Temporarily remove API key
      const originalKey = process.env.SAND_API_KEY;
      delete process.env.SAND_API_KEY;
      
      // Create new app instance without API key
      delete require.cache[require.resolve('../server/server.js')];
      const appWithoutKey = require('../server/server.js');
      
      const response = await request(appWithoutKey)
        .get('/api/search-hotels')
        .query({ q: 'test query', environment: 'sandbox' })
        .expect(500);
        
      expect(response.body).toMatchObject({
        error: expect.stringContaining('configuration error'),
        code: 'API_KEY_MISSING'
      });
      
      // Restore API key
      process.env.SAND_API_KEY = originalKey;
    });
  });

  describe('Search Suggestions Functions', () => {
    test('should provide search suggestions', async () => {
      const response = await request(app)
        .get('/api/search-suggestions')
        .query({ query: 'par', limit: 3 })
        .expect(200);
        
      expect(response.body).toMatchObject({
        suggestions: expect.any(Array),
        totalSearches: expect.any(Number),
        timestamp: expect.any(String)
      });
      
      expect(response.body.suggestions.length).toBeLessThanOrEqual(3);
    });
    
    test('should validate suggestions query length', async () => {
      const response = await request(app)
        .get('/api/search-suggestions')
        .query({ query: 'a' }) // Too short
        .expect(400);
        
      expect(response.body.error).toContain('at least 2 characters');
    });
  });

  describe('Health Check Functions', () => {
    test('should provide comprehensive health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
        
      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
        services: {
          openai: expect.any(Boolean),
          liteapi_sandbox: expect.any(Boolean),
          liteapi_production: expect.any(Boolean),
          cache: expect.any(Boolean),
          database: expect.any(Boolean)
        },
        performance: {
          uptime: expect.any(Number),
          memoryUsage: expect.any(Object),
          avgResponseTime: expect.any(Number)
        }
      });
    });
    
    test('should report degraded status when services are down', async () => {
      // Temporarily disable OpenAI
      const originalKey = process.env.OPEN_API_KEY;
      delete process.env.OPEN_API_KEY;
      
      delete require.cache[require.resolve('../server/server.js')];
      const degradedApp = require('../server/server.js');
      
      const response = await request(degradedApp)
        .get('/api/health')
        .expect(503);
        
      expect(response.body.status).toBe('degraded');
      expect(response.body.issues).toContain('openai unavailable');
      
      // Restore API key
      process.env.OPEN_API_KEY = originalKey;
    });
  });
});

// Additional unit tests for utility functions
describe('Utility Functions Unit Tests', () => {
  test('should calculate nights between dates correctly', () => {
    const checkin = new Date('2025-08-05');
    const checkout = new Date('2025-08-08');
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    
    expect(nights).toBe(3);
  });
  
  test('should handle date edge cases', () => {
    // Same day
    const sameDay1 = new Date('2025-08-05T10:00:00');
    const sameDay2 = new Date('2025-08-05T18:00:00');
    const sameNights = Math.ceil((sameDay2 - sameDay1) / (1000 * 60 * 60 * 24));
    
    expect(sameNights).toBe(1); // Should round up to 1 night
  });
  
  test('should validate email formats correctly', () => {
    const validator = require('validator');
    
    expect(validator.isEmail('test@example.com')).toBe(true);
    expect(validator.isEmail('invalid.email')).toBe(false);
    expect(validator.isEmail('test@')).toBe(false);
    expect(validator.isEmail('@example.com')).toBe(false);
  });
  
  test('should escape HTML correctly', () => {
    const validator = require('validator');
    
    const maliciousInput = '<script>alert("xss")</script>';
    const escaped = validator.escape(maliciousInput);
    
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });
});
