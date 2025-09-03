import { test, expect } from '@playwright/test';

test('Manual booking flow verification', async ({ page }) => {
  console.log('🎯 MANUAL VERIFICATION: Book Now Button Click');

  // Navigate to homepage and search
  await page.goto('http://localhost:3009');
  await page.waitForLoadState('networkidle');
  
  const destinationInput = page.locator('input[placeholder*="Where would you like to stay"]').first();
  await destinationInput.fill('Las Vegas');
  
  const searchButton = page.locator('button:has-text("Search Hotels")').first();
  await searchButton.click();
  
  // Wait longer for search results
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'tests/screenshots/manual-search-complete.png', fullPage: true });
  
  // Try to find and click Book Now button
  const bookNowButton = page.locator('button:has-text("Book Now")').first();
  
  if (await bookNowButton.isVisible().catch(() => false)) {
    console.log('✅ Book Now button found - clicking...');
    await bookNowButton.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/after-book-now-click.png', fullPage: true });
    
    // Check what page we land on
    const currentURL = page.url();
    console.log(`Current URL after Book Now: ${currentURL}`);
    
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    console.log('✅ Book Now click successful - captured destination page');
  } else {
    console.log('❌ Book Now button not found - search may still be loading');
    
    // Check for loading indicators
    const loadingElement = page.locator('text="Loading"');
    if (await loadingElement.isVisible().catch(() => false)) {
      console.log('⏳ Search still loading - waiting longer...');
      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'tests/screenshots/after-extended-wait.png', fullPage: true });
    }
  }
});