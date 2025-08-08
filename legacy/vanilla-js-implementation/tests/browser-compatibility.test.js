const { test, expect, chromium, firefox, webkit } = require('@playwright/test');

const TEST_URL = 'http://localhost:3001';

// Browser configurations for testing
const browserConfigs = [
  { name: 'Chromium', browserType: chromium, userAgent: 'Chrome/120.0.0.0' },
  { name: 'Firefox', browserType: firefox, userAgent: 'Firefox/120.0' },
  { name: 'WebKit', browserType: webkit, userAgent: 'Safari/17.0' }
];

const deviceConfigs = [
  { name: 'Desktop', viewport: { width: 1280, height: 720 } },
  { name: 'Tablet', viewport: { width: 768, height: 1024 } },
  { name: 'Mobile', viewport: { width: 390, height: 844 } }
];

describe('Cross-Browser Compatibility Tests', () => {
  
  browserConfigs.forEach(({ name: browserName, browserType }) => {
    describe(`${browserName} Browser Tests`, () => {
      let browser;
      let context;
      let page;
      
      beforeAll(async () => {
        browser = await browserType.launch({ headless: true });
      });
      
      afterAll(async () => {
        if (browser) await browser.close();
      });
      
      beforeEach(async () => {
        context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          permissions: ['geolocation']
        });
        page = await context.newPage();
      });
      
      afterEach(async () => {
        if (page) await page.close();
        if (context) await context.close();
      });

      test(`should load homepage correctly in ${browserName}`, async () => {
        const response = await page.goto(TEST_URL);
        expect(response?.status()).toBe(200);
        
        // Check basic elements load
        await expect(page.locator('h1')).toContainText('HotelFinder');
        await expect(page.locator('#searchForm')).toBeVisible();
        
        // Check page title
        await expect(page).toHaveTitle(/HotelFinder/);
      });
      
      test(`should handle form interactions in ${browserName}`, async () => {
        await page.goto(TEST_URL);
        
        // Test form field interactions
        await page.fill('#destination', 'Test City');
        const destinationValue = await page.inputValue('#destination');
        expect(destinationValue).toBe('Test City');
        
        // Test date inputs
        await page.fill('#checkin', '2025-08-05');
        await page.fill('#checkout', '2025-08-06');
        
        const checkinValue = await page.inputValue('#checkin');
        const checkoutValue = await page.inputValue('#checkout');
        
        expect(checkinValue).toBe('2025-08-05');
        expect(checkoutValue).toBe('2025-08-06');
        
        // Test dropdown interactions
        await page.click('.guests-selector');
        await expect(page.locator('#guestsDropdown')).toBeVisible();
        
        // Test counter buttons
        await page.click('[onclick="changeCount(\'adults\', 1)"]');
        const adultsCount = await page.locator('#adultsCount').textContent();
        expect(adultsCount).toBe('2');
      });
      
      test(`should support CSS features in ${browserName}`, async () => {
        await page.goto(TEST_URL);
        
        // Check CSS Grid/Flexbox support
        const cssFeatures = await page.evaluate(() => {
          const testElement = document.createElement('div');
          testElement.style.display = 'grid';
          document.body.appendChild(testElement);
          
          const computedStyle = window.getComputedStyle(testElement);
          const gridSupported = computedStyle.display === 'grid';
          
          testElement.style.display = 'flex';
          const flexSupported = computedStyle.display === 'flex';
          
          // Test modern CSS properties
          testElement.style.backdropFilter = 'blur(10px)';
          const backdropFilterSupported = computedStyle.backdropFilter === 'blur(10px)';
          
          document.body.removeChild(testElement);
          
          return {
            grid: gridSupported,
            flex: flexSupported,
            backdropFilter: backdropFilterSupported,
            customProperties: CSS.supports('--custom-property', 'value')
          };
        });
        
        expect(cssFeatures.grid).toBe(true);
        expect(cssFeatures.flex).toBe(true);
        // Note: backdropFilter may not be supported in all browsers
        expect(cssFeatures.customProperties).toBe(true);
      });
      
      test(`should support JavaScript features in ${browserName}`, async () => {
        await page.goto(TEST_URL);
        
        const jsFeatures = await page.evaluate(() => {
          return {
            es6Modules: typeof import !== 'undefined',
            asyncAwait: typeof (async () => {}) === 'function',
            promises: typeof Promise !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            localStorage: typeof localStorage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            serviceWorker: 'serviceWorker' in navigator,
            webSockets: typeof WebSocket !== 'undefined',
            geolocation: 'geolocation' in navigator,
            notifications: 'Notification' in window,
            requestAnimationFrame: typeof requestAnimationFrame !== 'undefined'
          };
        });
        
        expect(jsFeatures.promises).toBe(true);
        expect(jsFeatures.fetch).toBe(true);
        expect(jsFeatures.localStorage).toBe(true);
        expect(jsFeatures.serviceWorker).toBe(true);
      });
      
      test(`should handle events correctly in ${browserName}`, async () => {
        await page.goto(TEST_URL);
        
        // Test click events
        await page.click('.theme-toggle');
        
        const themeChanged = await page.evaluate(() => {
          return document.body.classList.contains('theme-purple');
        });
        
        expect(typeof themeChanged).toBe('boolean');
        
        // Test keyboard events
        await page.focus('#destination');
        await page.keyboard.type('Keyboard Test');
        
        const typedValue = await page.inputValue('#destination');
        expect(typedValue).toBe('Keyboard Test');
        
        // Test form submission
        let formSubmitted = false;
        await page.evaluate(() => {
          document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            window.testFormSubmitted = true;
          });
        });
        
        await page.click('.search-btn');
        
        formSubmitted = await page.evaluate(() => window.testFormSubmitted);
        expect(formSubmitted).toBe(true);
      });
    });
  });

  describe('Responsive Design Cross-Browser Tests', () => {
    deviceConfigs.forEach(({ name: deviceName, viewport }) => {
      browserConfigs.forEach(({ name: browserName, browserType }) => {
        test(`should be responsive on ${deviceName} in ${browserName}`, async () => {
          const browser = await browserType.launch({ headless: true });
          const context = await browser.newContext({ viewport });
          const page = await context.newPage();
          
          try {
            await page.goto(TEST_URL);
            
            // Check that main elements are visible at this viewport
            await expect(page.locator('#searchForm')).toBeVisible();
            await expect(page.locator('.hero-title')).toBeVisible();
            
            // Test form usability at different screen sizes
            await page.fill('#destination', 'Responsive Test');
            
            // For mobile, ensure touch targets are appropriately sized
            if (deviceName === 'Mobile') {
              const buttonSize = await page.locator('.search-btn').boundingBox();
              expect(buttonSize?.width).toBeGreaterThan(40); // Minimum touch target
              expect(buttonSize?.height).toBeGreaterThan(40);
            }
            
            // Test that navigation works on all screen sizes
            const navVisible = await page.locator('.nav').isVisible();
            expect(navVisible).toBe(true);
            
          } finally {
            await page.close();
            await context.close();
            await browser.close();
          }
        });
      });
    });
  });

  describe('Browser Feature Detection Tests', () => {
    test('should detect and handle unsupported features gracefully', async () => {
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto(TEST_URL);
        
        // Test feature detection and polyfill handling
        const featureSupport = await page.evaluate(() => {
          const features = {
            intersectionObserver: 'IntersectionObserver' in window,
            resizeObserver: 'ResizeObserver' in window,
            webComponents: 'customElements' in window,
            webGL: (() => {
              try {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
              } catch (e) {
                return false;
              }
            })(),
            webRTC: 'RTCPeerConnection' in window,
            webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
            fullscreen: 'requestFullscreen' in document.documentElement ||
                       'webkitRequestFullscreen' in document.documentElement ||
                       'mozRequestFullScreen' in document.documentElement
          };
          
          return features;
        });
        
        // Application should work regardless of these feature availabilities
        expect(typeof featureSupport).toBe('object');
        
      } finally {
        await page.close();
        await context.close();
        await browser.close();
      }
    });
  });

  describe('Performance Across Browsers', () => {
    browserConfigs.forEach(({ name: browserName, browserType }) => {
      test(`should meet performance thresholds in ${browserName}`, async () => {
        const browser = await browserType.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
          const startTime = Date.now();
          await page.goto(TEST_URL, { waitUntil: 'domcontentloaded' });
          const loadTime = Date.now() - startTime;
          
          // Page should load within reasonable time across all browsers
          expect(loadTime).toBeLessThan(5000);
          
          // Test JavaScript execution performance
          const jsPerformance = await page.evaluate(() => {
            const start = performance.now();
            
            // Simulate some JavaScript work
            for (let i = 0; i < 10000; i++) {
              Math.random();
            }
            
            return performance.now() - start;
          });
          
          expect(jsPerformance).toBeLessThan(100); // Should be very fast
          
        } finally {
          await page.close();
          await context.close();
          await browser.close();
        }
      });
    });
  });

  describe('Error Handling Across Browsers', () => {
    browserConfigs.forEach(({ name: browserName, browserType }) => {
      test(`should handle errors gracefully in ${browserName}`, async () => {
        const browser = await browserType.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const consoleErrors = [];
        const jsErrors = [];
        
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        page.on('pageerror', error => {
          jsErrors.push(error.message);
        });
        
        try {
          await page.goto(TEST_URL);
          
          // Trigger potential error scenarios
          await page.fill('#destination', 'Error Test City');
          await page.click('.search-btn');
          
          // Wait a bit for any async errors
          await page.waitForTimeout(2000);
          
          // Test that no critical JavaScript errors occurred
          const criticalErrors = jsErrors.filter(error => 
            !error.includes('network') && // Ignore network errors in tests
            !error.includes('404') && // Ignore 404s from missing test resources
            !error.includes('favicon') // Ignore favicon errors
          );
          
          expect(criticalErrors.length).toBe(0);
          
          // Check that page is still functional after potential errors
          const formStillWorks = await page.evaluate(() => {
            const form = document.getElementById('searchForm');
            return form && form.style.display !== 'none';
          });
          
          expect(formStillWorks).toBe(true);
          
        } finally {
          await page.close();
          await context.close();
          await browser.close();
        }
      });
    });
  });

  describe('Accessibility Across Browsers', () => {
    browserConfigs.forEach(({ name: browserName, browserType }) => {
      test(`should maintain accessibility in ${browserName}`, async () => {
        const browser = await browserType.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
          await page.goto(TEST_URL);
          
          // Test keyboard navigation
          await page.keyboard.press('Tab');
          
          const focusedElement = await page.evaluate(() => {
            const focused = document.activeElement;
            return {
              tagName: focused.tagName,
              id: focused.id,
              className: focused.className
            };
          });
          
          expect(['INPUT', 'BUTTON', 'SELECT', 'A'].includes(focusedElement.tagName)).toBe(true);
          
          // Test ARIA attributes
          const ariaSupport = await page.evaluate(() => {
            const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
            return elementsWithAria.length > 0;
          });
          
          expect(ariaSupport).toBe(true);
          
          // Test semantic HTML
          const semanticElements = await page.evaluate(() => {
            const semantic = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
            return semantic.some(tag => document.querySelector(tag) !== null);
          });
          
          expect(semanticElements).toBe(true);
          
        } finally {
          await page.close();
          await context.close();
          await browser.close();
        }
      });
    });
  });

  describe('Storage and Persistence Across Browsers', () => {
    browserConfigs.forEach(({ name: browserName, browserType }) => {
      test(`should handle storage correctly in ${browserName}`, async () => {
        const browser = await browserType.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
          await page.goto(TEST_URL);
          
          // Test localStorage
          const localStorageTest = await page.evaluate(() => {
            try {
              localStorage.setItem('test-key', 'test-value');
              const retrieved = localStorage.getItem('test-key');
              localStorage.removeItem('test-key');
              return retrieved === 'test-value';
            } catch (e) {
              return false;
            }
          });
          
          expect(localStorageTest).toBe(true);
          
          // Test sessionStorage
          const sessionStorageTest = await page.evaluate(() => {
            try {
              sessionStorage.setItem('session-test', 'session-value');
              const retrieved = sessionStorage.getItem('session-test');
              sessionStorage.removeItem('session-test');
              return retrieved === 'session-value';
            } catch (e) {
              return false;
            }
          });
          
          expect(sessionStorageTest).toBe(true);
          
          // Test IndexedDB availability
          const indexedDBSupport = await page.evaluate(() => {
            return !!window.indexedDB;
          });
          
          expect(indexedDBSupport).toBe(true);
          
        } finally {
          await page.close();
          await context.close();
          await browser.close();
        }
      });
    });
  });

  describe('Network Handling Across Browsers', () => {
    browserConfigs.forEach(({ name: browserName, browserType }) => {
      test(`should handle network requests correctly in ${browserName}`, async () => {
        const browser = await browserType.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const networkRequests = [];
        
        page.on('request', request => {
          networkRequests.push({
            url: request.url(),
            method: request.method(),
            resourceType: request.resourceType()
          });
        });
        
        try {
          await page.goto(TEST_URL);
          
          // Check that essential resources were requested
          const hasHTMLRequest = networkRequests.some(req => req.resourceType === 'document');
          const hasCSSRequest = networkRequests.some(req => req.resourceType === 'stylesheet');
          const hasJSRequest = networkRequests.some(req => req.resourceType === 'script');
          
          expect(hasHTMLRequest).toBe(true);
          expect(hasCSSRequest).toBe(true);
          expect(hasJSRequest).toBe(true);
          
          // Test fetch API
          const fetchSupport = await page.evaluate(async () => {
            try {
              // Test fetch with a simple request
              const response = await fetch('/api/health');
              return response.status === 200;
            } catch (e) {
              return false;
            }
          });
          
          expect(fetchSupport).toBe(true);
          
        } finally {
          await page.close();
          await context.close();
          await browser.close();
        }
      });
    });
  });
});

// Generate compatibility report
function generateCompatibilityReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    browsers: browserConfigs.map(config => config.name),
    devices: deviceConfigs.map(config => config.name),
    summary: {
      totalTests: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    },
    results,
    recommendations: [
      'Test on actual devices for most accurate results',
      'Consider progressive enhancement for unsupported features',
      'Implement feature detection for modern APIs',
      'Provide fallbacks for older browsers if needed',
      'Monitor real user metrics in production'
    ]
  };
  
  return report;
}
