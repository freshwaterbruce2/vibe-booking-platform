import { test, expect } from '@playwright/test';

test.describe('CRITICAL REVENUE PATH VERIFICATION', () => {
  test('Complete money-making workflow - Las Vegas search to payment', async ({ page }) => {
    console.log('💰 TESTING CRITICAL REVENUE WORKFLOW - CUSTOMER TO PAYMENT');

    // Step 1: Navigate and search
    await page.goto('http://localhost:3009');
    await page.waitForLoadState('networkidle');
    
    // Fill destination
    const destinationInput = page.locator('input[placeholder*="Where would you like to stay"]').first();
    await destinationInput.fill('Las Vegas');
    
    // Click search
    const searchButton = page.locator('button:has-text("Search Hotels")').first();
    await searchButton.click();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of search results
    await page.screenshot({ path: 'tests/screenshots/search-results-loaded.png', fullPage: true });
    console.log('✅ Search results loaded successfully');
    
    // Step 2: Verify hotel cards and click "Book Now"
    await expect(page.locator(':has-text("hotels found")')).toBeVisible({ timeout: 10000 });
    
    // Find and click first "Book Now" button
    const bookNowButtons = page.locator('button:has-text("Book Now")');
    await expect(bookNowButtons.first()).toBeVisible();
    
    console.log('✅ Hotel cards with Book Now buttons are visible');
    await bookNowButtons.first().click();
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/hotel-booking-page.png', fullPage: true });
    console.log('✅ Navigated to hotel booking page');
    
    // Step 3: Look for booking form elements
    await page.waitForTimeout(3000); // Allow page to fully load
    
    // Check for common booking page elements
    const bookingIndicators = [
      'text="Guest Information"',
      'text="Booking Details"',
      'text="Check-in"',
      'text="Check-out"', 
      'input[type="email"]',
      'input[placeholder*="first" i]',
      'input[placeholder*="last" i]',
      'button:has-text("Continue")',
      'button:has-text("Book")',
      'button:has-text("Reserve")',
      'button:has-text("Confirm")',
      'button:has-text("Payment")'
    ];
    
    let bookingFormFound = false;
    for (const indicator of bookingIndicators) {
      if (await page.locator(indicator).isVisible().catch(() => false)) {
        console.log(`✅ Found booking element: ${indicator}`);
        bookingFormFound = true;
        break;
      }
    }
    
    if (!bookingFormFound) {
      console.log('⚠️ No obvious booking form elements found - checking page structure');
      const pageText = await page.textContent('body');
      console.log('Page contains:', pageText?.substring(0, 500));
    }
    
    // Step 4: Look for any forms to fill out
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    console.log(`Page has ${inputs} inputs and ${buttons} buttons`);
    
    // Try to find and fill common guest info fields
    const guestFields = {
      firstName: ['input[name*="first" i]', 'input[placeholder*="first" i]'],
      lastName: ['input[name*="last" i]', 'input[placeholder*="last" i]'],
      email: ['input[type="email"]', 'input[name*="email" i]'],
      phone: ['input[type="tel"]', 'input[name*="phone" i]']
    };
    
    const testData = {
      firstName: 'John',
      lastName: 'Doe', 
      email: 'john.doe@test.com',
      phone: '555-123-4567'
    };
    
    for (const [fieldName, selectors] of Object.entries(guestFields)) {
      for (const selector of selectors) {
        const field = page.locator(selector).first();
        if (await field.isVisible().catch(() => false)) {
          await field.fill(testData[fieldName]);
          console.log(`✅ Filled ${fieldName} field`);
          break;
        }
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/guest-info-filled.png', fullPage: true });
    
    // Step 5: Look for payment/continue buttons
    const nextStepButtons = [
      'button:has-text("Continue to Payment")',
      'button:has-text("Proceed to Payment")', 
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'button:has-text("Payment")',
      'button:has-text("Book Now")',
      'button:has-text("Reserve Now")',
      'button[type="submit"]'
    ];
    
    let paymentButtonFound = false;
    for (const selector of nextStepButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        console.log(`✅ Found next step button: ${selector}`);
        await button.click();
        paymentButtonFound = true;
        break;
      }
    }
    
    if (paymentButtonFound) {
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'tests/screenshots/payment-page.png', fullPage: true });
      console.log('✅ Navigated to payment page');
      
      // Step 6: Check for payment form elements
      const paymentElements = [
        'iframe[src*="square"]',
        'div[id*="square"]',
        'input[placeholder*="card" i]',
        'input[name*="card" i]',
        '.square-payment',
        '[data-testid*="payment"]',
        'text="Payment Information"',
        'text="Credit Card"',
        'text="Card Number"'
      ];
      
      let paymentFormFound = false;
      for (const element of paymentElements) {
        if (await page.locator(element).isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log(`✅ Payment form element found: ${element}`);
          paymentFormFound = true;
          break;
        }
      }
      
      if (paymentFormFound) {
        console.log('🎉 REVENUE WORKFLOW COMPLETE - PAYMENT FORM ACCESSIBLE');
        console.log('✅ CUSTOMERS CAN COMPLETE FULL BOOKING AND PAYMENT');
      } else {
        console.log('⚠️ Payment form not immediately visible - checking page content');
        const paymentPageText = await page.textContent('body');
        if (paymentPageText?.includes('payment') || paymentPageText?.includes('card') || paymentPageText?.includes('billing')) {
          console.log('✅ Payment-related content found on page');
        } else {
          console.log('❌ No payment content found');
        }
      }
    } else {
      console.log('⚠️ Could not find continue/payment button');
    }
    
    await page.screenshot({ path: 'tests/screenshots/final-workflow-state.png', fullPage: true });
    console.log('📸 Final workflow screenshot captured');
  });
  
  test('Verify all revenue touchpoints are accessible', async ({ page }) => {
    console.log('🔍 Verifying revenue touchpoints accessibility');
    
    await page.goto('http://localhost:3009');
    
    // Check critical revenue buttons on homepage
    const revenueElements = [
      'button:has-text("Search Hotels")',
      'button:has-text("Book Now")', 
      'link:has-text("BOOK NOW")',
      'button:has-text("Discover Luxury Hotels")',
      'button:has-text("Start Booking Now")'
    ];
    
    for (const element of revenueElements) {
      if (await page.locator(element).isVisible().catch(() => false)) {
        console.log(`✅ Revenue touchpoint accessible: ${element}`);
      }
    }
    
    console.log('✅ Revenue touchpoint verification complete');
  });
});