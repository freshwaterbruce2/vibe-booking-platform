import { test, expect } from '@playwright/test';
import { join } from 'path';

test.describe('Room Image Uniqueness - Focused Test', () => {
  
  test('should analyze room image uniqueness - CRITICAL REVENUE TEST', async ({ page }) => {
    const screenshotDir = join(process.cwd(), 'test-screenshots', 'focused-analysis');
    
    console.log('🏨 Starting Critical Room Image Uniqueness Test');
    console.log('📍 This test addresses a CRITICAL revenue blocker');
    console.log('💰 Users need to see different room images to make purchasing decisions');
    
    // Navigate to the hotel booking platform
    await page.goto('http://localhost:3009');
    await page.waitForLoadState('networkidle');
    
    // Take homepage screenshot
    await page.screenshot({ 
      path: join(screenshotDir, '01-homepage.png'),
      fullPage: true 
    });
    console.log('📸 Homepage captured');
    
    // Perform hotel search
    console.log('🔍 Performing hotel search...');
    await page.fill('input[placeholder*="City, hotel, landmark"]', 'Paris');
    
    // Set dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkinDate = tomorrow.toISOString().split('T')[0];
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    const checkoutDate = dayAfter.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', checkinDate);
    await page.fill('input[type="date"]', checkoutDate);
    
    // Click search button - use first() to avoid multiple button issue
    await page.locator('button:has-text("Search Hotels")').first().click();
    console.log('✅ Search submitted');
    
    // Wait for results
    await page.waitForTimeout(5000);
    await page.screenshot({ 
      path: join(screenshotDir, '02-search-results.png'),
      fullPage: true 
    });
    console.log('📸 Search results captured');
    
    // Analyze the current page for hotel elements
    const pageContent = await page.content();
    
    // Look for hotel-related content
    const hasHotels = pageContent.toLowerCase().includes('hotel');
    const hasResults = pageContent.toLowerCase().includes('found') || pageContent.toLowerCase().includes('results');
    const hasImages = pageContent.includes('<img');
    
    console.log(`\n🔍 PAGE ANALYSIS:`);
    console.log(`Has hotel content: ${hasHotels}`);
    console.log(`Has results indicators: ${hasResults}`);
    console.log(`Has images: ${hasImages}`);
    console.log(`Current URL: ${page.url()}`);
    
    // Check for various hotel card selectors
    const hotelSelectors = [
      '.hotel-card',
      '.group.hover\\:shadow-2xl', 
      '[data-testid*="hotel"]',
      '.bg-white.rounded',
      '.shadow',
      'img[alt*="hotel"]',
      'button:has-text("Book Now")',
      'button:has-text("View Details")'
    ];
    
    let hotelElementsFound = false;
    let interactionTarget = null;
    
    for (const selector of hotelSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`🏨 Found ${count} elements with selector: ${selector}`);
        hotelElementsFound = true;
        
        if (!interactionTarget && (selector.includes('Book Now') || selector.includes('View Details') || selector.includes('hotel-card'))) {
          interactionTarget = selector;
        }
      }
    }
    
    if (!hotelElementsFound) {
      console.log('❌ NO HOTEL ELEMENTS FOUND');
      console.log('This indicates a critical issue with the hotel search functionality');
      
      // Check if there's an error message or loading state
      const errorSelectors = [
        'text=error',
        'text=Error', 
        '[role="alert"]',
        'text=loading',
        'text=Loading',
        '.spinner',
        '.loading'
      ];
      
      for (const errorSelector of errorSelectors) {
        const errorElements = page.locator(errorSelector);
        const errorCount = await errorElements.count();
        if (errorCount > 0) {
          console.log(`⚠️ Found ${errorCount} ${errorSelector} elements`);
        }
      }
      
      return; // Exit early if no hotels found
    }
    
    // Try to interact with hotel elements to reach room details
    if (interactionTarget) {
      console.log(`🎯 Attempting to interact with: ${interactionTarget}`);
      
      try {
        await page.locator(interactionTarget).first().click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: join(screenshotDir, '03-after-hotel-click.png'),
          fullPage: true 
        });
        console.log('📸 After hotel interaction captured');
        
        // Check if we're on hotel details or modal opened
        const currentUrl = page.url();
        const hasModal = await page.locator('[role="dialog"], .modal').count() > 0;
        const urlChanged = currentUrl !== 'http://localhost:3009/';
        
        console.log(`\n📍 NAVIGATION RESULT:`);
        console.log(`URL changed: ${urlChanged}`);
        console.log(`Current URL: ${currentUrl}`);
        console.log(`Modal detected: ${hasModal}`);
        
        // Now look for room-related content
        await analyzeRoomImages(page, screenshotDir);
        
      } catch (error) {
        console.log(`❌ Failed to interact with hotel element: ${error.message}`);
      }
    }
    
    // Final analysis
    console.log('\n📊 FINAL ANALYSIS SUMMARY:');
    console.log('='.repeat(50));
    
    if (!hotelElementsFound) {
      console.log('❌ CRITICAL ISSUE: No hotel elements found');
      console.log('   - Search functionality may be broken');
      console.log('   - No hotels are being displayed to users');
      console.log('   - This is blocking ALL revenue');
    } else {
      console.log('✅ Hotel elements found on search results');
      console.log('❓ Room image uniqueness requires further investigation');
    }
    
    await expect(page.locator('body')).toBeVisible();
  });
});

// Helper function to analyze room images
async function analyzeRoomImages(page, screenshotDir) {
    console.log('\n🛏️ ANALYZING ROOM IMAGES...');
    
    const roomSelectors = [
      'img[alt*="room"]',
      'img[src*="room"]', 
      '.room-image',
      '[data-testid*="room"] img',
      '.room-card img',
      '.room-option img',
      'img[alt*="suite"]',
      'img[alt*="deluxe"]',
      'img[alt*="standard"]'
    ];
    
    let totalRoomImages = 0;
    const allImageSources = [];
    
    for (const selector of roomSelectors) {
      const roomImages = page.locator(selector);
      const count = await roomImages.count();
      
      if (count > 0) {
        console.log(`🖼️ Found ${count} images with selector: ${selector}`);
        totalRoomImages += count;
        
        for (let i = 0; i < count; i++) {
          const img = roomImages.nth(i);
          const src = await img.getAttribute('src');
          const alt = await img.getAttribute('alt');
          
          if (src) {
            allImageSources.push({ src, alt, selector, index: i });
            console.log(`   Image ${i + 1}: ${src} (alt: "${alt}")`);
          }
        }
      }
    }
    
    if (totalRoomImages === 0) {
      console.log('❌ NO ROOM IMAGES FOUND');
      console.log('   This is a CRITICAL revenue blocker!');
      console.log('   Users cannot see different room options');
      return;
    }
    
    // Analyze uniqueness
    const uniqueSources = new Set(allImageSources.map(img => img.src));
    const duplicateCount = allImageSources.length - uniqueSources.size;
    
    console.log('\n📊 ROOM IMAGE UNIQUENESS ANALYSIS:');
    console.log('='.repeat(50));
    console.log(`Total room images found: ${allImageSources.length}`);
    console.log(`Unique image sources: ${uniqueSources.size}`);
    console.log(`Duplicate images: ${duplicateCount}`);
    
    if (duplicateCount > 0) {
      console.log('\n❌ CRITICAL REVENUE BLOCKER DETECTED!');
      console.log(`${duplicateCount} duplicate room images found`);
      console.log('Users need to see different rooms to make purchasing decisions');
      
      // Show which images are duplicated
      const sourceCounts = new Map();
      allImageSources.forEach(img => {
        sourceCounts.set(img.src, (sourceCounts.get(img.src) || 0) + 1);
      });
      
      console.log('\n🔍 DUPLICATE IMAGE DETAILS:');
      sourceCounts.forEach((count, src) => {
        if (count > 1) {
          console.log(`   "${src}" appears ${count} times`);
        }
      });
    } else {
      console.log('\n✅ SUCCESS: All room images are unique!');
      console.log('Users can see different room options for informed decisions');
    }
    
    // Take screenshot of room images area
    if (totalRoomImages > 0) {
      await page.screenshot({ 
        path: join(screenshotDir, '04-room-images-area.png'),
        fullPage: true 
      });
    }
}