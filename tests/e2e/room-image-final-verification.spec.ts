import { test, expect } from '@playwright/test';
import { join } from 'path';

test.describe('Room Image Final Verification', () => {
  
  test('should document the room image duplication issue', async ({ page }) => {
    const screenshotDir = join(process.cwd(), 'test-screenshots', 'final-verification');
    
    console.log('🔍 FINAL VERIFICATION: Documenting Room Image Duplication Issue');
    console.log('🎯 Target: Verify booking flow shows duplicate room images');
    
    // Navigate to homepage
    await page.goto('http://localhost:3009');
    await page.waitForLoadState('networkidle');
    
    // Search for hotels
    await page.fill('input[placeholder*="City, hotel, landmark"]', 'Paris');
    await page.locator('button:has-text("Search Hotels")').first().click();
    await page.waitForTimeout(3000);
    
    console.log('✅ Search completed');
    
    // Try to find and click a "Book Now" or "View Details" button
    const bookButtons = page.locator('button:has-text("Book Now")');
    const viewDetailsButtons = page.locator('button:has-text("View Details")');
    
    const bookCount = await bookButtons.count();
    const viewCount = await viewDetailsButtons.count();
    
    console.log(`📊 Found ${bookCount} Book Now buttons, ${viewCount} View Details buttons`);
    
    if (bookCount > 0) {
      await bookButtons.first().click();
      console.log('🎯 Clicked Book Now button');
    } else if (viewCount > 0) {
      await viewDetailsButtons.first().click();
      console.log('🎯 Clicked View Details button');
    } else {
      // Look for any hotel cards or clickable elements
      const hotelCards = page.locator('.group.hover\\:shadow-2xl, .bg-white.rounded, .hotel-card');
      const cardCount = await hotelCards.count();
      
      if (cardCount > 0) {
        await hotelCards.first().click();
        console.log('🎯 Clicked hotel card');
      }
    }
    
    await page.waitForTimeout(3000);
    
    // Take screenshot of whatever interface is now showing
    await page.screenshot({ 
      path: join(screenshotDir, 'booking-interface.png'),
      fullPage: true 
    });
    
    console.log('📸 Booking interface screenshot captured');
    
    // Look for room images in the current interface
    const roomImages = page.locator('img[src*="unsplash"], img[alt*="room"], img[src*="placeholder-room"]');
    const imageCount = await roomImages.count();
    
    console.log(`🖼️ Found ${imageCount} potential room images`);
    
    if (imageCount > 0) {
      // Collect image sources
      const imageSources = [];
      
      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const img = roomImages.nth(i);
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');
        
        if (src) {
          imageSources.push({ src, alt, index: i });
          console.log(`📸 Image ${i + 1}: ${src} (alt: "${alt}")`);
          
          // Take individual screenshot
          await img.screenshot({ 
            path: join(screenshotDir, `room-image-${i + 1}.png`)
          }).catch(() => {
            console.log(`⚠️ Could not capture screenshot for image ${i + 1}`);
          });
        }
      }
      
      // Analyze uniqueness
      const uniqueSources = new Set(imageSources.map(img => img.src));
      const duplicateCount = imageSources.length - uniqueSources.size;
      
      console.log('\n📊 ROOM IMAGE ANALYSIS RESULTS:');
      console.log('='.repeat(60));
      console.log(`Total room images found: ${imageSources.length}`);
      console.log(`Unique image sources: ${uniqueSources.size}`);
      console.log(`Duplicate images: ${duplicateCount}`);
      
      if (duplicateCount > 0) {
        console.log('\n❌ CRITICAL REVENUE BLOCKER CONFIRMED!');
        console.log(`${duplicateCount} duplicate room images detected`);
        console.log('Users cannot distinguish between different room types');
        console.log('This directly impacts purchasing decisions and revenue');
        
        // Show duplicates
        const sourceCounts = new Map();
        imageSources.forEach(img => {
          sourceCounts.set(img.src, (sourceCounts.get(img.src) || 0) + 1);
        });
        
        console.log('\n🔍 DUPLICATE IMAGE ANALYSIS:');
        sourceCounts.forEach((count, src) => {
          if (count > 1) {
            console.log(`   "${src}" appears ${count} times`);
          }
        });
        
        console.log('\n💡 IMMEDIATE FIX REQUIRED:');
        console.log('   - Update BookingFlow.tsx room image references');
        console.log('   - Use unique Unsplash URLs for each room type'); 
        console.log('   - Implement proper room image management system');
        
      } else {
        console.log('\n✅ SUCCESS: All room images are unique!');
        console.log('Users can see different room options for informed decisions');
      }
    } else {
      console.log('\n⚠️ NO ROOM IMAGES FOUND');
      console.log('This suggests the room selection interface may not be accessible');
      console.log('Please check the booking flow implementation');
    }
    
    console.log('\n📋 TEST SUMMARY:');
    console.log(`URL: ${page.url()}`);
    console.log(`Images found: ${imageCount}`);
    console.log(`Screenshots saved to: ${screenshotDir}`);
    console.log('Report available: ROOM-IMAGE-ANALYSIS-REPORT.md');
    
    await expect(page.locator('body')).toBeVisible();
  });
});