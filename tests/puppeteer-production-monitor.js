/**
 * Puppeteer Production Site Monitor
 * Real-time monitoring of vibehotelbookings.com for Square payment functionality
 */

import puppeteer from 'puppeteer';

async function monitorProductionSite() {
  console.log('🎬 LAUNCHING PUPPETEER PRODUCTION MONITOR');
  console.log('=========================================');
  console.log('Target: https://vibehotelbookings.com');
  console.log('Focus: Square payment CSP verification');
  console.log('');

  let browser;
  try {
    // Launch browser with detailed logging
    browser = await puppeteer.launch({
      headless: false, // Show browser window
      devtools: true, // Open dev tools automatically
      args: [
        '--disable-web-security', // Allow easier testing
        '--disable-features=VizDisplayCompositor',
        '--enable-logging',
        '--log-level=0',
      ],
    });

    const page = await browser.newPage();

    // Set up comprehensive monitoring
    const logs = {
      console: [],
      errors: [],
      network: [],
      csp: [],
      square: [],
    };

    // Console monitoring
    page.on('console', (msg) => {
      const text = msg.text();
      logs.console.push(`[${new Date().toISOString()}] [${msg.type()}] ${text}`);

      if (msg.type() === 'error') {
        logs.errors.push(text);
      }

      if (
        text.toLowerCase().includes('content security policy') ||
        text.toLowerCase().includes('csp')
      ) {
        logs.csp.push(text);
        console.log(`🔒 CSP: ${text}`);
      }

      if (text.toLowerCase().includes('square')) {
        logs.square.push(text);
        console.log(`🔷 Square: ${text}`);
      }
    });

    // Network monitoring
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('square') || url.includes('payment')) {
        logs.network.push({
          type: 'request',
          url: url,
          method: request.method(),
          timestamp: new Date().toISOString(),
        });
        console.log(`📡 Request: ${request.method()} ${url}`);
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('square') || url.includes('payment')) {
        logs.network.push({
          type: 'response',
          url: url,
          status: response.status(),
          timestamp: new Date().toISOString(),
        });
        console.log(`📡 Response: ${response.status()} ${url}`);
      }
    });

    // Navigate to production site
    console.log('🌍 Navigating to production site...');
    await page.goto('https://vibehotelbookings.com', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    console.log('✅ Production site loaded');

    // Wait for initial load and any async operations
    await page.waitForTimeout(5000);

    // Test 1: Check Square SDK availability
    console.log('\n🔷 TESTING SQUARE SDK AVAILABILITY...');
    const squareSDK = await page.evaluate(() => {
      return {
        available: typeof window.Square !== 'undefined',
        methods: typeof window.Square === 'object' ? Object.keys(window.Square || {}) : [],
        version: window.Square?.version || 'unknown',
        paymentsFunction: typeof window.Square?.payments === 'function',
      };
    });

    console.log('Square SDK Results:');
    console.log(`   Available: ${squareSDK.available ? '✅ YES' : '❌ NO'}`);
    console.log(`   Methods: ${squareSDK.methods.join(', ')}`);
    console.log(`   Payments Function: ${squareSDK.paymentsFunction ? '✅ YES' : '❌ NO'}`);

    // Test 2: Navigate to booking/payment flow
    console.log('\n💳 TESTING BOOKING FLOW NAVIGATION...');
    try {
      // Look for booking-related links
      const bookingLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button'));
        return links
          .filter((el) => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('book') || text.includes('search') || text.includes('payment');
          })
          .map((el) => ({
            text: el.textContent?.trim(),
            href: el.getAttribute('href'),
            tag: el.tagName,
          }));
      });

      console.log(`Found ${bookingLinks.length} booking-related elements:`);
      bookingLinks.slice(0, 3).forEach((link) => {
        console.log(`   ${link.tag}: "${link.text}" → ${link.href || 'javascript action'}`);
      });

      // Try to navigate to booking flow
      if (bookingLinks.length > 0) {
        const firstBookingLink = bookingLinks[0];
        if (firstBookingLink.href) {
          await page.goto(`https://vibehotelbookings.com${firstBookingLink.href}`);
        } else {
          await page.click(`text=${firstBookingLink.text}`);
        }
        await page.waitForLoadState('networkidle0');
        console.log('✅ Successfully navigated to booking flow');
      }
    } catch (error) {
      console.log(`⚠️  Booking navigation: ${error.message}`);
    }

    // Wait for payment components to load
    await page.waitForTimeout(3000);

    // Test 3: Final CSP and Square verification
    console.log('\n🧪 FINAL VERIFICATION...');

    const finalSquareCheck = await page.evaluate(() => {
      return {
        squareGlobal: typeof window.Square !== 'undefined',
        squareScript: !!document.querySelector('script[src*="square"]'),
        paymentElements: document.querySelectorAll(
          '[class*="payment"], [id*="payment"], [class*="card"]',
        ).length,
      };
    });

    console.log('Final Square Check:');
    console.log(`   Square Global Available: ${finalSquareCheck.squareGlobal ? '✅' : '❌'}`);
    console.log(`   Square Script Tag: ${finalSquareCheck.squareScript ? '✅' : '❌'}`);
    console.log(`   Payment Elements: ${finalSquareCheck.paymentElements}`);

    // Test 4: Analyze all CSP-related activity
    const cspErrors = logs.csp.filter(
      (log) => log.includes('blocked') || log.includes('refused') || log.includes('violated'),
    );
    const cspWarnings = logs.csp.filter(
      (log) => log.includes('report-only') || log.includes('warning'),
    );

    console.log('\n🔒 CSP ANALYSIS:');
    console.log(`   Blocking Errors: ${cspErrors.length} (target: 0)`);
    console.log(`   Warnings (OK): ${cspWarnings.length}`);

    if (cspErrors.length > 0) {
      console.log('\n❌ CSP BLOCKING ERRORS:');
      cspErrors.forEach((error) => console.log(`   ${error}`));
    }

    // Final report
    console.log('\n📊 PRODUCTION VERIFICATION REPORT');
    console.log('=================================');
    console.log(`🌍 Site: vibehotelbookings.com - ${page.url()}`);
    console.log(`🔷 Square SDK: ${finalSquareCheck.squareGlobal ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`🔒 CSP Blocking: ${cspErrors.length === 0 ? '✅ RESOLVED' : '❌ STILL BLOCKING'}`);
    console.log(
      `💳 Payment Elements: ${finalSquareCheck.paymentElements > 0 ? '✅ PRESENT' : '⚠️ LIMITED'}`,
    );
    console.log(`📊 Total Console Errors: ${logs.errors.length}`);
    console.log(`🌐 Square Network Requests: ${logs.network.length}`);

    // Success determination
    const isSuccess = cspErrors.length === 0 && finalSquareCheck.squareGlobal;
    console.log(`\n🎯 OVERALL STATUS: ${isSuccess ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);

    if (isSuccess) {
      console.log('🎉 Square payments should be working on production!');
    } else {
      console.log('🔧 Additional fixes may be needed - see errors above');
    }
  } catch (error) {
    console.error('❌ Production monitoring failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the monitor
monitorProductionSite().catch(console.error);
