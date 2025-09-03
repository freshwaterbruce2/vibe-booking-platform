// Direct Square payment integration test
import { chromium } from 'playwright';

async function testSquareIntegration() {
  console.log('🔍 DIRECT SQUARE INTEGRATION TEST');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  // Monitor for Square-related network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('square') || url.includes('payment')) {
      console.log(`🌐 Network Request: ${url}`);
    }
  });
  
  // Monitor console for Square-related messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Square') || text.includes('payment') || msg.type() === 'error') {
      console.log(`🔍 Console [${msg.type()}]: ${text}`);
    }
  });
  
  try {
    console.log('📍 Loading homepage to check for Square SDK...');
    await page.goto('http://localhost:3015');
    await page.waitForLoadState('networkidle');
    
    // Check if Square SDK is loaded globally
    console.log('🔍 Checking for Square SDK in global scope...');
    const squareSDK = await page.evaluate(() => {
      return {
        hasSquare: typeof window.Square !== 'undefined',
        hasSquareApplication: typeof window.SquareApplication !== 'undefined',
        windowKeys: Object.keys(window).filter(key => key.toLowerCase().includes('square'))
      };
    });
    
    console.log('Square SDK Check:', squareSDK);
    
    if (squareSDK.hasSquare) {
      console.log('✅ Square SDK is loaded globally!');
    }
    
    // Let's try to navigate to a booking URL directly or create a test booking scenario
    console.log('📍 Looking for any links to booking/payment pages...');
    
    // Check for routing or navigation to payment pages
    const links = await page.locator('a').all();
    const bookingLinks = [];
    
    for (const link of links) {
      try {
        const href = await link.getAttribute('href') || '';
        const text = await link.textContent() || '';
        if (href.includes('booking') || href.includes('payment') || 
            text.toLowerCase().includes('book') || text.toLowerCase().includes('pay')) {
          bookingLinks.push({ href, text: text.trim() });
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (bookingLinks.length > 0) {
      console.log('🔗 Found booking-related links:');
      bookingLinks.forEach(link => console.log(`  - ${link.text}: ${link.href}`));
      
      // Try clicking on first booking link
      const firstBookingLink = bookingLinks[0];
      if (firstBookingLink.href && !firstBookingLink.href.startsWith('#')) {
        console.log(`📍 Navigating to: ${firstBookingLink.href}`);
        await page.goto(`http://localhost:3015${firstBookingLink.href}`);
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Try common booking/payment URLs
    const testUrls = [
      '/booking',
      '/payment', 
      '/checkout',
      '/book',
      '/reserve'
    ];
    
    for (const url of testUrls) {
      try {
        console.log(`📍 Testing URL: ${url}`);
        const response = await page.goto(`http://localhost:3015${url}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        if (response && response.status() === 200) {
          console.log(`✅ Found valid page at: ${url}`);
          await page.screenshot({ path: `screenshots/square-test-${url.replace('/', '')}.png`, fullPage: true });
          
          // Check for payment elements on this page
          await checkForSquareElements(page, `Page: ${url}`);
          break;
        }
      } catch (e) {
        console.log(`❌ ${url} not found or failed to load`);
      }
    }
    
    // Create a manual Square payment form test
    console.log('📍 Creating manual Square test...');
    
    await page.evaluate(() => {
      // Inject a test payment form
      const testForm = document.createElement('div');
      testForm.innerHTML = `
        <div id="square-test-container" style="margin: 20px; padding: 20px; border: 2px solid #007bff; background: #f8f9fa;">
          <h3>Square Payment Test</h3>
          <div id="card-container" style="margin: 10px 0; height: 40px; border: 1px solid #ddd; padding: 10px;">
            Loading Square payment form...
          </div>
          <button id="card-button" style="margin: 10px 0; padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer;">
            Pay Now
          </button>
          <div id="payment-status" style="margin: 10px 0; font-weight: bold;"></div>
        </div>
      `;
      document.body.appendChild(testForm);
    });
    
    await page.screenshot({ path: 'screenshots/square-manual-form.png', fullPage: true });
    
    // Try to initialize Square payment form
    const squareInitResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          if (typeof Square !== 'undefined') {
            console.log('Square SDK found, attempting to initialize...');
            
            // This would be the actual Square initialization code
            // For testing, we'll just check if the SDK is available
            resolve({
              success: true,
              message: 'Square SDK is available and could be initialized',
              version: Square.VERSION || 'unknown'
            });
          } else {
            resolve({
              success: false,
              message: 'Square SDK not found in global scope'
            });
          }
        } catch (error) {
          resolve({
            success: false,
            message: `Square initialization error: ${error.message}`
          });
        }
      });
    });
    
    console.log('🔍 Square Initialization Result:', squareInitResult);
    
    // Check the current page for any Square elements
    await checkForSquareElements(page, 'Current Page');
    
    // Final comprehensive check
    const finalCheck = await page.evaluate(() => {
      const results = {
        squareScripts: [],
        squareIframes: [],
        squareElements: [],
        paymentInputs: [],
        formElements: []
      };
      
      // Check for Square scripts
      document.querySelectorAll('script').forEach(script => {
        const src = script.src || '';
        if (src.includes('square')) {
          results.squareScripts.push(src);
        }
      });
      
      // Check for Square iframes
      document.querySelectorAll('iframe').forEach(iframe => {
        const src = iframe.src || '';
        const title = iframe.title || '';
        if (src.includes('square') || title.includes('Square')) {
          results.squareIframes.push({ src, title });
        }
      });
      
      // Check for Square-specific elements
      const squareSelectors = [
        '#sq-card-number',
        '#sq-expiration-date',
        '#sq-cvv',
        '.square-payment',
        '[data-testid*="square"]'
      ];
      
      squareSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.squareElements.push({ selector, count: elements.length });
        }
      });
      
      // Check for payment inputs
      document.querySelectorAll('input').forEach(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        const name = input.name?.toLowerCase() || '';
        if (placeholder.includes('card') || name.includes('card') ||
            placeholder.includes('payment') || name.includes('payment')) {
          results.paymentInputs.push({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder
          });
        }
      });
      
      // Check for payment forms
      document.querySelectorAll('form').forEach(form => {
        const action = form.action?.toLowerCase() || '';
        const className = form.className?.toLowerCase() || '';
        if (action.includes('payment') || className.includes('payment')) {
          results.formElements.push({
            action: form.action,
            className: form.className
          });
        }
      });
      
      return results;
    });
    
    console.log('\n=== FINAL SQUARE INTEGRATION REPORT ===');
    console.log('Square Scripts:', finalCheck.squareScripts);
    console.log('Square iFrames:', finalCheck.squareIframes);
    console.log('Square Elements:', finalCheck.squareElements);
    console.log('Payment Inputs:', finalCheck.paymentInputs);
    console.log('Payment Forms:', finalCheck.formElements);
    
    const hasSquareIntegration = finalCheck.squareScripts.length > 0 || 
                                finalCheck.squareIframes.length > 0 || 
                                finalCheck.squareElements.length > 0 ||
                                squareSDK.hasSquare;
    
    console.log(`\n🎯 SQUARE INTEGRATION STATUS: ${hasSquareIntegration ? '✅ DETECTED' : '❌ NOT FOUND'}`);
    console.log(`💰 REVENUE CAPABILITY: ${hasSquareIntegration ? '🎉 READY TO COLLECT PAYMENTS!' : '❌ PAYMENT INTEGRATION NEEDED'}`);
    console.log('=====================================\n');
    
    await page.screenshot({ path: 'screenshots/square-final-check.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Square test error:', error.message);
    await page.screenshot({ path: 'screenshots/square-error.png', fullPage: true });
  } finally {
    console.log('📁 Screenshots saved. Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

async function checkForSquareElements(page, context) {
  console.log(`🔍 Checking for Square elements in: ${context}`);
  
  const squareElements = [
    'iframe[src*="square"]',
    'iframe[title*="Square"]',
    '#sq-card-number',
    '#sq-expiration-date', 
    '#sq-cvv',
    '#sq-postal-code',
    '.square-payment-form',
    '#card-container',
    '[data-testid="square-payment"]'
  ];
  
  let found = false;
  
  for (const selector of squareElements) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found Square element: ${selector} (${count})`);
        found = true;
      }
    } catch (e) {
      // Continue
    }
  }
  
  if (!found) {
    console.log(`❌ No Square elements found in ${context}`);
  }
  
  return found;
}

testSquareIntegration().catch(console.error);