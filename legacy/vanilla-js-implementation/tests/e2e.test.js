const { test, expect, chromium, firefox, webkit } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_URL = 'http://localhost:3001';
const TIMEOUT = 30000;

// Test data
const testSearchData = {
  destination: 'Las Vegas, NV',
  purpose: 'Fun golf trip with friends',
  checkinDays: 1, // Days from today
  checkoutDays: 3, // Days from today
  adults: 2,
  children: 0,
  rooms: 1
};

const testGuestData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
};

describe('Hotel Booking End-to-End Tests', () => {
  let browser;
  let context;
  let page;
  let server;
  
  beforeAll(async () => {
    // Start the application server for testing
    await startTestServer();
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create browser context with specific settings
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      geolocation: { latitude: 40.7128, longitude: -74.0060 }, // New York
    });
  });
  
  afterAll(async () => {
    if (context) await context.close();
    if (browser) await browser.close();
    if (server) server.kill();
  });
  
  beforeEach(async () => {
    page = await context.newPage();
    
    // Set up console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });
    
    // Handle page errors
    page.on('pageerror', error => {
      console.log('Page Error:', error.message);
    });
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });

  describe('Initial Page Load and Navigation', () => {
    test('should load the homepage successfully', async () => {
      await page.goto(TEST_URL);
      
      // Check page title
      await expect(page).toHaveTitle(/HotelFinder.*AI-Powered Hotel Booking/);
      
      // Check main elements are present
      await expect(page.locator('h1')).toContainText('HotelFinder');
      await expect(page.locator('.hero-title')).toContainText('Find Your Perfect Stay');
      await expect(page.locator('#searchForm')).toBeVisible();
      
      // Check navigation elements
      await expect(page.locator('.nav-link').first()).toContainText('Search');
    });
    
    test('should have proper meta tags for SEO', async () => {
      await page.goto(TEST_URL);
      
      // Check SEO meta tags
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toContain('hotel booking');
      
      const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
      expect(keywords).toContain('hotel booking');
      
      // Check Open Graph tags
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(ogTitle).toContain('HotelFinder');
    });
    
    test('should load all critical resources', async () => {
      const response = await page.goto(TEST_URL);
      expect(response?.status()).toBe(200);
      
      // Check that CSS is loaded
      const cssLoaded = await page.evaluate(() => {
        const styleSheets = document.styleSheets;
        return styleSheets.length > 0;
      });
      expect(cssLoaded).toBe(true);
      
      // Check that JavaScript is working
      const jsWorking = await page.evaluate(() => {
        return typeof window.fetch === 'function';
      });
      expect(jsWorking).toBe(true);
    });
  });

  describe('Hotel Search Workflow', () => {
    test('should complete a full hotel search workflow', async () => {
      await page.goto(TEST_URL);
      
      // Fill in the search form
      await page.fill('#destination', testSearchData.destination);
      await page.fill('#purpose', testSearchData.purpose);
      
      // Set dates (calculate from today)
      const today = new Date();
      const checkin = new Date(today);
      checkin.setDate(today.getDate() + testSearchData.checkinDays);
      const checkout = new Date(today);
      checkout.setDate(today.getDate() + testSearchData.checkoutDays);
      
      await page.fill('#checkin', checkin.toISOString().split('T')[0]);
      await page.fill('#checkout', checkout.toISOString().split('T')[0]);
      
      // Configure guests and rooms
      await page.click('.guests-selector');
      
      // Adjust adults count
      for (let i = 1; i < testSearchData.adults; i++) {
        await page.click('[onclick="changeCount(\'adults\', 1)"]');
      }
      
      // Close guests dropdown
      await page.click('.guests-selector');
      
      // Select environment
      await page.selectOption('#environment', 'sandbox');
      
      // Submit search
      await page.click('.search-btn');
      
      // Wait for results to load
      await page.waitForSelector('#funnyResponseText', { timeout: TIMEOUT });
      
      // Verify funny response is displayed
      const funnyResponse = await page.locator('#funnyResponseText').textContent();
      expect(funnyResponse).toBeTruthy();
      expect(funnyResponse.length).toBeGreaterThan(0);
      
      // Wait for search results
      await page.waitForSelector('#resultsSection', { state: 'visible', timeout: TIMEOUT });
      
      // Check if results are displayed (could be hotels or "no results")
      const resultsSection = page.locator('#resultsSection');
      await expect(resultsSection).toBeVisible();
      
      // Check results title
      const resultsTitle = await page.locator('#resultsTitle').textContent();
      expect(resultsTitle).toBeTruthy();
    });
    
    test('should handle search form validation', async () => {
      await page.goto(TEST_URL);
      
      // Try to submit empty form
      await page.click('.search-btn');
      
      // Check for HTML5 validation or custom validation messages
      const destinationValidity = await page.evaluate(() => {
        const input = document.getElementById('destination');
        return input.checkValidity();
      });
      
      expect(destinationValidity).toBe(false);
    });
    
    test('should update guests display correctly', async () => {
      await page.goto(TEST_URL);
      
      // Open guests dropdown
      await page.click('.guests-selector');
      
      // Increase adults
      await page.click('[onclick="changeCount(\'adults\', 1)"]');
      await page.click('[onclick="changeCount(\'adults\', 1)"]');
      
      // Increase children
      await page.click('[onclick="changeCount(\'children\', 1)"]');
      
      // Increase rooms
      await page.click('[onclick="changeCount(\'rooms\', 1)"]');
      
      // Check display is updated
      const guestsDisplay = await page.locator('#guestsDisplay').textContent();
      expect(guestsDisplay).toContain('3 Adults');
      expect(guestsDisplay).toContain('1 Child');
      expect(guestsDisplay).toContain('2 Rooms');
    });
  });

  describe('User Interface Interactions', () => {
    test('should toggle theme correctly', async () => {
      await page.goto(TEST_URL);
      
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.body.classList.contains('theme-purple');
      });
      
      // Click theme toggle
      await page.click('.theme-toggle');
      
      // Check theme changed
      const newTheme = await page.evaluate(() => {
        return document.body.classList.contains('theme-purple');
      });
      
      expect(newTheme).toBe(!initialTheme);
      
      // Check localStorage is updated
      const savedTheme = await page.evaluate(() => {
        return localStorage.getItem('theme');
      });
      
      expect(savedTheme).toBeTruthy();
    });
    
    test('should handle responsive design on mobile', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(TEST_URL);
      
      // Check that mobile layout is applied
      const searchForm = page.locator('.search-form');
      await expect(searchForm).toBeVisible();
      
      // Check that navigation is mobile-friendly
      const nav = page.locator('.nav');
      await expect(nav).toBeVisible();
      
      // Test form interactions on mobile
      await page.fill('#destination', 'Paris, France');
      await page.click('.guests-selector');
      
      const guestsDropdown = page.locator('#guestsDropdown');
      await expect(guestsDropdown).toBeVisible();
    });
    
    test('should close dropdowns when clicking outside', async () => {
      await page.goto(TEST_URL);
      
      // Open guests dropdown
      await page.click('.guests-selector');
      await expect(page.locator('#guestsDropdown')).toBeVisible();
      
      // Click outside
      await page.click('body');
      
      // Check dropdown is closed
      const dropdown = page.locator('#guestsDropdown');
      const isVisible = await dropdown.isVisible();
      expect(isVisible).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      await page.goto(TEST_URL);
      
      // Block network requests to simulate offline
      await page.route('**/api/search-hotels**', route => {
        route.abort('internetdisconnected');
      });
      
      // Fill and submit form
      await page.fill('#destination', 'Test City');
      await page.click('.search-btn');
      
      // Wait for error handling
      await page.waitForTimeout(2000);
      
      // Check for error message or handling
      const funnyResponse = await page.locator('#funnyResponseText').textContent();
      expect(funnyResponse).toContain('connect' || 'server' || 'error');
    });
    
    test('should handle API errors gracefully', async () => {
      await page.goto(TEST_URL);
      
      // Mock API error response
      await page.route('**/api/search-hotels**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Perform search
      await page.fill('#destination', 'Error City');
      await page.click('.search-btn');
      
      // Wait for error handling
      await page.waitForTimeout(2000);
      
      // Check error is displayed appropriately
      const resultsSection = page.locator('#resultsSection');
      await expect(resultsSection).toBeVisible();
      
      const resultsTitle = await page.locator('#resultsTitle').textContent();
      expect(resultsTitle).toContain('wrong' || 'error' || 'problem');
    });
  });

  describe('Performance and Core Web Vitals', () => {
    test('should meet Core Web Vitals thresholds', async () => {
      await page.goto(TEST_URL);
      
      // Measure Largest Contentful Paint (LCP)
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });
      
      // LCP should be under 2.5 seconds (2500ms)
      if (lcp > 0) {
        expect(lcp).toBeLessThan(2500);
      }
      
      // Measure First Input Delay (FID) simulation
      const interactionTime = await page.evaluate(() => {
        const start = performance.now();
        document.getElementById('destination').focus();
        return performance.now() - start;
      });
      
      // Should respond to interactions quickly
      expect(interactionTime).toBeLessThan(100);
      
      // Measure Cumulative Layout Shift (CLS)
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          });
          observer.observe({ entryTypes: ['layout-shift'] });
          
          setTimeout(() => resolve(clsValue), 2000);
        });
      });
      
      // CLS should be under 0.1
      expect(cls).toBeLessThan(0.1);
    });
    
    test('should load page resources efficiently', async () => {
      const startTime = Date.now();
      
      await page.goto(TEST_URL);
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check resource loading
      const resourcesCount = await page.evaluate(() => {
        return performance.getEntriesByType('resource').length;
      });
      
      expect(resourcesCount).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('should be navigable with keyboard', async () => {
      await page.goto(TEST_URL);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Should focus first interactive element
      
      const focusedElement = await page.evaluate(() => {
        return document.activeElement.tagName;
      });
      
      expect(['INPUT', 'BUTTON', 'A', 'SELECT'].includes(focusedElement)).toBe(true);
      
      // Test Enter key on search button
      await page.focus('.search-btn');
      await page.keyboard.press('Enter');
      
      // Should trigger search
      await page.waitForTimeout(1000);
    });
    
    test('should have proper ARIA attributes', async () => {
      await page.goto(TEST_URL);
      
      // Check guests dropdown has proper ARIA attributes
      const guestsSelector = page.locator('.guests-selector');
      
      const ariaHaspopup = await guestsSelector.getAttribute('aria-haspopup');
      expect(ariaHaspopup).toBe('true');
      
      const ariaExpanded = await guestsSelector.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('false');
      
      // Check form labels
      const labels = await page.locator('label').count();
      expect(labels).toBeGreaterThan(0);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    const browsers = [chromium, firefox, webkit];
    const browserNames = ['Chromium', 'Firefox', 'WebKit'];
    
    browsers.forEach((browserType, index) => {
      test(`should work correctly in ${browserNames[index]}`, async () => {
        const testBrowser = await browserType.launch({ headless: true });
        const testContext = await testBrowser.newContext();
        const testPage = await testContext.newPage();
        
        try {
          await testPage.goto(TEST_URL);
          
          // Basic functionality test
          await testPage.fill('#destination', 'Cross-browser test');
          await testPage.click('.search-btn');
          
          // Check page responds
          await testPage.waitForTimeout(2000);
          
          const title = await testPage.title();
          expect(title).toContain('HotelFinder');
          
        } finally {
          await testPage.close();
          await testContext.close();
          await testBrowser.close();
        }
      });
    });
  });
});

// Helper functions
async function startTestServer() {
  return new Promise((resolve, reject) => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.OPEN_API_KEY = 'test-key';
    process.env.SAND_API_KEY = 'test-key';
    process.env.PROD_API_KEY = 'test-key';
    
    const serverPath = path.join(__dirname, '../server/server.js');
    const server = spawn('node', [serverPath], {
      env: { ...process.env },
      stdio: 'pipe'
    });
    
    server.stdout.on('data', (data) => {
      if (data.toString().includes('started on port')) {
        resolve(server);
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });
    
    server.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 10000);
  });
}

// Configuration for Playwright
module.exports = {
  timeout: TIMEOUT,
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...require('@playwright/test').devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...require('@playwright/test').devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...require('@playwright/test').devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...require('@playwright/test').devices['iPhone 12'] },
    },
  ],
};
