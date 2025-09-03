import { chromium } from 'playwright';

async function quickPerformanceTest() {
  console.log('🚀 Quick Performance Test for vibehotelbookings.com');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('⏱️  Testing site loading...');
    const startTime = Date.now();

    // Navigate with longer timeout
    await page.goto('https://vibehotelbookings.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const loadTime = Date.now() - startTime;
    console.log(`✅ Page loaded in ${(loadTime / 1000).toFixed(2)}s`);

    // Wait for the page to stabilize
    await page.waitForTimeout(2000);

    // Test if main elements are present (CLS improvements)
    const hasSearchForm = await page.locator('input[placeholder*="City"]').isVisible();
    const hasHeroSection = await page.locator('text=Book Your').isVisible();

    console.log(`🔍 Search form visible: ${hasSearchForm ? '✅' : '❌'}`);
    console.log(`🏠 Hero section visible: ${hasHeroSection ? '✅' : '❌'}`);

    // Check if images have proper dimensions (our CLS fix)
    const imageInfo = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      let withDimensions = 0;
      let total = images.length;

      images.forEach((img) => {
        if (img.width && img.height) {
          withDimensions++;
        }
      });

      return { total, withDimensions };
    });

    console.log(`📸 Images with dimensions: ${imageInfo.withDimensions}/${imageInfo.total}`);

    if (imageInfo.withDimensions > 0) {
      console.log('✅ CLS fixes are active - images have dimensions');
    } else {
      console.log('⚠️  New build may not be uploaded yet');
    }

    // Simple performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart),
        loadComplete: Math.round(nav.loadEventEnd - nav.loadEventStart),
        firstPaint:
          performance.getEntriesByType('paint').find((p) => p.name === 'first-paint')?.startTime ||
          0,
        firstContentfulPaint:
          performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint')
            ?.startTime || 0,
      };
    });

    console.log('\n📊 Performance Metrics:');
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`  Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`  First Paint: ${Math.round(performanceMetrics.firstPaint)}ms`);
    console.log(
      `  First Contentful Paint: ${Math.round(performanceMetrics.firstContentfulPaint)}ms`,
    );

    // Test CDN effectiveness by checking response headers
    const response = await page.goto('https://vibehotelbookings.com');
    const headers = response.headers();

    console.log('\n🌐 CDN & Caching Status:');
    console.log(`  CDN Active: ${headers['cf-ray'] ? '✅ Cloudflare' : '❌'}`);
    console.log(`  Content-Encoding: ${headers['content-encoding'] || 'None'}`);
    console.log(`  Cache-Control: ${headers['cache-control'] || 'None'}`);

    // Overall assessment
    const assessment = assessQuickTest(loadTime, performanceMetrics, imageInfo);
    console.log('\n' + assessment);
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

function assessQuickTest(loadTime, metrics, imageInfo) {
  let feedback = '🎯 QUICK ASSESSMENT:\n';

  if (loadTime < 3000) {
    feedback += '✅ Site loads within 3 seconds\n';
  } else {
    feedback += '⚠️  Site loading is slow (>3s)\n';
  }

  if (metrics.firstContentfulPaint < 1800) {
    feedback += '✅ First Contentful Paint is good\n';
  } else {
    feedback += '⚠️  First Contentful Paint needs improvement\n';
  }

  if (imageInfo.withDimensions > imageInfo.total * 0.8) {
    feedback += '✅ Most images have dimensions (CLS protection active)\n';
  } else {
    feedback += '⚠️  Many images missing dimensions (upload new build)\n';
  }

  return feedback;
}

quickPerformanceTest().catch(console.error);
