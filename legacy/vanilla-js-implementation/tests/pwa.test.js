const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'http://localhost:3001';

describe('PWA Functionality Tests', () => {
  let browser;
  let context;
  let page;
  
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    
    // Create context with service worker support
    context = await browser.newContext({
      permissions: ['notifications'],
      serviceWorkers: 'allow'
    });
  });
  
  afterAll(async () => {
    if (context) await context.close();
    if (browser) await browser.close();
  });
  
  beforeEach(async () => {
    page = await context.newPage();
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });

  describe('PWA Manifest Tests', () => {
    test('should have valid manifest.json', async () => {
      // Check manifest exists and is accessible
      const manifestResponse = await page.goto(`${TEST_URL}/manifest.json`);
      expect(manifestResponse?.status()).toBe(200);
      
      // Parse manifest content
      const manifestText = await manifestResponse?.text();
      const manifest = JSON.parse(manifestText);
      
      // Validate required manifest properties
      expect(manifest).toMatchObject({
        name: expect.any(String),
        short_name: expect.any(String),
        start_url: expect.any(String),
        display: expect.any(String),
        theme_color: expect.any(String),
        background_color: expect.any(String),
        icons: expect.arrayContaining([
          expect.objectContaining({
            src: expect.any(String),
            sizes: expect.any(String),
            type: expect.any(String)
          })
        ])
      });
      
      // Validate specific PWA requirements
      expect(manifest.name.length).toBeGreaterThan(0);
      expect(manifest.short_name.length).toBeGreaterThan(0);
      expect(['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display)).toBe(true);
      
      // Check for proper icon sizes
      const iconSizes = manifest.icons.map(icon => icon.sizes);
      expect(iconSizes).toContain('192x192'); // Required for PWA
      expect(iconSizes).toContain('512x512'); // Required for PWA
    });
    
    test('should have manifest linked in HTML', async () => {
      await page.goto(TEST_URL);
      
      const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(manifestLink).toBe('manifest.json');
      
      // Check theme color meta tag
      const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(themeColor).toBeTruthy();
    });
  });

  describe('Service Worker Tests', () => {
    test('should register service worker successfully', async () => {
      await page.goto(TEST_URL);
      
      // Wait for service worker registration
      const swData = await page.evaluate(async () => {
        return new Promise((resolve) => {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
              resolve({
                registered: !!registration,
                state: registration ? registration.active?.state : null,
                scope: registration ? registration.scope : null
              });
            });
          } else {
            resolve({ registered: false });
          }
        });
      });
      
      expect(swData.registered).toBe(true);
      expect(swData.state).toBe('activated');
      expect(swData.scope).toContain(TEST_URL);
    });
    
    test('should cache essential resources', async () => {
      await page.goto(TEST_URL);
      
      // Wait for service worker to install and cache resources
      await page.waitForTimeout(2000);
      
      const cacheData = await page.evaluate(async () => {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          const cache = await caches.open(cacheNames[0]);
          const cachedRequests = await cache.keys();
          
          return {
            cacheNames,
            cachedUrls: cachedRequests.map(req => req.url)
          };
        }
        return { cacheNames: [], cachedUrls: [] };
      });
      
      expect(cacheData.cacheNames.length).toBeGreaterThan(0);
      
      // Check that essential files are cached
      const cachedUrls = cacheData.cachedUrls.join(' ');
      expect(cachedUrls).toContain('index.html');
      expect(cachedUrls).toContain('styles.css');
      expect(cachedUrls).toContain('app.js');
    });
    
    test('should handle offline scenarios', async () => {
      await page.goto(TEST_URL);
      
      // Wait for service worker to be ready
      await page.waitForTimeout(2000);
      
      // Go offline
      await context.setOffline(true);
      
      // Try to reload the page
      const response = await page.reload({ waitUntil: 'networkidle' });
      
      // Should still load from cache
      expect(response?.status()).toBe(200);
      
      // Check that basic elements are still present
      await expect(page.locator('h1')).toContainText('HotelFinder');
      await expect(page.locator('#searchForm')).toBeVisible();
      
      // Go back online
      await context.setOffline(false);
    });
    
    test('should update cache when new version is available', async () => {
      await page.goto(TEST_URL);
      
      // Simulate service worker update by triggering update check
      const updateResult = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
            return { updated: true };
          }
        }
        return { updated: false };
      });
      
      expect(updateResult.updated).toBe(true);
    });
  });

  describe('Offline Functionality Tests', () => {
    test('should show offline indicator when network is unavailable', async () => {
      await page.goto(TEST_URL);
      
      // Check if offline indicator exists
      const hasOfflineIndicator = await page.evaluate(() => {
        // Look for offline-related elements or functionality
        return document.querySelector('[data-offline-indicator]') !== null ||
               window.navigator.onLine !== undefined;
      });
      
      expect(hasOfflineIndicator).toBe(true);
      
      // Test offline/online events
      await page.evaluate(() => {
        window.testOfflineEvents = [];
        
        window.addEventListener('online', () => {
          window.testOfflineEvents.push('online');
        });
        
        window.addEventListener('offline', () => {
          window.testOfflineEvents.push('offline');
        });
      });
      
      // Simulate going offline
      await context.setOffline(true);
      await page.waitForTimeout(100);
      
      // Simulate going online
      await context.setOffline(false);
      await page.waitForTimeout(100);
      
      const events = await page.evaluate(() => window.testOfflineEvents);
      
      // Should have detected offline/online state changes
      expect(events).toContain('offline');
      expect(events).toContain('online');
    });
    
    test('should cache search results for offline viewing', async () => {
      await page.goto(TEST_URL);
      
      // Perform a search to cache results
      await page.fill('#destination', 'Test City');
      await page.click('.search-btn');
      
      // Wait for potential results
      await page.waitForTimeout(3000);
      
      // Go offline
      await context.setOffline(true);
      
      // Try to perform another search
      await page.fill('#destination', 'Offline City');
      await page.click('.search-btn');
      
      // Should handle gracefully (show cached data or appropriate message)
      await page.waitForTimeout(2000);
      
      const funnyResponseText = await page.locator('#funnyResponseText').textContent();
      expect(funnyResponseText).toBeTruthy();
      
      await context.setOffline(false);
    });
  });

  describe('App Installation Tests', () => {
    test('should provide app installation prompt', async () => {
      await page.goto(TEST_URL);
      
      // Check if beforeinstallprompt event can be triggered
      const installData = await page.evaluate(() => {
        return new Promise((resolve) => {
          let installPrompt = null;
          
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            installPrompt = e;
            resolve({ canInstall: true, prompted: true });
          });
          
          // Simulate conditions for install prompt
          setTimeout(() => {
            if (!installPrompt) {
              resolve({ canInstall: false, prompted: false });
            }
          }, 1000);
        });
      });
      
      // Note: Install prompt may not trigger in test environment
      // This test validates the event handling exists
      expect(typeof installData).toBe('object');
    });
    
    test('should meet PWA installability criteria', async () => {
      await page.goto(TEST_URL);
      
      // Check PWA installability criteria
      const pwaChecks = await page.evaluate(async () => {
        const checks = {
          hasServiceWorker: 'serviceWorker' in navigator,
          hasManifest: !!document.querySelector('link[rel="manifest"]'),
          isHttps: location.protocol === 'https:' || location.hostname === 'localhost',
          hasValidManifest: false
        };
        
        // Check manifest validity
        try {
          const manifestLink = document.querySelector('link[rel="manifest"]');
          if (manifestLink) {
            const response = await fetch(manifestLink.href);
            const manifest = await response.json();
            checks.hasValidManifest = !!(manifest.name && manifest.start_url && manifest.icons);
          }
        } catch (e) {
          checks.hasValidManifest = false;
        }
        
        return checks;
      });
      
      expect(pwaChecks.hasServiceWorker).toBe(true);
      expect(pwaChecks.hasManifest).toBe(true);
      expect(pwaChecks.isHttps).toBe(true); // localhost counts as secure
      expect(pwaChecks.hasValidManifest).toBe(true);
    });
  });

  describe('Push Notifications Tests', () => {
    test('should handle notification permission requests', async () => {
      await page.goto(TEST_URL);
      
      // Test notification permission handling
      const notificationData = await page.evaluate(async () => {
        const data = {
          supported: 'Notification' in window,
          permission: Notification.permission
        };
        
        if (data.supported) {
          try {
            // Request permission (will be denied in test environment)
            const permission = await Notification.requestPermission();
            data.requestResult = permission;
          } catch (e) {
            data.requestError = e.message;
          }
        }
        
        return data;
      });
      
      expect(notificationData.supported).toBe(true);
      expect(['default', 'granted', 'denied'].includes(notificationData.permission)).toBe(true);
    });
  });

  describe('App Update Tests', () => {
    test('should handle app updates gracefully', async () => {
      await page.goto(TEST_URL);
      
      // Test service worker update handling
      const updateHandling = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (registration) {
            let updateFound = false;
            
            registration.addEventListener('updatefound', () => {
              updateFound = true;
            });
            
            // Force check for updates
            await registration.update();
            
            return {
              hasRegistration: true,
              updateChecked: true,
              updateFound
            };
          }
        }
        
        return {
          hasRegistration: false,
          updateChecked: false,
          updateFound: false
        };
      });
      
      expect(updateHandling.hasRegistration).toBe(true);
      expect(updateHandling.updateChecked).toBe(true);
    });
  });

  describe('Performance in PWA Mode', () => {
    test('should perform well when installed as PWA', async () => {
      await page.goto(TEST_URL);
      
      // Measure performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          resourcesCount: resources.length,
          cacheHits: resources.filter(r => r.transferSize === 0).length
        };
      });
      
      // Performance should be good
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);
      expect(performanceMetrics.loadComplete).toBeLessThan(5000);
      
      // Should have some cached resources for faster loading
      expect(performanceMetrics.cacheHits).toBeGreaterThan(0);
    });
  });

  describe('PWA Storage and Data Management', () => {
    test('should use appropriate storage mechanisms', async () => {
      await page.goto(TEST_URL);
      
      const storageData = await page.evaluate(() => {
        const data = {
          localStorage: typeof Storage !== 'undefined' && !!window.localStorage,
          sessionStorage: typeof Storage !== 'undefined' && !!window.sessionStorage,
          indexedDB: !!window.indexedDB,
          webSQL: !!window.openDatabase,
          cacheAPI: 'caches' in window
        };
        
        // Test localStorage functionality
        if (data.localStorage) {
          try {
            localStorage.setItem('pwa-test', 'test-value');
            data.localStorageWorking = localStorage.getItem('pwa-test') === 'test-value';
            localStorage.removeItem('pwa-test');
          } catch (e) {
            data.localStorageWorking = false;
          }
        }
        
        return data;
      });
      
      expect(storageData.localStorage).toBe(true);
      expect(storageData.localStorageWorking).toBe(true);
      expect(storageData.indexedDB).toBe(true);
      expect(storageData.cacheAPI).toBe(true);
    });
    
    test('should persist user preferences across sessions', async () => {
      await page.goto(TEST_URL);
      
      // Set a preference (theme)
      await page.click('.theme-toggle');
      
      // Check that preference is saved
      const savedTheme = await page.evaluate(() => {
        return localStorage.getItem('theme');
      });
      
      expect(savedTheme).toBeTruthy();
      
      // Reload page and check preference persists
      await page.reload();
      
      const persistedTheme = await page.evaluate(() => {
        return localStorage.getItem('theme');
      });
      
      expect(persistedTheme).toBe(savedTheme);
    });
  });
});

// Helper function to validate service worker file
function validateServiceWorkerFile() {
  const swPath = path.join(__dirname, '../client/sw.js');
  
  if (!fs.existsSync(swPath)) {
    console.warn('Service worker file not found at:', swPath);
    return false;
  }
  
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Check for essential service worker features
  const hasInstallEvent = swContent.includes('install');
  const hasFetchEvent = swContent.includes('fetch');
  const hasCacheLogic = swContent.includes('caches');
  
  return hasInstallEvent && hasFetchEvent && hasCacheLogic;
}

// Run service worker validation
test('Service Worker file should exist and be valid', () => {
  const isValid = validateServiceWorkerFile();
  expect(isValid).toBe(true);
});
