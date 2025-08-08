const request = require('supertest');
const express = require('express');
const { spawn } = require('child_process');
const axios = require('axios');

// Mock external dependencies
jest.mock('liteapi-node-sdk', () => jest.fn(() => global.mockLiteApi));
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => global.mockOpenAI),
}));

describe('Hotel Booking Integration Tests', () => {
  let app;
  let server;
  const testPort = 3002;
  
  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = testPort;
    process.env.OPEN_API_KEY = 'test-openai-key';
    process.env.PROD_API_KEY = 'test-prod-key';
    process.env.SAND_API_KEY = 'test-sandbox-key';
    
    // Start server
    app = require('../server/server.js');
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock responses
    global.mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  searchParams: {
                    city: 'Las Vegas',
                    countryCode: 'US',
                    checkin: '2025-08-05',
                    checkout: '2025-08-06',
                    adults: 2,
                  },
                  funnyResponse: 'Las Vegas? Bold choice for testing!',
                  suggestions: ['Try Paris for romance', 'Consider Tokyo for culture'],
                  confidence: 95
                }),
              },
            }],
          }),
        },
      },
    };
    
    global.mockLiteApi = {
      getHotels: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'hotel1',
            name: 'Test Hotel Vegas',
            starRating: 4,
            description: 'Luxury hotel in the heart of Las Vegas',
            amenities: ['wifi', 'pool', 'gym'],
            distanceFromCity: '2.5 km'
          },
          {
            id: 'hotel2',
            name: 'Budget Inn Vegas',
            starRating: 2,
            description: 'Affordable accommodation near the strip',
            amenities: ['wifi', 'parking'],
            distanceFromCity: '5.0 km'
          }
        ],
      }),
      getFullRates: jest.fn().mockResolvedValue({
        data: [
          {
            hotelId: 'hotel1',
            roomTypes: [{
              offerId: 'offer1',
              rates: [{
                name: 'Deluxe Room',
                boardType: 'RO',
                boardName: 'Room Only',
                retailRate: {
                  total: [{ amount: 150 }],
                  suggestedSellingPrice: [{ amount: 200 }]
                },
                cancellationPolicies: { refundableTag: 'RFN' }
              }]
            }]
          },
          {
            hotelId: 'hotel2',
            roomTypes: [{
              offerId: 'offer2',
              rates: [{
                name: 'Standard Room',
                boardType: 'RO',
                boardName: 'Room Only',
                retailRate: {
                  total: [{ amount: 80 }],
                  suggestedSellingPrice: [{ amount: 100 }]
                },
                cancellationPolicies: { refundableTag: 'NRF' }
              }]
            }]
          }
        ],
      }),
      getHotelDetails: jest.fn().mockResolvedValue({
        data: {
          id: 'hotel1',
          name: 'Test Hotel Vegas',
          description: 'Luxury hotel in the heart of Las Vegas',
          amenities: ['wifi', 'pool', 'gym'],
          images: ['hotel1_image1.jpg', 'hotel1_image2.jpg']
        },
      }),
      preBook: jest.fn().mockResolvedValue({
        prebookId: 'prebook123',
        status: 'success',
        data: {
          prebookId: 'prebook123',
          expiresAt: '2025-08-05T10:00:00Z'
        }
      }),
      book: jest.fn().mockResolvedValue({
        data: {
          bookingId: 'booking123',
          status: 'confirmed',
          hotel: { name: 'Test Hotel Vegas' },
          checkin: '2025-08-05',
          checkout: '2025-08-06',
          bookedRooms: [{
            firstName: 'John',
            lastName: 'Doe',
            roomType: { name: 'Deluxe Room' }
          }]
        }
      })
    };
  });

  describe('Complete Hotel Search Workflow', () => {
    test('should complete full search workflow with AI parsing and hotel data', async () => {
      const searchQuery = 'Hotels in Las Vegas for vacation August 5-6 for 2 adults';
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: searchQuery,
          environment: 'sandbox',
          currency: 'USD'
        })
        .expect(200);
        
      // Verify AI parsing was called
      expect(global.mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: searchQuery
            })
          ])
        })
      );
      
      // Verify LiteAPI calls were made
      expect(global.mockLiteApi.getHotels).toHaveBeenCalledWith('US', 'Las Vegas', 0, 20);
      expect(global.mockLiteApi.getFullRates).toHaveBeenCalledWith(
        expect.objectContaining({
          hotelIds: ['hotel1', 'hotel2'],
          occupancies: [{ adults: 2, children: 0 }],
          currency: 'USD',
          checkin: '2025-08-05',
          checkout: '2025-08-06'
        })
      );
      
      // Verify response structure
      expect(response.body).toMatchObject({
        funnyResponse: expect.any(String),
        hotelData: {
          rates: expect.arrayContaining([
            expect.objectContaining({
              hotel: expect.objectContaining({
                id: 'hotel1',
                name: 'Test Hotel Vegas'
              }),
              roomTypes: expect.any(Array)
            })
          ]),
          totalResults: 2,
          searchParams: expect.objectContaining({
            city: 'Las Vegas',
            countryCode: 'US'
          }),
          currency: 'USD'
        }
      });
    });

    test('should handle AI service failure with fallback parsing', async () => {
      global.mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API Error')
      );
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'hotels in paris 2025-08-05 2025-08-06 2 adults',
          environment: 'sandbox'
        })
        .expect(200);
        
      expect(response.body.funnyResponse).toContain('coffee break');
      expect(global.mockLiteApi.getHotels).toHaveBeenCalled();
    });

    test('should handle currency conversion correctly', async () => {
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'Hotels in Las Vegas for vacation',
          environment: 'sandbox',
          currency: 'EUR'
        })
        .expect(200);
        
      expect(response.body.hotelData.currency).toBe('EUR');
      expect(response.body.hotelData.currencyRate).toBeDefined();
      
      // Check that prices were converted
      const rates = response.body.hotelData.rates;
      expect(rates[0].roomTypes[0].rates[0]).toMatchObject({
        originalPrice: 150, // USD price
        convertedPrice: expect.any(Number), // EUR price
        currency: 'EUR',
        priceBreakdown: expect.objectContaining({
          currency: 'EUR',
          subtotal: expect.any(Number),
          taxes: expect.any(Number),
          total: expect.any(Number)
        })
      });
    });
  });

  describe('Rate Details Workflow', () => {
    test('should fetch detailed rates for specific hotel', async () => {
      const response = await request(app)
        .get('/search-rates')
        .query({
          hotelId: 'hotel1',
          checkin: '2025-08-05',
          checkout: '2025-08-06',
          adults: 2,
          environment: 'sandbox',
          currency: 'USD'
        })
        .expect(200);
        
      expect(response.body).toMatchObject({
        hotelInfo: expect.objectContaining({
          id: 'hotel1',
          name: 'Test Hotel Vegas'
        }),
        rateInfo: expect.arrayContaining([
          expect.objectContaining({
            rateName: 'Deluxe Room',
            offerId: 'offer1',
            retailRate: expect.any(Number),
            priceBreakdown: expect.objectContaining({
              subtotal: expect.any(Number),
              taxes: expect.any(Number),
              total: expect.any(Number)
            })
          })
        ]),
        searchParams: expect.objectContaining({
          hotelId: 'hotel1',
          checkin: '2025-08-05',
          checkout: '2025-08-06'
        })
      });
      
      expect(global.mockLiteApi.getFullRates).toHaveBeenCalledWith(
        expect.objectContaining({
          hotelIds: ['hotel1'],
          occupancies: [{ adults: 2 }]
        })
      );
      expect(global.mockLiteApi.getHotelDetails).toHaveBeenCalledWith('hotel1');
    });
  });

  describe('Booking Workflow', () => {
    test('should complete prebook process', async () => {
      const response = await request(app)
        .post('/prebook')
        .send({
          rateId: 'offer1',
          environment: 'sandbox',
          voucherCode: 'DISCOUNT10'
        })
        .expect(200);
        
      expect(response.body).toMatchObject({
        success: expect.objectContaining({
          prebookId: 'prebook123',
          status: 'success'
        }),
        responseTime: expect.any(Number)
      });
      
      expect(global.mockLiteApi.preBook).toHaveBeenCalledWith({
        offerId: 'offer1',
        usePaymentSdk: true,
        voucherCode: 'DISCOUNT10'
      });
    });

    test('should complete booking process with guest details', async () => {
      const response = await request(app)
        .get('/book')
        .query({
          prebookId: 'prebook123',
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestEmail: 'john.doe@example.com',
          transactionId: 'trans123',
          environment: 'sandbox'
        })
        .expect(200);
        
      expect(response.text).toContain('Booking Confirmed!');
      expect(response.text).toContain('booking123');
      
      expect(global.mockLiteApi.book).toHaveBeenCalledWith({
        prebookId: 'prebook123',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        transactionId: 'trans123'
      });
    });

    test('should reject booking with invalid email', async () => {
      const response = await request(app)
        .get('/book')
        .query({
          prebookId: 'prebook123',
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestEmail: 'invalid-email',
          transactionId: 'trans123',
          environment: 'sandbox'
        })
        .expect(400);
        
      expect(response.text).toContain('Invalid email address format');
    });
  });

  describe('Enhanced Features Integration', () => {
    test('should provide price breakdown details', async () => {
      const response = await request(app)
        .get('/api/price-breakdown')
        .query({
          basePrice: 150,
          currency: 'USD',
          nights: 2
        })
        .expect(200);
        
      expect(response.body.breakdown).toMatchObject({
        subtotal: 150,
        taxes: expect.any(Number),
        serviceFee: expect.any(Number),
        cleaningFee: expect.any(Number),
        total: expect.any(Number),
        currency: 'USD'
      });
      
      expect(response.body.availableCurrencies).toContain('USD');
      expect(response.body.availableCurrencies).toContain('EUR');
    });

    test('should provide search suggestions based on analytics', async () => {
      const response = await request(app)
        .get('/api/search-suggestions')
        .query({ query: 'par', limit: 3 })
        .expect(200);
        
      expect(response.body).toMatchObject({
        suggestions: expect.arrayContaining([
          expect.objectContaining({
            city: expect.any(String),
            suggestion: expect.any(String)
          })
        ]),
        totalSearches: expect.any(Number)
      });
    });

    test('should provide analytics data', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200);
        
      expect(response.body).toMatchObject({
        totalSearches: expect.any(Number),
        searchErrors: expect.any(Number),
        avgResponseTime: expect.any(Number),
        successRate: expect.any(Number),
        topDestinations: expect.any(Array),
        cacheStats: expect.objectContaining({
          keys: expect.any(Number)
        })
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle LiteAPI service errors gracefully', async () => {
      global.mockLiteApi.getHotels.mockRejectedValue(
        new Error('LiteAPI Service Unavailable')
      );
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'Hotels in Las Vegas',
          environment: 'sandbox'
        })
        .expect(500);
        
      expect(response.body).toMatchObject({
        error: 'Error fetching hotel data. Please try again later.',
        code: 'LITEAPI_ERROR'
      });
    });

    test('should handle network timeouts in rate fetching', async () => {
      global.mockLiteApi.getFullRates.mockRejectedValue(
        new Error('ETIMEDOUT')
      );
      
      const response = await request(app)
        .get('/search-rates')
        .query({
          hotelId: 'hotel1',
          checkin: '2025-08-05',
          checkout: '2025-08-06',
          adults: 2,
          environment: 'sandbox'
        })
        .expect(500);
        
      expect(response.body).toMatchObject({
        error: 'Error fetching hotel rates. Please try again later.',
        code: 'RATES_FETCH_ERROR'
      });
    });
  });

  describe('Caching Integration', () => {
    test('should cache search results and return cached data', async () => {
      const query = { 
        q: 'Hotels in Las Vegas cached test',
        environment: 'sandbox'
      };
      
      // First request - should cache
      const response1 = await request(app)
        .get('/api/search-hotels')
        .query(query)
        .expect(200);
        
      expect(response1.body.cached).toBeUndefined();
      
      // Second request - should return cached
      const response2 = await request(app)
        .get('/api/search-hotels')
        .query(query)
        .expect(200);
        
      expect(response2.body.cached).toBe(true);
      expect(response2.body.cacheTimestamp).toBeDefined();
      
      // Should have called external APIs only once
      expect(global.mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('WebSocket Integration', () => {
    test('should establish WebSocket connection for real-time updates', (done) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://localhost:${testPort}`);
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connection') {
          expect(message.message).toContain('Connected to hotel booking service');
          ws.close();
          done();
        }
      });
      
      ws.on('error', (error) => {
        done(error);
      });
    }, 10000);
  });
});

// Test data validation and sanitization
describe('Data Validation Integration', () => {
  let app;
  
  beforeAll(() => {
    process.env.OPEN_API_KEY = 'test-key';
    process.env.SAND_API_KEY = 'test-key';
    app = require('../server/server.js');
  });
  
  test('should sanitize XSS attempts in search queries', async () => {
    const maliciousQuery = '<script>alert("xss")</script>hotels in paris';
    
    const response = await request(app)
      .get('/api/search-hotels')
      .query({ q: maliciousQuery, environment: 'sandbox' })
      .expect(400);
      
    // Should reject or sanitize malicious input
    expect(response.body.error).toBeDefined();
  });
  
  test('should validate date formats strictly', async () => {
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
  
  test('should validate email format in booking', async () => {
    const response = await request(app)
      .get('/book')
      .query({
        prebookId: 'test',
        guestFirstName: 'John',
        guestLastName: 'Doe',
        guestEmail: 'not-an-email',
        transactionId: 'test',
        environment: 'sandbox'
      })
      .expect(400);
      
    expect(response.text).toContain('Invalid email address format');
  });
});
