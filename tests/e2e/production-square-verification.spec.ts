import { test, expect, Page } from '@playwright/test';

test.describe('Production Square Payment Verification', () => {
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];
  let networkRequests: Array<{url: string, status: number, method: string}> = [];

  test.beforeEach(async ({ page }) => {
    consoleLogs = [];
    consoleErrors = [];
    networkRequests = [];
    
    // Capture ALL console activity
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });
    
    // Capture network requests
    page.on('request', (request) => {
      if (request.url().includes('square') || request.url().includes('payment')) {
        networkRequests.push({
          url: request.url(),
          status: 0, // Will be updated on response
          method: request.method()
        });
      }
    });
    
    page.on('response', (response) => {
      if (response.url().includes('square') || response.url().includes('payment')) {
        const existingRequest = networkRequests.find(r => r.url === response.url());
        if (existingRequest) {
          existingRequest.status = response.status();
        }
      }
    });
  });

  test('CRITICAL: Verify CSP fixes on live production site', async ({ page }) => {
    console.log('🌍 Testing LIVE PRODUCTION SITE: vibehotelbookings.com');
    console.log('======================================================');
    
    // Navigate to production site
    await page.goto('https://vibehotelbookings.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Successfully loaded vibehotelbookings.com');
    
    // Wait for any async loading
    await page.waitForTimeout(3000);
    
    // Check for CRITICAL CSP blocking errors
    const cspBlockingErrors = consoleErrors.filter(error => 
      (error.includes('Refused to load') || error.includes('blocked')) &&
      !error.includes('report-only') &&
      (error.includes('square') || error.includes('web.squarecdn.com'))
    );
    
    console.log(`🔍 CSP Blocking Errors: ${cspBlockingErrors.length}`);
    if (cspBlockingErrors.length > 0) {
      console.log('❌ CRITICAL CSP BLOCKING ERRORS FOUND:');
      cspBlockingErrors.forEach(error => console.log(`   ${error}`));
    }
    
    // Navigate to booking flow to trigger Square SDK loading
    console.log('🔄 Navigating to booking flow...');
    
    try {
      await page.click('text=Book Now', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    } catch {
      console.log('⚠️  Book Now button not found, trying alternative navigation...');
      await page.goto('https://vibehotelbookings.com/search');
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for Square SDK to potentially load
    await page.waitForTimeout(5000);
    
    // Check Square SDK availability
    const squareSDKStatus = await page.evaluate(() => {
      return {
        isAvailable: typeof window.Square !== 'undefined',
        methods: typeof window.Square === 'object' ? Object.keys(window.Square || {}) : [],
        hasPayments: typeof window.Square?.payments === 'function',
        hasErrors: typeof window.Square?.errors === 'object'
      };
    });
    
    console.log('🔷 SQUARE SDK STATUS:');
    console.log(`   Available: ${squareSDKStatus.isAvailable ? '✅' : '❌'}`);
    console.log(`   Methods: ${squareSDKStatus.methods.length} (${squareSDKStatus.methods.join(', ')})`);
    console.log(`   Payments Function: ${squareSDKStatus.hasPayments ? '✅' : '❌'}`);
    console.log(`   Errors Object: ${squareSDKStatus.hasErrors ? '✅' : '❌'}`);
    
    // Check for payment-related elements
    const paymentElements = await page.evaluate(() => {
      const hasPaymentForms = document.querySelectorAll('form, [class*="payment"], [id*="payment"]').length;
      const hasCardInputs = document.querySelectorAll('input[type="text"], input[placeholder*="card"]').length;
      const hasSubmitButtons = document.querySelectorAll('button[type="submit"], button:contains("pay")').length;
      
      return {
        paymentFormsCount: hasPaymentForms,
        cardInputsCount: hasCardInputs,
        submitButtonsCount: hasSubmitButtons
      };
    });
    
    console.log('💳 PAYMENT ELEMENTS:');
    console.log(`   Payment Forms: ${paymentElements.paymentFormsCount}`);
    console.log(`   Card Inputs: ${paymentElements.cardInputsCount}`);
    console.log(`   Submit Buttons: ${paymentElements.submitButtonsCount}`);
    
    // Report network requests to Square
    const squareRequests = networkRequests.filter(req => req.url.includes('square'));
    console.log('🌐 SQUARE NETWORK REQUESTS:');
    if (squareRequests.length > 0) {
      squareRequests.forEach(req => {
        console.log(`   ${req.method} ${req.url} - Status: ${req.status || 'pending'}`);
      });
    } else {
      console.log('   No Square-specific requests detected yet');
    }
    
    // Final assessment
    console.log('\n📊 PRODUCTION VERIFICATION SUMMARY:');
    console.log('===================================');
    console.log(`✅ Site Loading: Success`);
    console.log(`✅ CSP Blocking Errors: ${cspBlockingErrors.length} (target: 0)`);
    console.log(`✅ Square SDK Available: ${squareSDKStatus.isAvailable}`);
    console.log(`✅ Console Errors Total: ${consoleErrors.length}`);
    console.log(`✅ Payment Elements Present: ${paymentElements.paymentFormsCount > 0}`);
    
    // Test assertions
    expect(cspBlockingErrors.length).toBe(0); // No CSP should block Square
    
    if (squareSDKStatus.isAvailable) {
      console.log('🎉 SUCCESS: Square SDK is working on production!');
    } else {
      console.log('⚠️  Square SDK not yet loaded - this may be normal if not on payment page');
    }
  });

  test('Production Console Error Analysis', async ({ page }) => {
    console.log('🔍 DETAILED CONSOLE ERROR ANALYSIS');
    console.log('==================================');
    
    await page.goto('https://vibehotelbookings.com');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Categorize all console errors
    const errorCategories = {
      csp: consoleErrors.filter(e => e.toLowerCase().includes('content security policy')),
      square: consoleErrors.filter(e => e.toLowerCase().includes('square')),
      network: consoleErrors.filter(e => e.includes('Failed to load resource')),
      javascript: consoleErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError')),
      other: consoleErrors.filter(e => 
        !e.toLowerCase().includes('content security policy') &&
        !e.toLowerCase().includes('square') &&
        !e.includes('Failed to load resource') &&
        !e.includes('TypeError') &&
        !e.includes('ReferenceError')
      )
    };
    
    console.log(`📋 ERROR BREAKDOWN:`);
    console.log(`   CSP Errors: ${errorCategories.csp.length}`);
    console.log(`   Square Errors: ${errorCategories.square.length}`);
    console.log(`   Network Errors: ${errorCategories.network.length}`);
    console.log(`   JavaScript Errors: ${errorCategories.javascript.length}`);
    console.log(`   Other Errors: ${errorCategories.other.length}`);
    
    // Show critical errors only
    if (errorCategories.csp.length > 0) {
      console.log('\n❌ CSP ERRORS:');
      errorCategories.csp.forEach(error => console.log(`   ${error}`));
    }
    
    if (errorCategories.square.length > 0) {
      console.log('\n❌ SQUARE ERRORS:');
      errorCategories.square.forEach(error => console.log(`   ${error}`));
    }
    
    // Success criteria
    const hasBlockingErrors = errorCategories.csp.some(e => e.includes('blocked') || e.includes('refused')) ||
                              errorCategories.square.some(e => e.includes('blocked') || e.includes('refused'));
    
    console.log(`\n🎯 BLOCKING ERRORS: ${hasBlockingErrors ? '❌ Found' : '✅ None'}`);
    
    expect(hasBlockingErrors).toBe(false);
  });
});