import { chromium } from 'playwright';

async function testPerformanceWithLighthouse() {
  console.log('🚀 Starting automated performance testing...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the production site
    console.log('📊 Testing vibehotelbookings.com performance...');
    await page.goto('https://vibehotelbookings.com', { waitUntil: 'networkidle' });

    // Wait for initial load
    await page.waitForTimeout(3000);

    // Measure Core Web Vitals using Performance API
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};

          entries.forEach((entry) => {
            switch (entry.entryType) {
              case 'paint':
                if (entry.name === 'first-contentful-paint') {
                  vitals.FCP = entry.startTime;
                }
                break;
              case 'largest-contentful-paint':
                vitals.LCP = entry.startTime;
                break;
              case 'layout-shift':
                if (!vitals.CLS) vitals.CLS = 0;
                if (!entry.hadRecentInput) {
                  vitals.CLS += entry.value;
                }
                break;
            }
          });

          // Get navigation timing
          const navigation = performance.getEntriesByType('navigation')[0];
          vitals.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          vitals.domContentLoaded =
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;

          setTimeout(() => resolve(vitals), 2000);
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
      });
    });

    console.log('📈 Core Web Vitals Results:');
    console.log(`🎯 First Contentful Paint: ${(metrics.FCP / 1000).toFixed(2)}s`);
    console.log(`🎯 Largest Contentful Paint: ${(metrics.LCP / 1000).toFixed(2)}s`);
    console.log(`🎯 Cumulative Layout Shift: ${metrics.CLS?.toFixed(3) || 'N/A'}`);
    console.log(`🎯 Load Time: ${(metrics.loadTime / 1000).toFixed(2)}s`);
    console.log(`🎯 DOM Content Loaded: ${(metrics.domContentLoaded / 1000).toFixed(2)}s`);

    // Test search functionality to check for dynamic content CLS
    console.log('\n🔍 Testing search functionality for CLS...');

    // Fill in search form
    await page.fill('input[placeholder*="City, hotel"]', 'Paris');
    await page.click('text=Search Hotels');

    // Wait for search results to load
    await page.waitForSelector('.animate-pulse', { timeout: 5000 });
    console.log('✅ Loading skeleton appeared (preventing CLS)');

    // Wait for actual results
    await page.waitForSelector('text=hotels found', { timeout: 15000 });
    console.log('✅ Search results loaded');

    // Measure performance after search
    const searchMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('layout-shift');
      let totalCLS = 0;
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          totalCLS += entry.value;
        }
      });
      return { CLS: totalCLS };
    });

    console.log(`🎯 Total CLS after search: ${searchMetrics.CLS.toFixed(3)}`);

    // Performance assessment
    const assessment = assessPerformance(metrics, searchMetrics);
    console.log('\n' + assessment);

    // Take a screenshot
    await page.screenshot({ path: 'performance-test-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as performance-test-screenshot.png');
  } catch (error) {
    console.error('❌ Error during performance testing:', error);
  } finally {
    await browser.close();
  }
}

function assessPerformance(metrics, searchMetrics) {
  let score = 100;
  let feedback = '🎉 PERFORMANCE ASSESSMENT:\n';

  // FCP Assessment
  if (metrics.FCP > 1800) {
    score -= 20;
    feedback += '⚠️  FCP needs improvement (target: <1.8s)\n';
  } else {
    feedback += '✅ FCP is excellent\n';
  }

  // LCP Assessment
  if (metrics.LCP > 2500) {
    score -= 25;
    feedback += '⚠️  LCP needs improvement (target: <2.5s)\n';
  } else {
    feedback += '✅ LCP is excellent\n';
  }

  // CLS Assessment - This is our main focus
  const totalCLS = searchMetrics.CLS || metrics.CLS || 0;
  if (totalCLS > 0.1) {
    score -= 30;
    feedback += `⚠️  CLS needs improvement: ${totalCLS.toFixed(3)} (target: <0.1)\n`;
  } else {
    feedback += '✅ CLS is excellent - layout shifts eliminated!\n';
  }

  // Overall assessment
  if (score >= 90) {
    feedback += `\n🏆 EXCELLENT PERFORMANCE: ${score}/100 - Ready for production!`;
  } else if (score >= 75) {
    feedback += `\n✅ GOOD PERFORMANCE: ${score}/100 - Minor optimizations possible`;
  } else {
    feedback += `\n⚠️  NEEDS IMPROVEMENT: ${score}/100 - Further optimizations required`;
  }

  return feedback;
}

// Run the test
testPerformanceWithLighthouse().catch(console.error);
