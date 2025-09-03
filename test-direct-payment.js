// Direct test to get to payment page quickly
import { chromium } from 'playwright';

async function testDirectPayment() {
  console.log('💳 DIRECT PAYMENT TEST - Going straight to booking flow...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const page = await browser.newPage();

  // Monitor console errors
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`🔍 JS Error: ${msg.text()}`);
    }
  });

  try {
    console.log('📍 Loading homepage...');
    await page.goto('http://localhost:3015');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'screenshots/direct-01-homepage.png', fullPage: true });

    // Check what search elements are actually available
    console.log('🔍 Analyzing search form elements...');

    const allInputs = await page.locator('input').all();
    console.log(`Found ${allInputs.length} input elements`);

    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const placeholder = (await input.getAttribute('placeholder')) || '';
      const name = (await input.getAttribute('name')) || '';
      const type = (await input.getAttribute('type')) || '';
      console.log(`Input ${i}: type="${type}", name="${name}", placeholder="${placeholder}"`);
    }

    // Try different approach - look for visible text inputs
    console.log('📍 Looking for destination input...');

    const destinationInput = page.locator('input').first(); // Try first input

    if (await destinationInput.isVisible()) {
      console.log('✅ Found input field, trying to fill destination...');
      await destinationInput.click();
      await destinationInput.fill('New York');
      console.log('✅ Destination filled');

      // Look for date inputs
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();
      console.log(`Found ${dateCount} date inputs`);

      if (dateCount >= 2) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        await dateInputs.nth(0).fill(tomorrowStr);
        console.log('✅ Check-in date set');

        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 3);
        const dayAfterStr = dayAfter.toISOString().split('T')[0];

        await dateInputs.nth(1).fill(dayAfterStr);
        console.log('✅ Check-out date set');
      }

      // Look for search button
      const searchButton = page.locator('button').first(); // Try first button
      if (await searchButton.isVisible()) {
        console.log('📍 Clicking search button...');
        await searchButton.click();

        // Wait for results
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'screenshots/direct-02-search-results.png', fullPage: true });

        // Look for any hotel booking elements
        console.log('🔍 Looking for booking elements...');

        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons on results page`);

        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
          const button = buttons[i];
          const text = (await button.textContent()) || '';
          console.log(`Button ${i}: "${text.trim()}"`);

          if (
            text.toLowerCase().includes('book') ||
            text.toLowerCase().includes('select') ||
            text.toLowerCase().includes('reserve')
          ) {
            console.log(`📍 Found potential booking button: "${text}"`);
            await button.click();
            await page.waitForTimeout(3000);
            await page.screenshot({
              path: 'screenshots/direct-03-after-booking-click.png',
              fullPage: true,
            });
            break;
          }
        }

        // Now check for payment elements on current page
        console.log('🔍 SCANNING FOR PAYMENT ELEMENTS...');
        await page.screenshot({ path: 'screenshots/direct-04-current-page.png', fullPage: true });

        // Comprehensive Square payment check
        const paymentElements = [
          'iframe[src*="square"]',
          'iframe[title*="Square"]',
          '#sq-card-number',
          'input[placeholder*="Card"]',
          'input[placeholder*="1234"]',
          '.square-payment',
          '#card-container',
          '[data-testid="payment"]',
        ];

        let paymentFound = false;

        for (const selector of paymentElements) {
          try {
            const element = page.locator(selector);
            const count = await element.count();
            if (count > 0) {
              console.log(`✅ PAYMENT ELEMENT FOUND: ${selector} (${count})`);
              paymentFound = true;

              // Try to interact with it
              if (selector.includes('input')) {
                try {
                  await element.first().fill('4111 1111 1111 1111');
                  console.log('✅ Successfully filled test card number!');
                } catch (e) {
                  console.log('⚠️ Could not fill card number:', e.message);
                }
              }
            }
          } catch (e) {
            // Continue
          }
        }

        if (paymentFound) {
          console.log('🎉 PAYMENT INTEGRATION DETECTED!');
          await page.screenshot({
            path: 'screenshots/direct-05-payment-found.png',
            fullPage: true,
          });
        } else {
          console.log('❌ No payment integration found yet');

          // Try to navigate further
          console.log('📍 Looking for next step buttons...');
          const nextButtons = page.locator(
            'button:has-text("Continue"), button:has-text("Next"), button:has-text("Proceed")',
          );
          const nextCount = await nextButtons.count();

          if (nextCount > 0) {
            console.log(`Found ${nextCount} potential next step buttons`);
            await nextButtons.first().click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'screenshots/direct-06-next-step.png', fullPage: true });

            // Check again for payment elements
            for (const selector of paymentElements) {
              try {
                const element = page.locator(selector);
                const count = await element.count();
                if (count > 0) {
                  console.log(`✅ PAYMENT FOUND AFTER NAVIGATION: ${selector}`);
                  paymentFound = true;
                }
              } catch (e) {
                // Continue
              }
            }
          }
        }

        console.log('\n=== PAYMENT STATUS REPORT ===');
        console.log(`Payment Integration Found: ${paymentFound ? '✅ YES' : '❌ NO'}`);
        console.log(`JavaScript Errors: ${errors.length}`);
        if (errors.length > 0) {
          errors.forEach((err) => console.log(`  - ${err}`));
        }
        console.log('============================');
      } else {
        console.log('❌ Could not find search button');
      }
    } else {
      console.log('❌ Could not find destination input');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'screenshots/direct-error.png', fullPage: true });
  } finally {
    console.log('📁 Screenshots saved. Browser closing in 8 seconds...');
    await page.waitForTimeout(8000);
    await browser.close();
  }
}

testDirectPayment().catch(console.error);
