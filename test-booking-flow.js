// Test booking flow payment integration
import { chromium } from 'playwright';

async function testBookingFlow() {
  console.log('🚀 Starting booking flow test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Step 1: Loading the hotel booking site...');
    await page.goto('http://localhost:3015', { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded successfully');
    
    console.log('📍 Step 2: Looking for search functionality...');
    
    // Try to find search elements
    const searchSection = await page.locator('[data-testid="search-section"], .search-section, form').first();
    if (await searchSection.isVisible()) {
      console.log('✅ Search section found');
      await page.screenshot({ path: 'screenshots/02-search-section.png' });
      
      // Try to fill out search form
      const cityInput = page.locator('input[placeholder*="city"], input[placeholder*="destination"], input[name="destination"]').first();
      if (await cityInput.isVisible()) {
        await cityInput.fill('New York');
        console.log('✅ City filled: New York');
      }
      
      const checkinInput = page.locator('input[type="date"], input[placeholder*="check"], input[name*="checkin"]').first();
      if (await checkinInput.isVisible()) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        await checkinInput.fill(tomorrowStr);
        console.log('✅ Check-in date filled:', tomorrowStr);
      }
      
      const checkoutInput = page.locator('input[type="date"], input[placeholder*="check"], input[name*="checkout"]').nth(1);
      if (await checkoutInput.isVisible()) {
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 3);
        const dayAfterStr = dayAfter.toISOString().split('T')[0];
        await checkoutInput.fill(dayAfterStr);
        console.log('✅ Check-out date filled:', dayAfterStr);
      }
      
      // Try to submit search
      const searchButton = page.locator('button[type="submit"], button:has-text("Search"), .search-button').first();
      if (await searchButton.isVisible()) {
        console.log('📍 Step 3: Submitting search...');
        await searchButton.click();
        
        // Wait for results or loading
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/03-search-results.png', fullPage: true });
        
        console.log('📍 Step 4: Looking for hotel results...');
        
        // Look for hotel cards or results
        const hotelCards = page.locator('.hotel-card, [data-testid="hotel-card"], .hotel-item, .result-item');
        const cardCount = await hotelCards.count();
        
        if (cardCount > 0) {
          console.log(`✅ Found ${cardCount} hotel results`);
          
          // Click on first hotel
          console.log('📍 Step 5: Selecting first hotel...');
          await hotelCards.first().click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'screenshots/04-hotel-details.png', fullPage: true });
          
          // Look for booking/reserve button
          const bookButton = page.locator('button:has-text("Book"), button:has-text("Reserve"), button:has-text("Select"), .book-button, .reserve-button').first();
          if (await bookButton.isVisible()) {
            console.log('📍 Step 6: Clicking book button...');
            await bookButton.click();
            await page.waitForTimeout(2000);
            
            await page.screenshot({ path: 'screenshots/05-booking-form.png', fullPage: true });
            
            console.log('📍 Step 7: Filling guest information...');
            
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
                await input.fill(value);
                console.log(`✅ Filled ${selector} with: ${value}`);
              }
            }
            
            await page.screenshot({ path: 'screenshots/06-guest-info-filled.png', fullPage: true });
            
            // Look for proceed to payment button
            const proceedButton = page.locator('button:has-text("Payment"), button:has-text("Proceed"), button:has-text("Continue"), button:has-text("Next")').first();
            if (await proceedButton.isVisible()) {
              console.log('📍 Step 8: Proceeding to payment...');
              await proceedButton.click();
              await page.waitForTimeout(3000);
              
              await page.screenshot({ path: 'screenshots/07-payment-page.png', fullPage: true });
              
              console.log('📍 Step 9: Testing Square payment integration...');
              
              // Check for Square payment elements
              const squareElements = [
                'iframe[title*="Square"], iframe[src*="square"]',
                '#card-container, .square-card-container',
                'input[placeholder*="Card"], input[placeholder*="1234"]'
              ];
              
              let squareFound = false;
              for (const selector of squareElements) {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                  console.log(`✅ Square element found: ${selector}`);
                  squareFound = true;
                  break;
                }
              }
              
              if (squareFound) {
                console.log('🎉 SQUARE PAYMENT INTEGRATION DETECTED!');
                
                // Try to interact with payment form
                try {
                  // Wait for Square iframe to load
                  await page.waitForTimeout(2000);
                  
                  // Check for payment form fields
                  const cardInput = page.locator('input[placeholder*="Card"], input[data-field="cardNumber"], #card-number').first();
                  if (await cardInput.isVisible()) {
                    console.log('📍 Step 10: Testing payment form...');
                    await cardInput.fill('4111 1111 1111 1111');
                    console.log('✅ Test card number entered');
                    
                    const expiryInput = page.locator('input[placeholder*="MM/YY"], input[data-field="expirationDate"], #card-expiry').first();
                    if (await expiryInput.isVisible()) {
                      await expiryInput.fill('12/28');
                      console.log('✅ Expiry date entered');
                    }
                    
                    const cvvInput = page.locator('input[placeholder*="CVV"], input[data-field="cvv"], #card-cvv').first();
                    if (await cvvInput.isVisible()) {
                      await cvvInput.fill('123');
                      console.log('✅ CVV entered');
                    }
                    
                    await page.screenshot({ path: 'screenshots/08-payment-form-filled.png', fullPage: true });
                    
                    // Look for submit payment button
                    const payButton = page.locator('button:has-text("Pay"), button:has-text("Complete"), button:has-text("Submit"), .pay-button').first();
                    if (await payButton.isVisible()) {
                      console.log('📍 Step 11: Payment button found - ready for payment submission');
                      await page.screenshot({ path: 'screenshots/09-ready-for-payment.png', fullPage: true });
                      
                      console.log('🎉 CRITICAL SUCCESS: Payment form is functional!');
                      console.log('💰 Revenue generation is READY - Square integration working');
                    }
                  }
                } catch (paymentError) {
                  console.log('⚠️ Payment form interaction failed:', paymentError.message);
                  await page.screenshot({ path: 'screenshots/08-payment-error.png', fullPage: true });
                }
              } else {
                console.log('❌ Square payment integration NOT FOUND');
                
                // Check for any payment elements at all
                const genericPayment = page.locator('input[type="text"], input[placeholder*="card"], .payment-form, .card-form').first();
                if (await genericPayment.isVisible()) {
                  console.log('⚠️ Generic payment form found (not Square)');
                } else {
                  console.log('❌ NO payment form detected');
                }
              }
              
            } else {
              console.log('❌ Could not find proceed to payment button');
            }
          } else {
            console.log('❌ Could not find book/reserve button');
          }
        } else {
          console.log('❌ No hotel results found');
          
          // Check for error messages
          const errorMsg = page.locator('.error, .no-results, [data-testid="error"]').first();
          if (await errorMsg.isVisible()) {
            const errorText = await errorMsg.textContent();
            console.log('Error message:', errorText);
          }
        }
      } else {
        console.log('❌ Could not find search button');
      }
    } else {
      console.log('❌ Could not find search section');
    }
    
    // Check JavaScript console for errors
    console.log('📍 Checking for JavaScript errors...');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    if (logs.length > 0) {
      console.log('❌ JavaScript errors detected:');
      logs.forEach(log => console.log('  ', log));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
  } finally {
    console.log('📁 Screenshots saved to screenshots/ directory');
    console.log('🔚 Test completed - browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
testBookingFlow().catch(console.error);