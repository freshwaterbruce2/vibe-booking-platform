const request = require('supertest');
const express = require('express');

// Mock external dependencies
jest.mock('liteapi-node-sdk', () => jest.fn(() => global.mockLiteApi));
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => global.mockOpenAI),
}));

describe('Hotel Booking Server', () => {
  let app;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set test environment variables
    process.env.OPEN_API_KEY = 'test-openai-key';
    process.env.PROD_API_KEY = 'test-prod-key';
    process.env.SAND_API_KEY = 'test-sandbox-key';
    
    // Create a new app instance for each test
    delete require.cache[require.resolve('../server/server.js')];
    app = require('../server/server.js');
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
        
      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
      });
    });
  });

  describe('GET /api/search-hotels', () => {
    beforeEach(() => {
      global.mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              searchParams: {
                city: 'Las Vegas',
                countryCode: 'US',
                checkin: '2025-01-01',
                checkout: '2025-01-02',
                adults: 2,
              },
              funnyResponse: 'Testing in Vegas? Bold choice!',
            }),
          },
        }],
      });
      
      global.mockLiteApi.getHotels.mockResolvedValue({
        data: [{
          id: 'hotel1',
          name: 'Test Hotel',
        }],
      });
      
      global.mockLiteApi.getFullRates.mockResolvedValue({
        data: [{
          hotelId: 'hotel1',
          roomTypes: [{
            rates: [{
              name: 'Standard Room',
              retailRate: { total: [{ amount: 150 }] },
            }],
          }],
        }],
      });
    });

    it('should return error for missing query', async () => {
      const response = await request(app)
        .get('/api/search-hotels')
        .expect(400);
        
      expect(response.body).toHaveProperty('error');
    });

    it('should validate query length', async () => {
      const longQuery = 'a'.repeat(501);
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: longQuery })
        .expect(400);
        
      expect(response.body.error).toContain('too long');
    });

    it('should validate environment parameter', async () => {
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: 'test query', environment: 'invalid' })
        .expect(400);
        
      expect(response.body.error).toContain('Environment must be');
    });

    it('should successfully search hotels', async () => {
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'Hotels in Las Vegas for vacation',
          environment: 'sandbox',
        })
        .expect(200);
        
      expect(response.body).toHaveProperty('funnyResponse');
      expect(response.body).toHaveProperty('hotelData');
      expect(global.mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(global.mockLiteApi.getHotels).toHaveBeenCalled();
      expect(global.mockLiteApi.getFullRates).toHaveBeenCalled();
    });

    it('should handle OpenAI API errors', async () => {
      global.mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API Error')
      );
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: 'test query' })
        .expect(500);
        
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('funnyResponse');
    });

    it('should handle LiteAPI errors', async () => {
      global.mockLiteApi.getHotels.mockRejectedValue(
        new Error('LiteAPI Error')
      );
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ q: 'test query' })
        .expect(500);
        
      expect(response.body).toHaveProperty('error');
    });

    it('should apply rate limiting', async () => {
      // Make 11 requests (rate limit is 10 per minute)
      const requests = Array(11).fill().map(() =>
        request(app)
          .get('/api/search-hotels')
          .query({ q: 'test query' })
      );
      
      const responses = await Promise.all(requests);
      
      // Last request should be rate limited
      expect(responses[10].status).toBe(429);
    });
  });

  describe('GET /search-rates', () => {
    beforeEach(() => {
      global.mockLiteApi.getFullRates.mockResolvedValue({
        data: [{
          roomTypes: [{
            offerId: 'offer1',
            rates: [{
              name: 'Standard Rate',
              boardType: 'RO',
              boardName: 'Room Only',
              cancellationPolicies: { refundableTag: 'RFN' },
              retailRate: {
                total: [{ amount: 150 }],
                suggestedSellingPrice: [{ amount: 200 }],
              },
            }],
          }],
        }],
      });
      
      global.mockLiteApi.getHotelDetails.mockResolvedValue({
        data: {
          id: 'hotel1',
          name: 'Test Hotel',
        },
      });
    });

    it('should return hotel rates', async () => {
      const response = await request(app)
        .get('/search-rates')
        .query({
          checkin: '2025-01-01',
          checkout: '2025-01-02',
          adults: 2,
          hotelId: 'hotel1',
          environment: 'sandbox',
        })
        .expect(200);
        
      expect(response.body).toHaveProperty('hotelInfo');
      expect(response.body).toHaveProperty('rateInfo');
    });
  });

  describe('POST /prebook', () => {
    beforeEach(() => {
      global.mockLiteApi.preBook.mockImplementation(() => 
        Promise.resolve({ prebookId: 'prebook123', status: 'success' })
      );
    });

    it('should successfully prebook hotel', async () => {
      const response = await request(app)
        .post('/prebook')
        .send({
          rateId: 'rate123',
          environment: 'sandbox',
        })
        .expect(200);
        
      expect(response.body).toHaveProperty('success');
      expect(global.mockLiteApi.preBook).toHaveBeenCalledWith({
        offerId: 'rate123',
        usePaymentSdk: true,
      });
    });

    it('should include voucher code when provided', async () => {
      const response = await request(app)
        .post('/prebook')
        .send({
          rateId: 'rate123',
          environment: 'sandbox',
          voucherCode: 'DISCOUNT10',
        })
        .expect(200);
        
      expect(global.mockLiteApi.preBook).toHaveBeenCalledWith({
        offerId: 'rate123',
        usePaymentSdk: true,
        voucherCode: 'DISCOUNT10',
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
        
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});