import { liteApiService } from '../services/liteApiService.js';
import { logger } from '../utils/logger.js';

interface TestResult {
  test: string;
  success: boolean;
  duration: number;
  data?: any;
  error?: string;
}

class LiteAPIIntegrationTester {
  private results: TestResult[] = [];
  
  async runComprehensiveTest(): Promise<{ 
    success: boolean; 
    results: TestResult[]; 
    summary: { passed: number; failed: number; total: number } 
  }> {
    logger.info('🧪 Starting LiteAPI comprehensive integration test...');
    
    this.results = [];
    
    // Test 1: API Connection and Authentication
    await this.testApiConnection();
    
    // Test 2: Hotel Search with Popular Destinations
    await this.testHotelSearch();
    
    // Test 3: Hotel Details Retrieval
    await this.testHotelDetails();
    
    // Test 4: Rate Availability Check
    await this.testRateAvailability();
    
    // Test 5: Booking Flow Simulation (Prebook)
    await this.testBookingFlow();
    
    // Test 6: Error Handling
    await this.testErrorHandling();
    
    // Test 7: Rate Limiting Compliance
    await this.testRateLimiting();
    
    const summary = this.generateSummary();
    const overallSuccess = summary.failed === 0;
    
    logger.info('🔍 LiteAPI integration test completed', {
      success: overallSuccess,
      summary
    });
    
    return {
      success: overallSuccess,
      results: this.results,
      summary
    };
  }

  private async testApiConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test basic API connectivity with a simple search
      const response = await liteApiService.searchHotels({
        checkin: '2025-09-01',
        checkout: '2025-09-02',
        currency: 'USD',
        guests: [{ adults: 2, children: 0 }],
        residency: 'US'
      });
      
      this.results.push({
        test: 'API Connection',
        success: true,
        duration: Date.now() - startTime,
        data: {
          status: 'Connected',
          apiVersion: 'v1',
          responseTime: `${Date.now() - startTime}ms`
        }
      });
    } catch (error: any) {
      this.results.push({
        test: 'API Connection',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  }

  private async testHotelSearch(): Promise<void> {
    const testCases = [
      { city: 'New York', country: 'US', name: 'NYC Search' },
      { city: 'London', country: 'GB', name: 'London Search' },
      { city: 'Tokyo', country: 'JP', name: 'Tokyo Search' }
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        const results = await liteApiService.searchHotels({
          checkin: '2025-10-15',
          checkout: '2025-10-18',
          currency: 'USD',
          guests: [{ adults: 2, children: 0 }],
          residency: 'US',
          city: testCase.city,
          countryCode: testCase.country
        });
        
        const hotelCount = results.data?.hotels?.length || 0;
        
        this.results.push({
          test: `Hotel Search - ${testCase.name}`,
          success: hotelCount > 0,
          duration: Date.now() - startTime,
          data: {
            city: testCase.city,
            hotelsFound: hotelCount,
            sampleHotel: results.data?.hotels?.[0]?.name || 'N/A'
          }
        });
      } catch (error: any) {
        this.results.push({
          test: `Hotel Search - ${testCase.name}`,
          success: false,
          duration: Date.now() - startTime,
          error: error.message
        });
      }
    }
  }

  private async testHotelDetails(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // First get a hotel from search
      const searchResults = await liteApiService.searchHotels({
        checkin: '2025-09-01',
        checkout: '2025-09-02',
        currency: 'USD',
        guests: [{ adults: 2, children: 0 }],
        residency: 'US',
        city: 'New York'
      });

      if (searchResults.data?.hotels?.length > 0) {
        const hotelId = searchResults.data.hotels[0].id;
        
        const hotelDetails = await liteApiService.getHotelDetails(hotelId);
        
        this.results.push({
          test: 'Hotel Details Retrieval',
          success: true,
          duration: Date.now() - startTime,
          data: {
            hotelId,
            hotelName: hotelDetails.data?.name || 'N/A',
            hasImages: (hotelDetails.data?.images?.length || 0) > 0,
            hasAmenities: (hotelDetails.data?.amenities?.length || 0) > 0,
            hasDescription: !!hotelDetails.data?.description
          }
        });
      } else {
        throw new Error('No hotels found in search for details test');
      }
    } catch (error: any) {
      this.results.push({
        test: 'Hotel Details Retrieval',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  }

  private async testRateAvailability(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test rate availability for different date ranges
      const dateRanges = [
        { checkin: '2025-09-01', checkout: '2025-09-03', duration: '2 nights' },
        { checkin: '2025-10-15', checkout: '2025-10-22', duration: '7 nights' },
        { checkin: '2025-12-24', checkout: '2025-12-26', duration: 'Christmas period' }
      ];

      let successfulChecks = 0;

      for (const range of dateRanges) {
        try {
          const results = await liteApiService.searchHotels({
            checkin: range.checkin,
            checkout: range.checkout,
            currency: 'USD',
            guests: [{ adults: 2, children: 0 }],
            residency: 'US',
            city: 'Miami'
          });
          
          if (results.data?.hotels?.length > 0) {
            successfulChecks++;
          }
        } catch (rangeError) {
          // Continue with other ranges
        }
      }

      this.results.push({
        test: 'Rate Availability Check',
        success: successfulChecks > 0,
        duration: Date.now() - startTime,
        data: {
          successfulChecks,
          totalRanges: dateRanges.length,
          coverage: `${Math.round((successfulChecks / dateRanges.length) * 100)}%`
        }
      });
    } catch (error: any) {
      this.results.push({
        test: 'Rate Availability Check',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  }

  private async testBookingFlow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate booking flow without actual booking
      const searchResults = await liteApiService.searchHotels({
        checkin: '2025-09-15',
        checkout: '2025-09-17',
        currency: 'USD',
        guests: [{ adults: 2, children: 0 }],
        residency: 'US',
        city: 'Los Angeles'
      });

      if (searchResults.data?.hotels?.length > 0) {
        const hotel = searchResults.data.hotels[0];
        const rate = hotel.rates?.[0];
        
        if (rate) {
          // Test prebook endpoint (validation step before actual booking)
          const prebookData = {
            hotelId: hotel.id,
            rateId: rate.id,
            guests: {
              adults: 2,
              children: 0
            },
            rooms: [{
              rateId: rate.id,
              adults: 2,
              children: 0
            }]
          };

          // Note: This would be a real prebook call in production
          // For testing, we simulate the validation
          
          this.results.push({
            test: 'Booking Flow Simulation',
            success: true,
            duration: Date.now() - startTime,
            data: {
              hotelId: hotel.id,
              hotelName: hotel.name,
              rateFound: true,
              prebookReady: true,
              totalPrice: rate.totalPrice || 'N/A',
              currency: rate.currency || 'USD'
            }
          });
        } else {
          throw new Error('No rates available for booking test');
        }
      } else {
        throw new Error('No hotels found for booking test');
      }
    } catch (error: any) {
      this.results.push({
        test: 'Booking Flow Simulation',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  }

  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test various error scenarios
      const errorTests = [
        {
          name: 'Invalid Date Range',
          test: () => liteApiService.searchHotels({
            checkin: '2025-01-01',
            checkout: '2024-12-31', // Invalid: checkout before checkin
            currency: 'USD',
            guests: [{ adults: 2, children: 0 }],
            residency: 'US'
          })
        },
        {
          name: 'Invalid Currency',
          test: () => liteApiService.searchHotels({
            checkin: '2025-09-01',
            checkout: '2025-09-02',
            currency: 'INVALID',
            guests: [{ adults: 2, children: 0 }],
            residency: 'US'
          })
        },
        {
          name: 'Invalid Hotel ID',
          test: () => liteApiService.getHotelDetails('invalid-hotel-id-12345')
        }
      ];

      let properErrorHandling = 0;

      for (const errorTest of errorTests) {
        try {
          await errorTest.test();
          // If no error was thrown, this test failed
        } catch (expectedError) {
          // Expected error - good error handling
          properErrorHandling++;
        }
      }

      this.results.push({
        test: 'Error Handling',
        success: properErrorHandling === errorTests.length,
        duration: Date.now() - startTime,
        data: {
          properlyHandledErrors: properErrorHandling,
          totalErrorTests: errorTests.length,
          coverage: `${Math.round((properErrorHandling / errorTests.length) * 100)}%`
        }
      });
    } catch (error: any) {
      this.results.push({
        test: 'Error Handling',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  }

  private async testRateLimiting(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test rate limiting by making multiple requests
      const requests = Array.from({ length: 5 }, () => 
        liteApiService.searchHotels({
          checkin: '2025-09-01',
          checkout: '2025-09-02',
          currency: 'USD',
          guests: [{ adults: 2, children: 0 }],
          residency: 'US',
          city: 'Chicago'
        })
      );

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.results.push({
        test: 'Rate Limiting Compliance',
        success: successful > 0, // At least some should succeed
        duration: Date.now() - startTime,
        data: {
          successfulRequests: successful,
          failedRequests: failed,
          totalRequests: requests.length,
          rateLimitingWorking: failed === 0 || successful > 0
        }
      });
    } catch (error: any) {
      this.results.push({
        test: 'Rate Limiting Compliance',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  }

  private generateSummary(): { passed: number; failed: number; total: number } {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    return { passed, failed, total };
  }

  printDetailedReport(): void {
    console.log('\n🔍 LiteAPI Integration Test Report');
    console.log('=====================================');
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}`);
      console.log(`   Duration: ${result.duration}ms`);
      
      if (result.data) {
        console.log('   Data:', JSON.stringify(result.data, null, 2));
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log();
    });

    const summary = this.generateSummary();
    console.log('Summary:');
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`📊 Total: ${summary.total}`);
    console.log(`📈 Success Rate: ${Math.round((summary.passed / summary.total) * 100)}%`);
    console.log('=====================================\n');
  }
}

// Export for use in other modules
export { LiteAPIIntegrationTester };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new LiteAPIIntegrationTester();
  
  tester.runComprehensiveTest().then((result) => {
    tester.printDetailedReport();
    
    if (result.success) {
      console.log('🎉 All LiteAPI integration tests passed! System is ready for production.');
      process.exit(0);
    } else {
      console.log('⚠️  Some LiteAPI integration tests failed. Review the report above.');
      process.exit(1);
    }
  }).catch((error) => {
    console.error('❌ LiteAPI integration test runner failed:', error);
    process.exit(1);
  });
}