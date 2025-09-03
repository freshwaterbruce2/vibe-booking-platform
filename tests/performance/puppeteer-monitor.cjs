const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * ADVANCED PUPPETEER PERFORMANCE MONITORING
 * Deep performance analysis of the live hotel booking platform
 * URL: https://vibe-booking-platform.netlify.app/
 */

class HotelBookingMonitor {
  constructor() {
    this.baseUrl = 'https://vibe-booking-platform.netlify.app/';
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {},
    };
  }

  async initialize() {
    console.log('🚀 Initializing Puppeteer Performance Monitor...');

    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      devtools: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });

    this.page = await this.browser.newPage();

    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Monitor network activity
    this.networkRequests = [];
    this.page.on('request', (request) => {
      this.networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
      });
    });

    // Monitor console messages
    this.consoleMessages = [];
    this.page.on('console', (msg) => {
      this.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
      });
    });

    console.log('✅ Puppeteer initialized successfully');
  }

  async measurePageLoad() {
    console.log('⚡ Measuring page load performance...');

    const startTime = Date.now();

    // Navigate and measure metrics
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

    const loadTime = Date.now() - startTime;

    // Get performance metrics
    const metrics = await this.page.metrics();
    const performanceEntries = await this.page.evaluate(() => {
      return JSON.stringify(window.performance.getEntriesByType('navigation')[0]);
    });

    const navigation = JSON.parse(performanceEntries);

    const result = {
      test: 'page_load_performance',
      loadTime,
      metrics: {
        JSHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024), // MB
        JSHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024), // MB
        domContentLoaded: Math.round(
          navigation.domContentLoadedEventEnd - navigation.navigationStart,
        ),
        firstPaint: Math.round(navigation.responseEnd - navigation.navigationStart),
        scriptDuration: Math.round(metrics.ScriptDuration * 1000), // ms
        layoutDuration: Math.round(metrics.LayoutDuration * 1000), // ms
      },
      networkRequests: this.networkRequests.length,
      status: loadTime < 3000 ? 'PASS' : 'WARN',
    };

    this.results.tests.push(result);

    console.log(`⚡ Page loaded in ${loadTime}ms`);
    console.log(
      `📊 JS Heap: ${result.metrics.JSHeapUsedSize}MB used / ${result.metrics.JSHeapTotalSize}MB total`,
    );
    console.log(`🌐 Network requests: ${result.networkRequests}`);

    return result;
  }

  async measureSearchPerformance() {
    console.log('🔍 Measuring search performance...');

    const testDestinations = ['Paris', 'New York', 'Tokyo', 'London', 'Dubai', 'Singapore'];

    const searchResults = [];

    for (const destination of testDestinations) {
      console.log(`🌍 Testing search for: ${destination}`);

      // Clear previous search
      await this.page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="City, hotel, landmark"]');
        if (input) input.value = '';
      });

      const startTime = Date.now();
      const requestCountBefore = this.networkRequests.length;

      // Perform search
      await this.page.type('input[placeholder*="City, hotel, landmark"]', destination);
      await this.page.click('button:has-text("Search Hotels")');

      // Wait for results
      try {
        await this.page.waitForSelector('.group, .bg-white.rounded', { timeout: 10000 });

        const searchTime = Date.now() - startTime;
        const newRequests = this.networkRequests.length - requestCountBefore;

        // Count hotel cards
        const hotelCount = await this.page.evaluate(() => {
          return document.querySelectorAll('.group, .bg-white.rounded').length;
        });

        // Extract performance data
        const performance = await this.page.evaluate(() => {
          return window.performance
            .getEntriesByType('resource')
            .filter((entry) => entry.name.includes('api') || entry.name.includes('liteapi'))
            .map((entry) => ({
              url: entry.name,
              duration: Math.round(entry.duration),
              size: entry.transferSize,
            }));
        });

        const result = {
          destination,
          searchTime,
          hotelCount,
          apiRequests: performance,
          networkRequests: newRequests,
          status: searchTime < 2000 && hotelCount > 0 ? 'PASS' : 'WARN',
        };

        searchResults.push(result);

        console.log(
          `✅ ${destination}: ${searchTime}ms, ${hotelCount} hotels, ${newRequests} requests`,
        );

        // Brief pause between searches
        await this.page.waitForTimeout(1000);
      } catch (error) {
        console.log(`❌ ${destination}: Search failed - ${error.message}`);
        searchResults.push({
          destination,
          status: 'FAIL',
          error: error.message,
        });
      }
    }

    const testResult = {
      test: 'search_performance',
      results: searchResults,
      avgSearchTime:
        searchResults.filter((r) => r.searchTime).reduce((sum, r) => sum + r.searchTime, 0) /
        searchResults.filter((r) => r.searchTime).length,
      totalHotelsFound: searchResults.reduce((sum, r) => sum + (r.hotelCount || 0), 0),
      successRate: (
        (searchResults.filter((r) => r.status === 'PASS').length / searchResults.length) *
        100
      ).toFixed(1),
    };

    this.results.tests.push(testResult);

    console.log(`📊 Average search time: ${Math.round(testResult.avgSearchTime)}ms`);
    console.log(`🏨 Total hotels found: ${testResult.totalHotelsFound}`);
    console.log(`✅ Success rate: ${testResult.successRate}%`);

    return testResult;
  }

  async measureMobilePerformance() {
    console.log('📱 Testing mobile performance...');

    // Switch to mobile viewport
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.reload({ waitUntil: 'networkidle2' });

    const startTime = Date.now();

    // Test mobile search
    await this.page.type('input[placeholder*="City, hotel, landmark"]', 'Barcelona');
    await this.page.click('button:has-text("Search Hotels")');

    try {
      await this.page.waitForSelector('.group, .bg-white.rounded', { timeout: 10000 });

      const mobileSearchTime = Date.now() - startTime;
      const mobileHotels = await this.page.evaluate(() => {
        return document.querySelectorAll('.group, .bg-white.rounded').length;
      });

      // Check mobile-specific elements
      const mobileFeatures = await this.page.evaluate(() => {
        return {
          hasHamburgerMenu: !!document.querySelector('[aria-label*="menu"], .hamburger'),
          hasResponsiveLayout: !!document.querySelector('.sm\\:hidden, .md\\:block, .lg\\:flex'),
          cardStacksProperly: document.querySelectorAll('.flex-col').length > 0,
        };
      });

      const result = {
        test: 'mobile_performance',
        searchTime: mobileSearchTime,
        hotelCount: mobileHotels,
        features: mobileFeatures,
        status: mobileSearchTime < 3000 && mobileHotels > 0 ? 'PASS' : 'WARN',
      };

      this.results.tests.push(result);

      console.log(`📱 Mobile search: ${mobileSearchTime}ms, ${mobileHotels} hotels`);
      console.log(`📱 Mobile features:`, mobileFeatures);

      // Return to desktop
      await this.page.setViewport({ width: 1920, height: 1080 });

      return result;
    } catch (error) {
      console.log(`❌ Mobile test failed: ${error.message}`);
      return { test: 'mobile_performance', status: 'FAIL', error: error.message };
    }
  }

  async measureLiteAPIIntegration() {
    console.log('🔗 Testing LiteAPI integration...');

    // Monitor API calls specifically
    const apiCalls = [];

    this.page.on('response', async (response) => {
      if (response.url().includes('liteapi') || response.url().includes('/api/hotels')) {
        try {
          const responseBody = await response.text();
          apiCalls.push({
            url: response.url(),
            status: response.status(),
            contentLength: responseBody.length,
            timing: response.timing(),
            hasData: responseBody.length > 100,
          });
        } catch (e) {
          apiCalls.push({
            url: response.url(),
            status: response.status(),
            error: 'Could not read response body',
          });
        }
      }
    });

    // Test multiple destinations to verify API consistency
    const destinations = ['Miami', 'Los Angeles', 'Chicago'];
    const apiResults = [];

    for (const dest of destinations) {
      console.log(`🌐 Testing API for: ${dest}`);

      await this.page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="City, hotel, landmark"]');
        if (input) input.value = '';
      });

      await this.page.type('input[placeholder*="City, hotel, landmark"]', dest);
      await this.page.click('button:has-text("Search Hotels")');

      await this.page.waitForTimeout(3000); // Give time for API calls

      const destApiCalls = apiCalls.filter(
        (call) => call.url && !apiResults.some((prev) => prev.calls.includes(call)),
      );

      apiResults.push({
        destination: dest,
        calls: destApiCalls,
        hasRealData: destApiCalls.some((call) => call.hasData && call.status === 200),
      });
    }

    const result = {
      test: 'liteapi_integration',
      results: apiResults,
      totalApiCalls: apiCalls.length,
      successfulCalls: apiCalls.filter((call) => call.status === 200).length,
      realDataPercentage: (
        (apiResults.filter((r) => r.hasRealData).length / apiResults.length) *
        100
      ).toFixed(1),
      status: apiCalls.length > 0 && apiCalls.some((call) => call.status === 200) ? 'PASS' : 'WARN',
    };

    this.results.tests.push(result);

    console.log(`🔗 API calls made: ${result.totalApiCalls}`);
    console.log(`✅ Successful calls: ${result.successfulCalls}`);
    console.log(`📊 Real data percentage: ${result.realDataPercentage}%`);

    return result;
  }

  async generateReport() {
    console.log('📄 Generating performance report...');

    // Calculate summary metrics
    const passedTests = this.results.tests.filter((t) => t.status === 'PASS').length;
    const totalTests = this.results.tests.length;

    this.results.summary = {
      totalTests,
      passedTests,
      successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
      totalConsoleMessages: this.consoleMessages.length,
      errors: this.consoleMessages.filter((m) => m.type === 'error').length,
      warnings: this.consoleMessages.filter((m) => m.type === 'warning').length,
      networkRequests: this.networkRequests.length,
    };

    // Save detailed report
    const reportPath = './tests/performance/performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Generate human-readable summary
    const summary = `
🚀 HOTEL BOOKING PLATFORM - PERFORMANCE ANALYSIS REPORT
Generated: ${this.results.timestamp}
Live Site: https://vibe-booking-platform.netlify.app/

📊 OVERALL RESULTS:
✅ Tests Passed: ${passedTests}/${totalTests} (${this.results.summary.successRate})
🌐 Network Requests: ${this.results.summary.networkRequests}
⚠️  Console Errors: ${this.results.summary.errors}
⚠️  Console Warnings: ${this.results.summary.warnings}

🔍 DETAILED RESULTS:
${this.results.tests
  .map(
    (test) => `
📝 ${test.test.toUpperCase().replace(/_/g, ' ')}:
   Status: ${test.status}
   ${this.formatTestDetails(test)}
`,
  )
  .join('\n')}

🎯 RECOMMENDATIONS:
${this.generateRecommendations()}

📁 Full report saved to: ${reportPath}
    `;

    console.log(summary);

    const summaryPath = './tests/performance/performance-summary.txt';
    fs.writeFileSync(summaryPath, summary);

    return this.results;
  }

  formatTestDetails(test) {
    switch (test.test) {
      case 'page_load_performance':
        return `Load Time: ${test.loadTime}ms
   JS Heap Used: ${test.metrics.JSHeapUsedSize}MB
   DOM Content Loaded: ${test.metrics.domContentLoaded}ms`;

      case 'search_performance':
        return `Average Search Time: ${Math.round(test.avgSearchTime)}ms
   Total Hotels Found: ${test.totalHotelsFound}
   Success Rate: ${test.successRate}%`;

      case 'mobile_performance':
        return `Mobile Search Time: ${test.searchTime}ms
   Mobile Hotels Found: ${test.hotelCount}`;

      case 'liteapi_integration':
        return `API Calls Made: ${test.totalApiCalls}
   Successful API Calls: ${test.successfulCalls}
   Real Data Percentage: ${test.realDataPercentage}%`;

      default:
        return 'See detailed report for more information';
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // Check for performance issues
    const pageLoadTest = this.results.tests.find((t) => t.test === 'page_load_performance');
    if (pageLoadTest && pageLoadTest.loadTime > 3000) {
      recommendations.push('🚀 Consider optimizing page load time (currently > 3s)');
    }

    // Check console errors
    if (this.results.summary.errors > 0) {
      recommendations.push('🐛 Address console errors for better stability');
    }

    // Check search performance
    const searchTest = this.results.tests.find((t) => t.test === 'search_performance');
    if (searchTest && searchTest.avgSearchTime > 2000) {
      recommendations.push('⚡ Optimize search performance (currently > 2s average)');
    }

    // Check API integration
    const apiTest = this.results.tests.find((t) => t.test === 'liteapi_integration');
    if (apiTest && parseFloat(apiTest.realDataPercentage) < 80) {
      recommendations.push('🔗 Improve API data consistency (< 80% real data)');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All systems performing well! No critical issues detected.');
    }

    return recommendations.join('\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Cleanup completed');
  }
}

// Main execution
async function runPerformanceMonitoring() {
  const monitor = new HotelBookingMonitor();

  try {
    await monitor.initialize();

    console.log('🎯 Starting comprehensive performance analysis...\n');

    await monitor.measurePageLoad();
    await monitor.measureSearchPerformance();
    await monitor.measureMobilePerformance();
    await monitor.measureLiteAPIIntegration();

    const results = await monitor.generateReport();

    console.log('\n✅ Performance monitoring completed successfully!');
    console.log('📊 Check the generated reports for detailed analysis.');

    return results;
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
    throw error;
  } finally {
    await monitor.cleanup();
  }
}

// Export for use in other scripts
module.exports = { HotelBookingMonitor, runPerformanceMonitoring };

// Run if called directly
if (require.main === module) {
  runPerformanceMonitoring()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}
