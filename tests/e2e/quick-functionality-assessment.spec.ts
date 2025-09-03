import { test, expect, Page } from '@playwright/test';

test.describe('Quick Hotel Booking Functionality Assessment', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto('http://localhost:3013');
    await page.waitForLoadState('networkidle');
  });

  test('Comprehensive Platform Assessment', async ({ page }) => {
    console.log('\n🔍 HOTEL BOOKING PLATFORM FUNCTIONALITY ASSESSMENT');
    console.log('='.repeat(80));

    const results = {
      working: [] as string[],
      broken: [] as string[],
      missing: [] as string[],
      errors: [] as string[],
      consoleErrors: [] as string[],
    };

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.consoleErrors.push(msg.text());
      }
    });

    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        results.errors.push(`HTTP ${response.status()} on ${response.url()}`);
      }
    });

    try {
      // 1. TEST PAGE LOADING
      console.log('\n🌐 Testing Page Loading...');
      const title = await page.title();
      if (title && title !== '') {
        results.working.push('✅ Page loads with proper title: ' + title);
        console.log('✅ Page loaded successfully:', title);
      } else {
        results.broken.push('❌ Page title missing or empty');
      }

      // Check for main content
      const mainContent = await page.locator('main, #root, .app').first();
      if (await mainContent.isVisible()) {
        results.working.push('✅ Main application content rendered');
        console.log('✅ Main application content found');
      } else {
        results.broken.push('❌ Main application content not rendered');
      }

      // 2. TEST AUTHENTICATION UI
      console.log('\n🔐 Testing Authentication System...');
      
      // Look for sign-in elements with multiple selectors
      const authSelectors = [
        'button:has-text("Sign In")',
        'button:has-text("Login")', 
        'a:has-text("Sign In")',
        'a:has-text("Login")',
        '[data-testid="sign-in"]',
        '.sign-in-button',
        '.login-button'
      ];

      let authFound = false;
      for (const selector of authSelectors) {
        if (await page.locator(selector).isVisible({ timeout: 1000 })) {
          results.working.push('✅ Authentication button found: ' + selector);
          console.log('✅ Authentication UI element found:', selector);
          authFound = true;
          
          // Test clicking the auth button
          try {
            await page.locator(selector).click();
            await page.waitForTimeout(1000);
            
            // Check if auth modal/form appears
            const authModal = await page.locator('[data-testid="auth-modal"], .modal, [role="dialog"], form').first();
            if (await authModal.isVisible()) {
              results.working.push('✅ Authentication modal/form appears on click');
              console.log('✅ Authentication modal triggered');
            }
          } catch (e) {
            console.log('⚠️  Auth button click failed:', e);
          }
          break;
        }
      }
      
      if (!authFound) {
        results.missing.push('❌ No authentication buttons found');
        console.log('❌ No authentication UI elements found');
      }

      // 3. TEST SEARCH FUNCTIONALITY
      console.log('\n🔍 Testing Search Functionality...');
      
      // Navigate back to home if needed
      await page.goto('http://localhost:3013');
      await page.waitForLoadState('networkidle');

      // Look for search input with multiple selectors
      const searchSelectors = [
        'input[placeholder*="destination" i]',
        'input[placeholder*="search" i]',
        'input[name="destination"]',
        'input[name="search"]',
        '[data-testid="search-input"]',
        '.search-input'
      ];

      let searchFound = false;
      for (const selector of searchSelectors) {
        const searchInput = page.locator(selector).first();
        if (await searchInput.isVisible({ timeout: 2000 })) {
          results.working.push('✅ Search input found: ' + selector);
          console.log('✅ Search input found:', selector);
          searchFound = true;

          // Test search functionality
          try {
            await searchInput.fill('New York');
            await page.waitForTimeout(500);

            // Look for search trigger (button or Enter key)
            const searchButton = page.locator('button:has-text("Search"), button[type="submit"], .search-button').first();
            if (await searchButton.isVisible({ timeout: 2000 })) {
              await searchButton.click();
            } else {
              await searchInput.press('Enter');
            }

            await page.waitForTimeout(3000);

            // Check for search results
            const resultSelectors = [
              '[data-testid="search-results"]',
              '.hotel-results',
              '.search-results', 
              '.hotel-card',
              '.hotel-item'
            ];

            let resultsFound = false;
            for (const resultSelector of resultSelectors) {
              const results_elements = page.locator(resultSelector);
              const count = await results_elements.count();
              if (count > 0) {
                results.working.push(`✅ Search results displayed: ${count} items found with ${resultSelector}`);
                console.log(`✅ Search results: ${count} items found`);
                resultsFound = true;
                break;
              }
            }

            if (!resultsFound) {
              results.broken.push('❌ Search does not return visible results');
              console.log('❌ Search executed but no results displayed');
            }

          } catch (e) {
            results.broken.push('❌ Search functionality failed: ' + e);
            console.log('❌ Search test failed:', e);
          }
          break;
        }
      }

      if (!searchFound) {
        results.missing.push('❌ No search input field found');
        console.log('❌ Search input not found');
      }

      // 4. TEST HOTEL LISTINGS
      console.log('\n🏨 Testing Hotel Listings...');
      
      const hotelCardSelectors = [
        '.hotel-card',
        '.hotel-item',
        '[data-testid="hotel-card"]',
        '.hotel-result',
        '.property-card'
      ];

      let hotelsFound = false;
      for (const selector of hotelCardSelectors) {
        const hotelCards = page.locator(selector);
        const count = await hotelCards.count();
        if (count > 0) {
          results.working.push(`✅ Hotel listings displayed: ${count} hotels found with ${selector}`);
          console.log(`✅ Hotel listings: ${count} hotels displayed`);
          hotelsFound = true;

          // Test hotel images
          const hotelImages = page.locator(`${selector} img`);
          const imageCount = await hotelImages.count();
          if (imageCount > 0) {
            // Check first few images for actual content
            let workingImages = 0;
            for (let i = 0; i < Math.min(imageCount, 3); i++) {
              const img = hotelImages.nth(i);
              const src = await img.getAttribute('src');
              if (src && src.startsWith('http') && !src.includes('placeholder')) {
                workingImages++;
              }
            }
            results.working.push(`✅ Hotel images: ${workingImages}/${imageCount} images appear to be real URLs`);
            console.log(`✅ Hotel images: ${workingImages}/${imageCount} working`);
          } else {
            results.broken.push('❌ Hotel listings have no images');
          }
          break;
        }
      }

      if (!hotelsFound) {
        results.missing.push('❌ No hotel listings found on page');
        console.log('❌ No hotel listings found');
      }

      // 5. TEST BOOKING FUNCTIONALITY
      console.log('\n📅 Testing Booking Functionality...');
      
      const bookingSelectors = [
        'button:has-text("Book")',
        'button:has-text("Reserve")', 
        '.book-now-button',
        '.book-button',
        '[data-testid="book-button"]'
      ];

      let bookingFound = false;
      for (const selector of bookingSelectors) {
        const bookButtons = page.locator(selector);
        const count = await bookButtons.count();
        if (count > 0) {
          results.working.push(`✅ Booking buttons found: ${count} buttons with ${selector}`);
          console.log(`✅ Booking buttons: ${count} found`);
          bookingFound = true;

          // Test clicking first booking button
          try {
            await bookButtons.first().click();
            await page.waitForTimeout(2000);

            // Check if booking flow starts
            const bookingFlowSelectors = [
              '[data-testid="booking-form"]',
              '.booking-form',
              '.booking-flow',
              'form:has-text("booking" i)',
              '.checkout-form'
            ];

            let bookingFlowFound = false;
            for (const flowSelector of bookingFlowSelectors) {
              if (await page.locator(flowSelector).isVisible({ timeout: 3000 })) {
                results.working.push('✅ Booking flow initiated successfully');
                console.log('✅ Booking flow started');
                bookingFlowFound = true;
                break;
              }
            }

            if (!bookingFlowFound) {
              results.broken.push('❌ Booking button does not start booking flow');
              console.log('❌ Booking flow not triggered');
            }

          } catch (e) {
            results.broken.push('❌ Booking button click failed: ' + e);
          }
          break;
        }
      }

      if (!bookingFound) {
        results.missing.push('❌ No booking buttons found');
        console.log('❌ No booking buttons found');
      }

      // 6. TEST PAYMENT INTEGRATION
      console.log('\n💳 Testing Payment Integration...');
      
      const paymentSelectors = [
        '[data-testid="payment"]',
        '.payment-form',
        '.payment-section',
        '#sq-card-number',
        '.sq-card-iframe',
        '.paypal-button'
      ];

      let paymentFound = false;
      for (const selector of paymentSelectors) {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          results.working.push(`✅ Payment integration found: ${selector}`);
          console.log(`✅ Payment element found: ${selector}`);
          paymentFound = true;
        }
      }

      if (!paymentFound) {
        results.missing.push('❌ No payment integration found');
        console.log('❌ No payment elements found');
      }

      // 7. TEST RESPONSIVE DESIGN
      console.log('\n📱 Testing Responsive Design...');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      const mobileElements = [
        '.mobile-menu',
        '.hamburger',
        '[data-testid="mobile-menu"]',
        '.nav-toggle'
      ];

      let mobileFound = false;
      for (const selector of mobileElements) {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          results.working.push(`✅ Mobile responsive elements found: ${selector}`);
          console.log(`✅ Mobile design: ${selector} found`);
          mobileFound = true;
        }
      }

      if (!mobileFound) {
        results.broken.push('❌ No mobile responsive design elements detected');
      }

      // Reset viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      // 8. TEST BACKEND API CONNECTION
      console.log('\n🔌 Testing Backend API...');
      
      try {
        const apiResponse = await page.request.post('http://localhost:3001/api/hotels/search', {
          data: {
            destination: 'Test City',
            checkIn: '2024-09-01',
            checkOut: '2024-09-05',
            adults: 2
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (apiResponse.ok()) {
          const data = await apiResponse.json();
          if (data && data.hotels) {
            results.working.push(`✅ Backend API working: returned ${data.hotels.length} hotels`);
            console.log(`✅ Backend API: ${data.hotels.length} hotels returned`);
          } else {
            results.working.push('✅ Backend API responding but with different format');
          }
        } else {
          results.broken.push(`❌ Backend API error: HTTP ${apiResponse.status()}`);
        }
      } catch (e) {
        results.broken.push('❌ Backend API connection failed: ' + e);
      }

    } catch (error) {
      results.errors.push('Test execution error: ' + error);
      console.error('❌ Test execution error:', error);
    }

    // GENERATE FINAL REPORT
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE FUNCTIONALITY TEST REPORT');
    console.log('='.repeat(80));
    
    console.log('\n✅ WORKING FEATURES (' + results.working.length + '):');
    results.working.forEach(item => console.log('  ' + item));
    
    console.log('\n❌ BROKEN/NON-FUNCTIONAL (' + results.broken.length + '):');
    results.broken.forEach(item => console.log('  ' + item));
    
    console.log('\n🚫 MISSING FEATURES (' + results.missing.length + '):');
    results.missing.forEach(item => console.log('  ' + item));
    
    if (results.errors.length > 0) {
      console.log('\n🚨 TECHNICAL ERRORS (' + results.errors.length + '):');
      results.errors.forEach(item => console.log('  ' + item));
    }
    
    if (results.consoleErrors.length > 0) {
      console.log('\n⚠️  CONSOLE ERRORS (' + results.consoleErrors.length + '):');
      results.consoleErrors.slice(0, 5).forEach(item => console.log('  ' + item));
      if (results.consoleErrors.length > 5) {
        console.log('  ... and ' + (results.consoleErrors.length - 5) + ' more');
      }
    }

    // PRIORITIZED FIXES
    console.log('\n🔧 PRIORITIZED FIXES NEEDED:');
    
    const priorityFixes = [];
    
    if (results.broken.some(item => item.includes('Search does not return'))) {
      priorityFixes.push('🔴 CRITICAL: Fix search functionality - users cannot find hotels');
    }
    if (results.missing.includes('❌ No hotel listings found on page')) {
      priorityFixes.push('🔴 CRITICAL: Hotel listings not displaying - core functionality broken');
    }
    if (results.broken.some(item => item.includes('Backend API'))) {
      priorityFixes.push('🔴 CRITICAL: Backend API connectivity issues');
    }
    if (results.missing.includes('❌ No authentication buttons found')) {
      priorityFixes.push('🟡 HIGH: Authentication system missing - users cannot sign in');
    }
    if (results.missing.includes('❌ No booking buttons found')) {
      priorityFixes.push('🟡 HIGH: Booking functionality missing - cannot complete reservations');
    }
    if (results.missing.includes('❌ No payment integration found')) {
      priorityFixes.push('🟡 HIGH: Payment integration missing - cannot process payments');
    }
    if (results.broken.some(item => item.includes('mobile responsive'))) {
      priorityFixes.push('🟠 MEDIUM: Mobile responsive design needs improvement');
    }

    if (priorityFixes.length === 0) {
      console.log('  🎉 No critical issues found! Platform appears to be functioning well.');
    } else {
      priorityFixes.forEach(fix => console.log('  ' + fix));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ Assessment completed at: http://localhost:3013');
    console.log('🔗 Backend running at: http://localhost:3001');
    console.log('='.repeat(80));

    // Test passes if basic functionality works
    const criticalIssues = results.broken.filter(item => 
      item.includes('Page title missing') ||
      item.includes('Main application content not rendered') ||
      item.includes('Backend API connection failed')
    );

    if (criticalIssues.length > 0) {
      throw new Error('Critical functionality issues found: ' + criticalIssues.join(', '));
    }
  });
});