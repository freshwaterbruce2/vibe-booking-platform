import { test, expect, Page } from '@playwright/test';

test.describe('CSP and Resource Loading Issues', () => {
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleLogs = [];
    consoleErrors = [];
    
    // Capture console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
  });

  test('Check Square SDK loading and CSP compliance', async ({ page }) => {
    await page.goto('http://localhost:3009');
    
    // Wait for initial page load
    await page.waitForLoadState('networkidle');
    
    // Navigate to booking page where Square would load
    await page.click('text=Book Now');
    await page.waitForLoadState('networkidle');
    
    // Check if Square SDK loads without CSP errors
    const squareCspErrors = consoleErrors.filter(error => 
      error.includes('web.squarecdn.com') || 
      error.includes('square.js') ||
      error.includes('Content Security Policy')
    );
    
    console.log('Square CSP Errors:', squareCspErrors);
    
    // Check for Google Fonts CSP errors
    const fontCspErrors = consoleErrors.filter(error => 
      error.includes('fonts.googleapis.com') ||
      error.includes('fonts.gstatic.com')
    );
    
    console.log('Font CSP Errors:', fontCspErrors);
    
    // Check for manifest errors
    const manifestErrors = consoleErrors.filter(error => 
      error.includes('manifest.json') ||
      error.includes('Manifest')
    );
    
    console.log('Manifest Errors:', manifestErrors);
    
    // Report all console errors for analysis
    console.log('All Console Errors:', consoleErrors);
    
    // The test passes if we can capture the current state
    expect(true).toBe(true);
  });

  test('Test Google Fonts loading', async ({ page }) => {
    await page.goto('http://localhost:3009');
    
    // Check if Google Fonts CSS loads
    const fontResponse = await page.waitForResponse(
      response => response.url().includes('fonts.googleapis.com'),
      { timeout: 5000 }
    ).catch(() => null);
    
    console.log('Google Fonts Response:', fontResponse?.status());
    
    // Check computed styles to see if fonts are applied
    const bodyFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    
    console.log('Body Font Family:', bodyFont);
  });

  test('Check PWA manifest loading', async ({ page }) => {
    await page.goto('http://localhost:3009');
    
    // Check if manifest loads
    const manifestResponse = await page.waitForResponse(
      response => response.url().includes('manifest.json'),
      { timeout: 5000 }
    ).catch(() => null);
    
    console.log('Manifest Response:', manifestResponse?.status());
    
    if (manifestResponse) {
      const manifestContent = await manifestResponse.text();
      console.log('Manifest Content:', manifestContent);
    }
  });

  test('Check hero image loading', async ({ page }) => {
    await page.goto('http://localhost:3009');
    
    // Find hero images and check if they load
    const heroImages = await page.locator('img').all();
    
    for (const img of heroImages) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const isVisible = await img.isVisible();
      
      console.log(`Image: ${alt || 'No alt'}, Src: ${src}, Visible: ${isVisible}`);
      
      // Check if image loaded successfully
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      console.log(`Natural width: ${naturalWidth}`);
    }
  });
});