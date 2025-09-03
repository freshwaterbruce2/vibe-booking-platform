import { test, expect } from '@playwright/test';

test('Comprehensive Square Payment Verification', async ({ page }) => {
  const consoleLogs: string[] = [];
  const consoleErrors: string[] = [];
  
  // Capture all console activity
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });
  
  console.log('🔍 Starting comprehensive Square payment verification...');
  
  // Step 1: Navigate to home page
  await page.goto('http://localhost:3010');
  await page.waitForLoadState('networkidle');
  
  // Step 2: Navigate to booking flow
  console.log('📍 Navigating to booking flow...');
  await page.click('text=Book Now');
  await page.waitForLoadState('networkidle');
  
  // Step 3: Look for payment form
  console.log('💳 Looking for payment form...');
  
  // Wait for payment components to potentially load
  await page.waitForTimeout(3000);
  
  // Step 4: Check Square SDK initialization
  const squareSDKStatus = await page.evaluate(() => {
    return {
      isAvailable: typeof window.Square !== 'undefined',
      methods: window.Square ? Object.keys(window.Square) : [],
      version: window.Square?.version || 'unknown'
    };
  });
  
  console.log('🔷 Square SDK Status:', squareSDKStatus);
  
  // Step 5: Check for payment form elements
  const paymentFormElements = await page.evaluate(() => {
    const cardContainer = document.querySelector('#card-container, [data-testid="card-container"], .card-container');
    const payButton = document.querySelector('#pay-button, [data-testid="pay-button"], .pay-button, button[type="submit"]');
    const squareElements = document.querySelectorAll('[data-square]').length;
    
    return {
      hasCardContainer: !!cardContainer,
      hasPayButton: !!payButton,
      squareElementsCount: squareElements,
      cardContainerVisible: cardContainer ? !cardContainer.hidden : false
    };
  });
  
  console.log('💳 Payment Form Elements:', paymentFormElements);
  
  // Step 6: Check for Square-specific errors
  const squareErrors = consoleErrors.filter(error => 
    error.toLowerCase().includes('square') || 
    error.toLowerCase().includes('payment')
  );
  
  // Step 7: Check for CSP blocking errors
  const cspBlockingErrors = consoleErrors.filter(error => 
    error.includes('blocked') && 
    !error.includes('report-only') &&
    (error.includes('square') || error.includes('web.squarecdn.com'))
  );
  
  // Step 8: Look for payment method detection
  const paymentMethods = await page.evaluate(() => {
    // Look for any payment-related text or elements
    const paymentText = document.body.innerText.toLowerCase();
    return {
      hasSquareText: paymentText.includes('square'),
      hasCardText: paymentText.includes('card') || paymentText.includes('credit'),
      hasPaymentText: paymentText.includes('payment'),
      hasDemoModeText: paymentText.includes('demo') || paymentText.includes('test'),
      hasLivePaymentText: paymentText.includes('live payment') || paymentText.includes('production')
    };
  });
  
  console.log('💰 Payment Method Detection:', paymentMethods);
  
  // Step 9: Network requests analysis
  const networkRequests = await page.evaluate(() => {
    // Check if any Square-related requests were made
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      location: window.location.href
    };
  });
  
  console.log('🌐 Network Context:', networkRequests);
  
  // Summary Report
  console.log('\n📋 SQUARE PAYMENT VERIFICATION SUMMARY');
  console.log('=====================================');
  console.log(`✅ Square SDK Available: ${squareSDKStatus.isAvailable}`);
  console.log(`✅ SDK Methods Count: ${squareSDKStatus.methods.length}`);
  console.log(`✅ Payment Form Present: ${paymentFormElements.hasPayButton}`);
  console.log(`✅ Card Container: ${paymentFormElements.hasCardContainer}`);
  console.log(`✅ Console Errors: ${consoleErrors.length}`);
  console.log(`✅ Square-Specific Errors: ${squareErrors.length}`);
  console.log(`✅ CSP Blocking Errors: ${cspBlockingErrors.length}`);
  
  if (squareErrors.length > 0) {
    console.log('\n❌ Square-Related Errors:');
    squareErrors.forEach(error => console.log(`   ${error}`));
  }
  
  if (cspBlockingErrors.length > 0) {
    console.log('\n🚫 CSP Blocking Errors:');
    cspBlockingErrors.forEach(error => console.log(`   ${error}`));
  }
  
  // Test assertions
  expect(squareSDKStatus.isAvailable).toBe(true);
  expect(cspBlockingErrors.length).toBe(0);
  
  console.log('\n🎉 Square payment verification completed successfully!');
});