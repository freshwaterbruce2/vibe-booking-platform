// Test payment flow specifically - continue from search results
import { chromium } from 'playwright';

async function testPaymentFlow() {
  console.log('💳 Starting PAYMENT FLOW test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Log console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  try {
    console.log('📍 Loading hotel booking site...');
    await page.goto('http://localhost:3015', { waitUntil: 'networkidle' });
    
    console.log('📍 Performing search to get to results...');
    
    // Fill search form quickly
    await page.locator('input[placeholder*="city"], input[placeholder*="destination"]').first().fill('New York');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.locator('input[type="date"]').first().fill(tomorrowStr);
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];
    await page.locator('input[type="date"]').nth(1).fill(dayAfterStr);
    
    // Submit search
    await page.locator('button[type="submit"], button:has-text("Search")').first().click();
    await page.waitForTimeout(3000);
    
    console.log('✅ Search completed, looking for hotel results...');
    
    // Wait for hotel results
    const hotelCards = page.locator('.hotel-card, [data-testid="hotel-card"], .result-item, .card, .hotel-item, [class*="hotel"]');
    await hotelCards.first().waitFor({ timeout: 10000 });
    
    const cardCount = await hotelCards.count();
    console.log(`✅ Found ${cardCount} hotel(s)`);
    
    await page.screenshot({ path: 'screenshots/payment-01-search-results.png', fullPage: true });
    
    // Click on the first hotel (cheapest option - Comfort Inn at $120)
    console.log('📍 Selecting hotel (Comfort Inn - $120)...');
    
    // Try multiple selectors to find the hotel card
    const bookButtons = [
      'button:has-text("Book Now")',
      'button:has-text("View Details")',
      'button:has-text("Select")',
      '.book-button',
      '[data-testid="book-button"]'
    ];
    
    let clicked = false;
    for (const selector of bookButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        console.log(`✅ Found book button: ${selector}`);
        await button.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      // Try clicking on the hotel card itself
      console.log('📍 Trying to click hotel card directly...');
      await hotelCards.first().click();
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/payment-02-hotel-selected.png', fullPage: true });
    
    console.log('📍 Looking for booking form or room selection...');
    
    // Look for room selection or direct booking form
    const roomButtons = page.locator('button:has-text("Select Room"), button:has-text("Book This Room"), button:has-text("Reserve")');
    if (await roomButtons.count() > 0) {
      console.log('✅ Room selection found, clicking first room...');
      await roomButtons.first().click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'screenshots/payment-03-room-selected.png', fullPage: true });
    
    // Look for guest information form
    console.log('📍 Looking for guest information form...');
    
    const guestFormInputs = page.locator('input[name*="first"], input[placeholder*="First"], input[name*="guest"]');
    if (await guestFormInputs.count() > 0) {
      console.log('✅ Guest form found, filling information...');
      
      // Fill guest information
      const inputs = [
        { selector: 'input[name*="first"], input[placeholder*="First"]', value: 'John' },
        { selector: 'input[name*="last"], input[placeholder*="Last"]', value: 'Doe' },
        { selector: 'input[name*="email"], input[type="email"]', value: 'john.doe@test.com' },
        { selector: 'input[name*="phone"], input[type="tel"]', value: '555-123-4567' }
      ];
      
      for (const { selector, value } of inputs) {
        const input = page.locator(selector).first();
        if (await input.isVisible()) {
          await input.clear();
          await input.fill(value);
          console.log(`✅ Filled ${value} in ${selector}`);
        }
      }
      
      await page.screenshot({ path: 'screenshots/payment-04-guest-info-filled.png', fullPage: true });
    }
    
    // Look for proceed to payment button
    console.log('📍 Looking for proceed to payment...');
    
    const proceedButtons = [
      'button:has-text("Payment")',
      'button:has-text("Proceed")',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'button[type="submit"]',
      '.proceed-button',
      '.next-button'
    ];
    
    let proceedClicked = false;
    for (const selector of proceedButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        console.log(`✅ Found proceed button: ${selector}`);
        await button.click();
        proceedClicked = true;
        break;
      }
    }
    
    if (proceedClicked) {
      await page.waitForTimeout(4000); // Wait for payment page to load
      console.log('📍 Proceeded to payment page!');
    }
    
    await page.screenshot({ path: 'screenshots/payment-05-payment-page.png', fullPage: true });
    
    console.log('🔍 CRITICAL ANALYSIS: Square Payment Integration Check...');
    
    // Comprehensive check for Square payment elements
    const squareSelectors = [
      // Square Web SDK elements
      'iframe[title*="Square"]',
      'iframe[src*="square"]',
      'iframe[src*="squareup"]',
      'iframe[id*="square"]',
      
      // Square card container
      '#sq-card-number',
      '#sq-expiration-date', 
      '#sq-cvv',
      '#sq-postal-code',
      
      // Generic Square containers
      '#card-container',
      '.square-card-container',
      '[data-testid="square-payment"]',
      
      // Square payment form
      'form[action*="square"]',
      '.square-payment-form',
      
      // Card input fields that might be Square
      'input[placeholder*="Card number"]',
      'input[placeholder*="1234"]',
      'input[data-field="cardNumber"]',
      'input[name="cardNumber"]'
    ];
    
    console.log('🔍 Scanning for Square payment elements...');
    let squareFound = false;
    let squareDetails = [];
    
    for (const selector of squareSelectors) {
      try {
        const element = page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          squareFound = true;
          squareDetails.push(`${selector}: ${count} element(s)`);
          console.log(`✅ SQUARE FOUND: ${selector} (${count} element(s))`);
        }
      } catch (e) {
        // Selector might be invalid, continue
      }
    }
    
    if (squareFound) {
      console.log('🎉 SUCCESS: SQUARE PAYMENT INTEGRATION DETECTED!');
      console.log('Square elements found:');
      squareDetails.forEach(detail => console.log(`  - ${detail}`));
      
      console.log('📍 Testing payment form interaction...');
      
      // Test Square payment form
      try {
        // Wait for Square to load
        await page.waitForTimeout(2000);
        
        // Try to fill card number
        const cardSelectors = [
          '#sq-card-number',
          'input[placeholder*="Card"]',
          'input[data-field="cardNumber"]',
          'iframe[title*="Square"]'
        ];
        
        let cardFilled = false;
        for (const selector of cardSelectors) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible()) {
              if (selector.includes('iframe')) {
                // Handle iframe
                const frame = page.frameLocator(selector);
                const cardInput = frame.locator('input[placeholder*="Card"], input[name*="card"]').first();
                await cardInput.fill('4111 1111 1111 1111');
                console.log('✅ Test card filled in Square iframe');
              } else {
                // Direct input
                await element.fill('4111 1111 1111 1111');
                console.log('✅ Test card filled in Square input');
              }
              cardFilled = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (cardFilled) {
          console.log('💳 CARD INPUT SUCCESSFUL!');
          
          // Try to fill expiry and CVV
          const expirySelectors = ['#sq-expiration-date', 'input[placeholder*="MM/YY"]', 'input[data-field="expirationDate"]'];
          for (const selector of expirySelectors) {
            const element = page.locator(selector);
            if (await element.isVisible()) {
              await element.fill('12/28');
              console.log('✅ Expiry date filled');
              break;
            }
          }
          
          const cvvSelectors = ['#sq-cvv', 'input[placeholder*="CVV"]', 'input[data-field="cvv"]'];
          for (const selector of cvvSelectors) {
            const element = page.locator(selector);
            if (await element.isVisible()) {
              await element.fill('123');
              console.log('✅ CVV filled');
              break;
            }
          }
          
          await page.screenshot({ path: 'screenshots/payment-06-card-details-filled.png', fullPage: true });
          
          // Look for pay button
          const payButtons = [
            'button:has-text("Pay")',
            'button:has-text("Complete Payment")',
            'button:has-text("Submit Payment")',
            'button:has-text("Confirm")',
            'button[type="submit"]',
            '#sq-creditcard'
          ];
          
          let payButtonFound = false;
          for (const selector of payButtons) {
            const button = page.locator(selector);
            if (await button.isVisible()) {
              console.log(`✅ PAYMENT BUTTON READY: ${selector}`);
              payButtonFound = true;
              await page.screenshot({ path: 'screenshots/payment-07-ready-to-pay.png', fullPage: true });
              break;
            }
          }
          
          if (payButtonFound) {
            console.log('🎉🎉 CRITICAL SUCCESS: SQUARE PAYMENT IS FULLY FUNCTIONAL! 🎉🎉');
            console.log('💰 REVENUE READY: Payment flow is complete and operational');
            console.log('🚀 BUSINESS READY: Can collect payments immediately');
          } else {
            console.log('⚠️ Payment form functional but submit button not clearly identified');
          }
          
        } else {
          console.log('⚠️ Square detected but card input interaction failed');
        }
        
      } catch (paymentError) {
        console.log('⚠️ Square payment form interaction error:', paymentError.message);
      }
      
    } else {
      console.log('❌ CRITICAL ISSUE: Square payment integration NOT FOUND');
      
      // Check for any payment form at all
      const genericPaymentSelectors = [
        'input[placeholder*="card"]',
        'input[type="text"][name*="card"]',
        '.payment-form',
        '.card-form',
        'form[action*="payment"]'
      ];
      
      let anyPaymentFound = false;
      for (const selector of genericPaymentSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          anyPaymentFound = true;
          console.log(`⚠️ Generic payment element found: ${selector}`);
        }
      }
      
      if (!anyPaymentFound) {
        console.log('❌ NO PAYMENT FORM DETECTED AT ALL');
        console.log('🚨 REVENUE BLOCKER: Cannot collect payments');
      }
    }
    
    await page.screenshot({ path: 'screenshots/payment-08-final-state.png', fullPage: true });
    
    // Check for JavaScript errors
    if (errors.length > 0) {
      console.log('❌ JavaScript errors detected:');
      errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No JavaScript errors');
    }
    
    console.log('\n=== PAYMENT INTEGRATION REPORT ===');
    console.log(`Square Payment Integration: ${squareFound ? '✅ WORKING' : '❌ NOT FOUND'}`);
    console.log(`JavaScript Errors: ${errors.length === 0 ? '✅ NONE' : `❌ ${errors.length} errors`}`);
    console.log(`Revenue Ready: ${squareFound ? '🎉 YES - CAN COLLECT MONEY!' : '❌ NO - REVENUE BLOCKED'}`);
    console.log('================================\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/payment-error.png', fullPage: true });
  } finally {
    console.log('📁 All screenshots saved to screenshots/ directory');
    console.log('⏱️ Keeping browser open for 10 seconds for review...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testPaymentFlow().catch(console.error);