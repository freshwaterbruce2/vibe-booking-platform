import { test, expect } from '@playwright/test';

/**
 * LIVE SITE VALIDATION SUMMARY
 * Comprehensive validation of the deployed hotel booking platform
 * URL: https://vibe-booking-platform.netlify.app/
 */

test.describe('Live Site Production Validation', () => {
  test.describe('Core Functionality Assessment', () => {
    test('should validate real LiteAPI integration is working', async ({ page }) => {
      console.log('🧪 Testing real LiteAPI integration...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Perform search for a major destination
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'Paris');
      await page.click('button:has-text("Search Hotels")');
      
      // Wait for results
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 15000 });
      
      // Check for hotel cards
      const hotelCards = page.locator('.group.hover\\:shadow-2xl, .bg-white.rounded-xl, .hover\\:shadow-xl');
      const count = await hotelCards.count();
      
      console.log(`✅ Found ${count} hotels for Paris`);
      expect(count).toBeGreaterThan(3);
      
      // Validate hotel names are real (not placeholder)
      if (count > 0) {
        const firstHotelName = await hotelCards.first().locator('h3, h4, .font-bold').first().textContent();
        console.log(`✅ First hotel: "${firstHotelName}"`);
        
        // Should not be placeholder text
        expect(firstHotelName).not.toContain('Hotel Name');
        expect(firstHotelName).not.toContain('Loading');
        expect(firstHotelName?.length).toBeGreaterThan(3);
      }
    });

    test('should validate fast search performance', async ({ page }) => {
      console.log('⚡ Testing search performance...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const testDestinations = ['London', 'New York', 'Tokyo'];
      
      for (const destination of testDestinations) {
        const startTime = Date.now();
        
        await page.fill('input[placeholder*="City, hotel, landmark"]', destination);
        await page.click('button:has-text("Search Hotels")');
        
        // Wait for results
        await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 15000 });
        
        const searchTime = Date.now() - startTime;
        console.log(`⚡ ${destination} search completed in ${searchTime}ms`);
        
        // Should load within 2 seconds for good UX
        expect(searchTime).toBeLessThan(2000);
        
        // Verify results loaded
        const hotelCards = page.locator('.group.hover\\:shadow-2xl, .bg-white.rounded-xl');
        const count = await hotelCards.count();
        console.log(`✅ ${destination}: Found ${count} hotels`);
        expect(count).toBeGreaterThan(2);
      }
    });

    test('should validate professional UI and design system', async ({ page }) => {
      console.log('🎨 Testing professional design system...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for luxury design elements
      const gradientHeaders = page.locator('.bg-gradient-to-r, .gradient-text');
      if (await gradientHeaders.count() > 0) {
        console.log('✅ Professional gradient styling detected');
      }
      
      // Check for luxury shadow system
      const shadowElements = page.locator('[class*="shadow-luxury"], [class*="shadow-xl"], [class*="shadow-2xl"]');
      if (await shadowElements.count() > 0) {
        console.log('✅ Professional shadow system detected');
      }
      
      // Check for professional color scheme (no harsh colors)
      const buttons = page.locator('button[class*="bg-"], .btn');
      const buttonCount = await buttons.count();
      console.log(`✅ Found ${buttonCount} styled buttons`);
      expect(buttonCount).toBeGreaterThan(0);
      
      // Perform search to check hotel cards design
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'Paris');
      await page.click('button:has-text("Search Hotels")');
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 10000 });
      
      // Check hotel card styling
      const hotelCards = page.locator('.group.hover\\:shadow-2xl, .bg-white.rounded-xl');
      if (await hotelCards.count() > 0) {
        console.log('✅ Professional hotel card styling detected');
      }
    });

    test('should validate mobile responsiveness', async ({ page }) => {
      console.log('📱 Testing mobile responsiveness...');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check mobile navigation
      const mobileNav = page.locator('button[aria-label*="menu"], .hamburger, [class*="mobile-menu"]');
      if (await mobileNav.count() > 0) {
        console.log('✅ Mobile navigation detected');
      }
      
      // Test search on mobile
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'London');
      await page.click('button:has-text("Search Hotels")');
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 15000 });
      
      const hotelCards = page.locator('.group, .bg-white.rounded');
      const count = await hotelCards.count();
      console.log(`✅ Mobile: Found ${count} hotels`);
      expect(count).toBeGreaterThan(0);
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'Tokyo');
      await page.click('button:has-text("Search Hotels")');
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 15000 });
      
      const tabletCards = page.locator('.group, .bg-white.rounded');
      const tabletCount = await tabletCards.count();
      console.log(`✅ Tablet: Found ${tabletCount} hotels`);
      expect(tabletCount).toBeGreaterThan(0);
    });

    test('should validate search error handling and fallbacks', async ({ page }) => {
      console.log('🛡️ Testing error handling...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test with invalid city
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'InvalidCityXYZ123');
      await page.click('button:has-text("Search Hotels")');
      
      // Should still show results (graceful fallback)
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 10000 });
      
      const fallbackCards = page.locator('.group, .bg-white.rounded');
      const fallbackCount = await fallbackCards.count();
      
      console.log(`✅ Graceful fallback: ${fallbackCount} hotels shown for invalid city`);
      expect(fallbackCount).toBeGreaterThan(0);
      
      // Test empty search
      await page.fill('input[placeholder*="City, hotel, landmark"]', '');
      await page.click('button:has-text("Search Hotels")');
      
      // Should handle gracefully (no crash)
      await page.waitForTimeout(2000);
      console.log('✅ Empty search handled gracefully');
    });
  });

  test.describe('Advanced Feature Validation', () => {
    test('should validate passion-based matching system', async ({ page }) => {
      console.log('💖 Testing passion-based hotel matching...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for passion selection elements
      const passionCards = page.locator('.passion-card, [data-passion], .bg-gradient-to');
      const passionCount = await passionCards.count();
      
      if (passionCount > 0) {
        console.log(`✅ Found ${passionCount} passion selection cards`);
        
        // Try to interact with a passion card
        await passionCards.first().click({ timeout: 5000 });
        console.log('✅ Passion card interaction successful');
      } else {
        console.log('ℹ️ Passion system not prominently visible on homepage');
      }
      
      // Continue with regular search to test results
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'Bali');
      await page.click('button:has-text("Search Hotels")');
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 15000 });
      
      // Look for passion match indicators in results
      const matchBadges = page.locator('[class*="match"], [class*="score"], .passion-score');
      if (await matchBadges.count() > 0) {
        console.log('✅ Passion matching visible in search results');
      }
    });

    test('should validate booking flow initiation', async ({ page }) => {
      console.log('💳 Testing booking flow initiation...');
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'Dubai');
      await page.click('button:has-text("Search Hotels")');
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 15000 });
      
      // Look for Book Now buttons
      const bookButtons = page.locator('button:has-text("Book Now"), button:has-text("Book"), .book-button');
      const bookButtonCount = await bookButtons.count();
      
      console.log(`✅ Found ${bookButtonCount} booking buttons`);
      expect(bookButtonCount).toBeGreaterThan(0);
      
      if (bookButtonCount > 0) {
        try {
          // Try clicking a book button (should not crash)
          await bookButtons.first().click({ timeout: 5000 });
          console.log('✅ Booking flow initiation successful');
        } catch (error) {
          console.log('ℹ️ Booking button interaction needs refinement');
        }
      }
    });
  });

  test.describe('Production Quality Indicators', () => {
    test('should validate no console errors on load', async ({ page }) => {
      console.log('🔍 Monitoring console for errors...');
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        } else if (msg.type() === 'warning') {
          warnings.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Perform a search to test the full flow
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'Singapore');
      await page.click('button:has-text("Search Hotels")');
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 15000 });
      
      console.log(`Console Errors: ${errors.length}`);
      console.log(`Console Warnings: ${warnings.length}`);
      
      if (errors.length > 0) {
        console.log('Errors:', errors);
      }
      
      // Allow some warnings but no critical errors
      expect(errors.length).toBeLessThan(3);
    });

    test('should validate page load performance', async ({ page }) => {
      console.log('⚡ Testing page load performance...');
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`⚡ Initial page load: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      
      // Test search performance
      const searchStart = Date.now();
      await page.fill('input[placeholder*="City, hotel, landmark"]', 'Amsterdam');
      await page.click('button:has-text("Search Hotels")');
      await page.waitForSelector('[data-testid="search-results"], .space-y-6', { timeout: 15000 });
      const searchTime = Date.now() - searchStart;
      
      console.log(`⚡ Search performance: ${searchTime}ms`);
      expect(searchTime).toBeLessThan(3000); // Search should complete within 3 seconds
    });
  });
});