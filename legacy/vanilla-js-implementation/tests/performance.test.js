const request = require('supertest');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Mock external dependencies for consistent performance testing
jest.mock('liteapi-node-sdk', () => jest.fn(() => global.mockLiteApi));
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => global.mockOpenAI),
}));

describe('Hotel Booking Performance Tests', () => {
  let app;
  const performanceResults = [];
  
  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.OPEN_API_KEY = 'test-key';
    process.env.SAND_API_KEY = 'test-key';
    process.env.PROD_API_KEY = 'test-key';
    
    app = require('../server/server.js');
  });
  
  afterAll(() => {
    // Generate performance report
    generatePerformanceReport();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Fast mock responses for performance testing
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
                  funnyResponse: 'Fast test response!',
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
        data: generateMockHotels(20), // Generate 20 hotels for testing
      }),
      getFullRates: jest.fn().mockResolvedValue({
        data: generateMockRates(20),
      }),
      getHotelDetails: jest.fn().mockResolvedValue({
        data: {
          id: 'hotel1',
          name: 'Performance Test Hotel',
          description: 'Fast hotel for testing',
          amenities: ['wifi', 'pool']
        },
      }),
      preBook: jest.fn().mockResolvedValue({
        prebookId: 'fast-prebook',
        status: 'success'
      }),
      book: jest.fn().mockResolvedValue({
        data: {
          bookingId: 'fast-booking',
          status: 'confirmed'
        }
      })
    };
  });

  describe('API Response Time Tests', () => {
    test('search hotels endpoint should respond within 2000ms', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/search-hotels')
        .query({ 
          q: 'Hotels in Las Vegas for performance test',
          environment: 'sandbox'
        })
        .expect(200);
        
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      performanceResults.push({
        test: 'Hotel Search API',
        responseTime: Math.round(responseTime),
        target: 2000,
        status: responseTime < 2000 ? 'PASS' : 'FAIL'
      });
      
      expect(responseTime).toBeLessThan(2000);
      expect(response.body.hotelData.responseTime).toBeDefined();
    });
    
    test('rate details endpoint should respond within 1500ms', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .get('/search-rates')
        .query({
          hotelId: 'hotel1',
          checkin: '2025-08-05',
          checkout: '2025-08-06',
          adults: 2,
          environment: 'sandbox'
        })
        .expect(200);
        
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      performanceResults.push({
        test: 'Rate Details API',
        responseTime: Math.round(responseTime),
        target: 1500,
        status: responseTime < 1500 ? 'PASS' : 'FAIL'
      });
      
      expect(responseTime).toBeLessThan(1500);
      expect(response.body.responseTime).toBeDefined();
    });
    
    test('prebook endpoint should respond within 1000ms', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/prebook')
        .send({
          rateId: 'offer1',
          environment: 'sandbox'
        })
        .expect(200);
        
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      performanceResults.push({
        test: 'Prebook API',
        responseTime: Math.round(responseTime),
        target: 1000,
        status: responseTime < 1000 ? 'PASS' : 'FAIL'
      });
      
      expect(responseTime).toBeLessThan(1000);
      expect(response.body.responseTime).toBeDefined();
    });
    
    test('health check endpoint should respond within 100ms', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/health')
        .expect(200);
        
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      performanceResults.push({
        test: 'Health Check API',
        responseTime: Math.round(responseTime),
        target: 100,
        status: responseTime < 100 ? 'PASS' : 'FAIL'
      });
      
      expect(responseTime).toBeLessThan(100);
      expect(response.body.performance.uptime).toBeDefined();
    });
  });

  describe('Load Testing', () => {
    test('should handle concurrent search requests', async () => {
      const concurrentRequests = 10;
      const requests = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/search-hotels')
            .query({ 
              q: `Hotels in City${i} for load test`,
              environment: 'sandbox'
            })
        );
      }
      
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / concurrentRequests;
      
      performanceResults.push({
        test: 'Concurrent Search Requests',
        responseTime: Math.round(avgResponseTime),
        target: 3000,
        status: avgResponseTime < 3000 ? 'PASS' : 'FAIL',
        details: `${concurrentRequests} concurrent requests`
      });
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Average response time should be reasonable
      expect(avgResponseTime).toBeLessThan(3000);
    });
    
    test('should handle rapid sequential requests without rate limiting issues', async () => {
      const requestCount = 5;
      const responses = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < requestCount; i++) {
        const response = await request(app)
          .get('/api/search-hotels')
          .query({ 
            q: `Sequential test ${i}`,
            environment: 'sandbox'
          });
        responses.push(response);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / requestCount;
      
      performanceResults.push({
        test: 'Sequential Requests',
        responseTime: Math.round(avgResponseTime),
        target: 2500,
        status: avgResponseTime < 2500 ? 'PASS' : 'FAIL',
        details: `${requestCount} sequential requests`
      });
      
      // No requests should be rate limited
      responses.forEach(response => {
        expect(response.status).not.toBe(429);
      });
      
      expect(avgResponseTime).toBeLessThan(2500);
    });
  });

  describe('Caching Performance Tests', () => {
    test('cached requests should be significantly faster', async () => {
      const query = { 
        q: 'Hotels in Paris for cache test',
        environment: 'sandbox'
      };
      
      // First request (not cached)
      const startTime1 = performance.now();
      const response1 = await request(app)
        .get('/api/search-hotels')
        .query(query)
        .expect(200);
      const endTime1 = performance.now();
      const firstRequestTime = endTime1 - startTime1;
      
      // Second request (should be cached)
      const startTime2 = performance.now();
      const response2 = await request(app)
        .get('/api/search-hotels')
        .query(query)
        .expect(200);
      const endTime2 = performance.now();
      const cachedRequestTime = endTime2 - startTime2;
      
      performanceResults.push({
        test: 'Cache Performance Improvement',
        responseTime: Math.round(cachedRequestTime),
        target: Math.round(firstRequestTime * 0.5), // Should be at least 50% faster
        status: cachedRequestTime < firstRequestTime * 0.5 ? 'PASS' : 'FAIL',
        details: `First: ${Math.round(firstRequestTime)}ms, Cached: ${Math.round(cachedRequestTime)}ms`
      });
      
      expect(response2.body.cached).toBe(true);
      expect(cachedRequestTime).toBeLessThan(firstRequestTime * 0.5);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not have significant memory leaks during multiple requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make multiple requests to test for memory leaks
      for (let i = 0; i < 20; i++) {
        await request(app)
          .get('/api/search-hotels')
          .query({ 
            q: `Memory test ${i}`,
            environment: 'sandbox'
          })
          .expect(200);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      performanceResults.push({
        test: 'Memory Usage',
        responseTime: Math.round(memoryIncreasePercent),
        target: 50, // Should not increase more than 50%
        status: memoryIncreasePercent < 50 ? 'PASS' : 'FAIL',
        details: `Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB (${Math.round(memoryIncreasePercent)}%)`
      });
      
      // Memory should not increase dramatically
      expect(memoryIncreasePercent).toBeLessThan(50);
    });
  });

  describe('Static Asset Performance', () => {
    test('should serve static files efficiently', async () => {
      const staticFiles = [
        '/styles.css',
        '/app.js',
        '/passion-data.js',
        '/manifest.json'
      ];
      
      for (const file of staticFiles) {
        const startTime = performance.now();
        
        const response = await request(app)
          .get(file)
          .expect(200);
          
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        performanceResults.push({
          test: `Static Asset: ${file}`,
          responseTime: Math.round(responseTime),
          target: 200,
          status: responseTime < 200 ? 'PASS' : 'FAIL'
        });
        
        expect(responseTime).toBeLessThan(200);
        
        // Check for compression headers
        if (file.endsWith('.css') || file.endsWith('.js')) {
          expect(response.headers['content-encoding']).toBeDefined();
        }
      }
    });
  });
});

// Helper functions
function generateMockHotels(count) {
  const hotels = [];
  for (let i = 1; i <= count; i++) {
    hotels.push({
      id: `hotel${i}`,
      name: `Test Hotel ${i}`,
      starRating: Math.floor(Math.random() * 5) + 1,
      description: `Description for hotel ${i}`,
      amenities: ['wifi', 'pool', 'gym'].slice(0, Math.floor(Math.random() * 3) + 1),
      distanceFromCity: `${(Math.random() * 10).toFixed(1)} km`
    });
  }
  return hotels;
}

function generateMockRates(count) {
  const rates = [];
  for (let i = 1; i <= count; i++) {
    rates.push({
      hotelId: `hotel${i}`,
      roomTypes: [{
        offerId: `offer${i}`,
        rates: [{
          name: `Room Type ${i}`,
          boardType: 'RO',
          boardName: 'Room Only',
          retailRate: {
            total: [{ amount: Math.floor(Math.random() * 300) + 50 }],
            suggestedSellingPrice: [{ amount: Math.floor(Math.random() * 400) + 100 }]
          },
          cancellationPolicies: { refundableTag: Math.random() > 0.5 ? 'RFN' : 'NRF' }
        }]
      }]
    });
  }
  return rates;
}

function generatePerformanceReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: performanceResults.length,
      passed: performanceResults.filter(r => r.status === 'PASS').length,
      failed: performanceResults.filter(r => r.status === 'FAIL').length,
      averageResponseTime: Math.round(
        performanceResults.reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.length
      )
    },
    results: performanceResults,
    recommendations: generateRecommendations()
  };
  
  // Write report to file
  const reportPath = path.join(__dirname, '../performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n========== PERFORMANCE TEST REPORT ==========');
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Average Response Time: ${report.summary.averageResponseTime}ms`);
  console.log('\nDetailed Results:');
  
  performanceResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.responseTime}ms (target: ${result.target}ms)`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  });
  
  console.log(`\nFull report saved to: ${reportPath}`);
  console.log('=============================================\n');
}

function generateRecommendations() {
  const recommendations = [];
  const failedTests = performanceResults.filter(r => r.status === 'FAIL');
  
  if (failedTests.length > 0) {
    recommendations.push({
      category: 'Performance Issues',
      items: failedTests.map(test => `${test.test} exceeded target by ${test.responseTime - test.target}ms`)
    });
  }
  
  const avgResponseTime = performanceResults.reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.length;
  
  if (avgResponseTime > 1000) {
    recommendations.push({
      category: 'Optimization',
      items: [
        'Consider implementing response compression',
        'Optimize database queries',
        'Add more aggressive caching',
        'Consider implementing CDN for static assets'
      ]
    });
  }
  
  if (performanceResults.some(r => r.test.includes('Memory'))) {
    recommendations.push({
      category: 'Memory Management',
      items: [
        'Monitor for memory leaks in production',
        'Implement proper cleanup for large objects',
        'Consider memory-efficient data structures'
      ]
    });
  }
  
  return recommendations;
}
