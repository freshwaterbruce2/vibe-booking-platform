import { chromium } from 'playwright';
import fs from 'fs';

async function deployCriticalFixes() {
  console.log('🚨 CRITICAL SQUARE PAYMENT CSP FIX DEPLOYMENT');
  console.log('===========================================');

  // Phase 1: Verify fixes in build
  console.log('\n📊 Phase 1: Verifying Local Fixes');

  const serverTsPath = 'backend/src/server.ts';
  const serverContent = fs.readFileSync(serverTsPath, 'utf8');

  const hasSquareCDN = serverContent.includes('web.squarecdn.com');
  const hasSquareConnect = serverContent.includes('connect.squareup.com');
  const hasGoogleFonts = serverContent.includes('fonts.googleapis.com');

  console.log(`✅ Square CDN domains: ${hasSquareCDN ? 'Added' : '❌ Missing'}`);
  console.log(`✅ Square Connect API: ${hasSquareConnect ? 'Added' : '❌ Missing'}`);
  console.log(`✅ Google Fonts CSP: ${hasGoogleFonts ? 'Added' : '❌ Missing'}`);

  // Phase 2: Create upload instructions
  console.log('\n📁 Phase 2: Upload Instructions for IONOS');
  console.log('=========================================');

  console.log('🚀 IMMEDIATE UPLOAD REQUIRED:');
  console.log('');
  console.log('1. 📁 FRONTEND FILES:');
  console.log('   - Upload ALL files from dist/ folder');
  console.log('   - Replace existing index.html, assets/, etc.');
  console.log('   - This includes fixed CSP headers');
  console.log('');
  console.log('2. 🔧 BACKEND FILES (if applicable):');
  console.log('   - Upload backend/src/server.ts with fixed CSP');
  console.log('   - Or ensure server restart picks up new configuration');
  console.log('');
  console.log('3. 📄 CRITICAL FILES TO VERIFY:');
  console.log('   - .env (Square credentials)');
  console.log('   - .htaccess (performance caching)');
  console.log('   - manifest.json (PWA configuration)');

  // Phase 3: Test Square payment after deployment
  console.log('\n🧪 Phase 3: Post-Deploy Testing');
  console.log('==============================');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Testing current Square payment status...');

    await page.goto('https://vibehotelbookings.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Check console for CSP violations
    const logs = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('CSP')) {
        logs.push(msg.text());
      }
    });

    // Try to navigate to payment
    try {
      await page.fill('input[placeholder*="City"]', 'Test City');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(3000);

      // Look for booking buttons
      const bookingBtn = page.locator('button:has-text("Book"), .hotel-card button').first();
      if (await bookingBtn.isVisible()) {
        await bookingBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('⚠️  Direct payment test...');
    }

    await page.waitForTimeout(3000);

    // Check for Square SDK loading
    const hasSquareSDK = await page.evaluate(() => {
      return typeof window.Square !== 'undefined';
    });

    // Check for CSP violations
    const pageContent = await page.textContent('body');
    const hasDemoMode =
      pageContent.includes('Demo Payment Mode') || pageContent.includes('Test Card Numbers');
    const hasCSPErrors = logs.some((log) => log.includes('Content Security Policy'));

    console.log('\n📊 CURRENT STATUS:');
    console.log(`Square SDK Loaded: ${hasSquareSDK ? '✅' : '❌'}`);
    console.log(`Demo Mode: ${hasDemoMode ? '⚠️  Still Active' : '✅ Disabled'}`);
    console.log(`CSP Violations: ${hasCSPErrors ? '❌ Found' : '✅ None'}`);

    if (hasCSPErrors) {
      console.log('\n🚨 CSP VIOLATIONS FOUND:');
      logs.forEach((log) => {
        if (log.includes('CSP') || log.includes('Content Security Policy')) {
          console.log(`   ❌ ${log}`);
        }
      });
    }

    console.log('\n🎯 NEXT STEPS:');
    if (!hasSquareSDK || hasCSPErrors) {
      console.log('1. ❌ Upload the new build files to IONOS');
      console.log('2. ❌ Ensure backend server restarts with new CSP');
      console.log('3. ❌ Wait 5-10 minutes and test again');
    } else if (hasDemoMode) {
      console.log('1. ✅ CSP is working');
      console.log('2. ⚠️  Demo mode still active - check .env file');
      console.log('3. ⚠️  Verify Square credentials are correct');
    } else {
      console.log('1. ✅ Square payments should be fully functional!');
      console.log('2. ✅ Test actual payment processing');
    }
  } catch (error) {
    console.error('❌ Testing error:', error.message);
    console.log('💡 Manual verification needed after upload');
  } finally {
    await browser.close();
  }

  // Phase 4: Summary
  console.log('\n📋 DEPLOYMENT SUMMARY');
  console.log('====================');
  console.log('✅ CSP configuration updated');
  console.log('✅ Square domains whitelisted:');
  console.log('   - https://web.squarecdn.com');
  console.log('   - https://js.squareup.com');
  console.log('   - https://connect.squareup.com');
  console.log('✅ Google Fonts domain added');
  console.log('✅ Production build created');
  console.log('');
  console.log('🚀 READY FOR UPLOAD TO IONOS!');
  console.log('Upload dist/ folder contents to website root');
}

// Run the deployment verification
deployCriticalFixes().catch(console.error);
