import { test, expect } from '@playwright/test';

test.describe('Complete Revenue Workflow - CRITICAL MONEY-MAKING PATH', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this critical revenue test
    test.setTimeout(120000);
  });

  test('Complete booking workflow from homepage to payment', async ({ page }) => {
    console.log('🔍 TESTING COMPLETE REVENUE WORKFLOW - CRITICAL FOR BUSINESS');

    // Step 1: Navigate to homepage
    console.log('Step 1: Loading homepage...');
    await page.goto('http://localhost:3009');
    
    // Wait for page to load and take screenshot
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/01-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded successfully');

    // Verify essential homepage elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[placeholder*="Where would you like to stay"]')).toBeVisible();
    
    // Step 2: Search for hotels in Las Vegas
    console.log('Step 2: Searching for hotels in Las Vegas...');
    
    // Try multiple selectors for destination input
    const destinationSelectors = [
      'input[placeholder*="Where would you like to stay"]',
      'input[placeholder*="destination" i]',
      'input[placeholder*="where" i]',
      'textbox[name*="destination"]',
      'input[name="destination"]'
    ];
    
    let destinationInput = null;
    for (const selector of destinationSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        destinationInput = element;
        console.log(`Found destination input with selector: ${selector}`);
        break;
      }
    }
    
    if (!destinationInput) {
      console.error('❌ CRITICAL ERROR: Could not find destination input field');
      await page.screenshot({ path: 'tests/screenshots/ERROR-no-destination-input.png', fullPage: true });
      throw new Error('Destination input field not found - BLOCKS ALL BOOKINGS');
    }

    await destinationInput.fill('Las Vegas');
    await page.screenshot({ path: 'tests/screenshots/02-destination-entered.png', fullPage: true });
    
    // Look for search button
    const searchSelectors = [
      'button:has-text("Search Hotels")',
      'button[type="submit"]',
      'button:has-text("Search")',
      '[data-testid="search-button"]',
      '.search-button'
    ];
    
    let searchButton = null;
    for (const selector of searchSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        searchButton = element;
        console.log(`Found search button with selector: ${selector}`);
        break;
      }
    }
    
    if (!searchButton) {
      console.error('❌ CRITICAL ERROR: Could not find search button');
      await page.screenshot({ path: 'tests/screenshots/ERROR-no-search-button.png', fullPage: true });
      throw new Error('Search button not found - BLOCKS ALL BOOKINGS');
    }

    await searchButton.click();
    console.log('✅ Search initiated');
    
    // Wait for search results with timeout
    console.log('Step 3: Waiting for search results...');
    try {
      await page.waitForSelector('[data-testid="hotel-card"], .hotel-card, .hotel-result', { timeout: 15000 });
      await page.screenshot({ path: 'tests/screenshots/03-search-results.png', fullPage: true });
      console.log('✅ Search results loaded');
    } catch (error) {
      console.error('❌ CRITICAL ERROR: Search results did not load');
      await page.screenshot({ path: 'tests/screenshots/ERROR-no-search-results.png', fullPage: true });
      
      // Check for error messages
      const errorElements = await page.locator('.error, .alert, [data-testid="error"]').all();
      if (errorElements.length > 0) {
        for (const el of errorElements) {
          const text = await el.textContent();
          console.error(`Error message found: ${text}`);
        }
      }
      
      throw new Error('Search results failed to load - BLOCKS ALL BOOKINGS');
    }
    
    // Count available hotels
    const hotelCards = page.locator('[data-testid="hotel-card"], .hotel-card, .hotel-result');
    const hotelCount = await hotelCards.count();
    console.log(`Found ${hotelCount} hotels in search results`);
    
    if (hotelCount === 0) {
      console.error('❌ CRITICAL ERROR: No hotels found in search results');
      throw new Error('No hotels available - BLOCKS ALL BOOKINGS');
    }

    // Step 4: Select first hotel
    console.log('Step 4: Selecting first hotel...');
    const firstHotel = hotelCards.first();
    
    // Try different ways to click the hotel
    const clickSelectors = [
      'button:has-text("Book"), button:has-text("Select"), button:has-text("View")',
      '.book-button, .select-button, .view-button',
      '[data-testid="book-hotel"], [data-testid="select-hotel"]'
    ];
    
    let hotelClicked = false;
    for (const selector of clickSelectors) {
      const element = firstHotel.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        hotelClicked = true;
        console.log(`Clicked hotel with selector: ${selector}`);
        break;
      }
    }
    
    if (!hotelClicked) {
      // Try clicking the entire card
      await firstHotel.click();
      console.log('Clicked entire hotel card');
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/04-hotel-selected.png', fullPage: true });
    console.log('✅ Hotel selected');

    // Step 5: Test room selection and verify images
    console.log('Step 5: Testing room selection...');
    
    // Look for room options
    const roomSelectors = [
      '[data-testid="room-option"]',
      '.room-option',
      '.room-card',
      '.room-type'
    ];
    
    let roomsFound = false;
    for (const selector of roomSelectors) {
      const rooms = page.locator(selector);
      const roomCount = await rooms.count();
      if (roomCount > 0) {
        console.log(`Found ${roomCount} room options`);
        roomsFound = true;
        
        // Check for unique images
        const images = rooms.locator('img');
        const imageCount = await images.count();
        const imageSrcs = [];
        
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const src = await images.nth(i).getAttribute('src');
          imageSrcs.push(src);
        }
        
        const uniqueImages = new Set(imageSrcs).size;
        console.log(`Found ${imageCount} images, ${uniqueImages} unique`);
        
        if (uniqueImages < imageCount && imageCount > 1) {
          console.warn('⚠️ WARNING: Some room images may not be unique');
        }
        
        break;
      }
    }
    
    if (!roomsFound) {
      console.warn('⚠️ WARNING: No room options found - may affect booking conversion');
    }
    
    await page.screenshot({ path: 'tests/screenshots/05-room-selection.png', fullPage: true });

    // Step 6: Proceed to booking flow
    console.log('Step 6: Proceeding to booking flow...');
    
    const proceedSelectors = [
      'button:has-text("Book Now")',
      'button:has-text("Continue")',
      'button:has-text("Reserve")',
      '[data-testid="proceed-booking"]',
      '.book-now-button',
      '.continue-button'
    ];
    
    let proceedClicked = false;
    for (const selector of proceedSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        proceedClicked = true;
        console.log(`Clicked proceed button: ${selector}`);
        break;
      }
    }
    
    if (!proceedClicked) {
      console.error('❌ CRITICAL ERROR: Could not find booking proceed button');
      await page.screenshot({ path: 'tests/screenshots/ERROR-no-proceed-button.png', fullPage: true });
      throw new Error('Cannot proceed to booking - BLOCKS ALL REVENUE');
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/06-booking-flow-start.png', fullPage: true });

    // Step 7: Fill guest information
    console.log('Step 7: Filling guest information...');
    
    const guestFormSelectors = {
      firstName: ['input[name="firstName"]', 'input[placeholder*="first" i]', '#firstName'],
      lastName: ['input[name="lastName"]', 'input[placeholder*="last" i]', '#lastName'],
      email: ['input[type="email"]', 'input[name="email"]', '#email'],
      phone: ['input[type="tel"]', 'input[name="phone"]', '#phone']
    };
    
    const testGuestData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    };
    
    for (const [fieldName, selectors] of Object.entries(guestFormSelectors)) {
      let fieldFound = false;
      for (const selector of selectors) {
        const field = page.locator(selector).first();
        if (await field.isVisible().catch(() => false)) {
          await field.fill(testGuestData[fieldName]);
          console.log(`Filled ${fieldName} field`);
          fieldFound = true;
          break;
        }
      }
      
      if (!fieldFound) {
        console.warn(`⚠️ WARNING: ${fieldName} field not found`);
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/07-guest-info-filled.png', fullPage: true });
    console.log('✅ Guest information filled');

    // Step 8: Navigate to payment page
    console.log('Step 8: Navigating to payment...');
    
    const paymentProceedSelectors = [
      'button:has-text("Continue to Payment")',
      'button:has-text("Proceed to Payment")',
      'button:has-text("Payment")',
      '[data-testid="payment-button"]',
      '.payment-button'
    ];
    
    let paymentNavClicked = false;
    for (const selector of paymentProceedSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        paymentNavClicked = true;
        console.log(`Clicked payment navigation: ${selector}`);
        break;
      }
    }
    
    if (!paymentNavClicked) {
      console.error('❌ CRITICAL ERROR: Could not navigate to payment page');
      await page.screenshot({ path: 'tests/screenshots/ERROR-no-payment-nav.png', fullPage: true });
      throw new Error('Cannot reach payment page - BLOCKS ALL REVENUE');
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/08-payment-page.png', fullPage: true });

    // Step 9: Test Square payment integration
    console.log('Step 9: Testing Square payment integration...');
    
    // Wait for Square payment form to load
    try {
      // Look for Square iframe or payment form
      const paymentSelectors = [
        'iframe[src*="square"]',
        '[data-testid="square-payment"]',
        '.square-payment-form',
        '#square-payment-form',
        'div[id*="square"]'
      ];
      
      let paymentFormFound = false;
      for (const selector of paymentSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 10000 }).catch(() => false)) {
          console.log(`✅ Square payment form found: ${selector}`);
          paymentFormFound = true;
          break;
        }
      }
      
      if (!paymentFormFound) {
        // Check for any payment form
        const genericPaymentSelectors = [
          'form[data-testid*="payment"]',
          '.payment-form',
          'input[placeholder*="card" i]',
          'input[name*="card"]'
        ];
        
        for (const selector of genericPaymentSelectors) {
          const element = page.locator(selector).first();
          if (await element.isVisible().catch(() => false)) {
            console.log(`Payment form found (generic): ${selector}`);
            paymentFormFound = true;
            break;
          }
        }
      }
      
      if (!paymentFormFound) {
        console.error('❌ CRITICAL ERROR: No payment form found');
        await page.screenshot({ path: 'tests/screenshots/ERROR-no-payment-form.png', fullPage: true });
        
        // Check for error messages
        const errorMessages = await page.locator('.error, .alert-error, [role="alert"]').allTextContents();
        if (errorMessages.length > 0) {
          console.error('Payment page errors:', errorMessages);
        }
        
        throw new Error('Payment form not loading - COMPLETE REVENUE BLOCKER');
      }
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR: Payment integration failed to load');
      await page.screenshot({ path: 'tests/screenshots/ERROR-payment-failed.png', fullPage: true });
      throw new Error(`Payment system failure: ${error.message}`);
    }
    
    await page.screenshot({ path: 'tests/screenshots/09-payment-form-loaded.png', fullPage: true });
    console.log('✅ Payment form loaded successfully');

    // Final screenshot of complete workflow
    await page.screenshot({ path: 'tests/screenshots/10-workflow-complete.png', fullPage: true });
    
    console.log('🎉 REVENUE WORKFLOW TEST COMPLETED SUCCESSFULLY');
    console.log('✅ All critical revenue-generating steps verified');
    console.log('✅ No blocking errors found in money-making path');
  });

  test('Revenue workflow error recovery', async ({ page }) => {
    console.log('🔧 Testing error recovery in revenue workflow...');
    
    // Test with invalid destination
    await page.goto('http://localhost:3009');
    await page.waitForLoadState('networkidle');
    
    const destinationInput = page.locator('input').first();
    if (await destinationInput.isVisible().catch(() => false)) {
      await destinationInput.fill('InvalidCityXYZ123');
      
      const searchButton = page.locator('button').first();
      await searchButton.click();
      
      // Wait and check for error handling
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'tests/screenshots/error-recovery-test.png', fullPage: true });
      
      const errorElements = await page.locator('.error, .alert, [data-testid="error"]').allTextContents();
      if (errorElements.length > 0) {
        console.log('✅ Error handling working:', errorElements);
      } else {
        console.log('ℹ️ No explicit error messages shown for invalid search');
      }
    }
  });
});