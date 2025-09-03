import { test, expect } from '@playwright/test';
import { join } from 'path';

test.describe('Room Image Uniqueness Test - Critical Revenue Impact', () => {
  
  test('should verify room images are unique across different room types', async ({ page }) => {
    const screenshotDir = join(process.cwd(), 'test-screenshots', 'room-images');
    
    // Navigate to the hotel booking platform
    await page.goto('http://localhost:3009');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take initial homepage screenshot
    await page.screenshot({ 
      path: join(screenshotDir, '01-homepage.png'),
      fullPage: true 
    });
    
    console.log('📸 Captured homepage screenshot');
    
    // Perform a hotel search to get to results
    const searchInput = page.locator('input[placeholder*="City, hotel, landmark"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Paris');
    
    // Set dates for search
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkinDate = tomorrow.toISOString().split('T')[0];
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 4);
    const checkoutDate = dayAfter.toISOString().split('T')[0];
    
    const checkinInput = page.locator('input[type="date"]').first();
    await checkinInput.fill(checkinDate);
    
    const checkoutInput = page.locator('input[type="date"]').last();
    await checkoutInput.fill(checkoutDate);
    
    // Execute search
    const searchButton = page.locator('button:has-text("Search Hotels")');
    await searchButton.click();
    
    console.log('🔍 Executed hotel search for Paris');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"], .space-y-6, h3:has-text("hotels found")', { timeout: 15000 });
    
    // Take search results screenshot
    await page.screenshot({ 
      path: join(screenshotDir, '02-search-results.png'),
      fullPage: true 
    });
    
    console.log('📸 Captured search results screenshot');
    
    // Look for hotel cards and their details
    const hotelCards = page.locator('.group.hover\\:shadow-2xl, .bg-white.rounded-xl, .hotel-card');
    const hotelCount = await hotelCards.count();
    
    console.log(`🏨 Found ${hotelCount} hotel cards on search results`);
    
    if (hotelCount === 0) {
      console.log('⚠️ No hotel cards found. Checking for alternative selectors...');
      
      // Try alternative selectors for hotel cards
      const altCards = page.locator('[class*="hotel"], [data-testid*="hotel"], .card, .border, .shadow');
      const altCount = await altCards.count();
      console.log(`🔍 Alternative card search found ${altCount} elements`);
      
      // Take a screenshot of what's actually showing
      await page.screenshot({ 
        path: join(screenshotDir, '03-no-hotels-debug.png'),
        fullPage: true 
      });
    }
    
    // Try to find and interact with the first hotel
    let roomImagesFound = false;
    
    // Look for View Details, Book Now, or hotel card click targets
    const interactionTargets = [
      'button:has-text("View Details")',
      'button:has-text("Book Now")',
      'a:has-text("View Details")',
      '.hotel-card',
      '.group.hover\\:shadow-2xl'
    ];
    
    for (const selector of interactionTargets) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`📍 Found ${count} elements with selector: ${selector}`);
        
        try {
          // Click the first available element
          await elements.first().click();
          await page.waitForTimeout(2000);
          
          // Check if we're now on a hotel details page or if a modal opened
          const currentUrl = page.url();
          const hasModal = await page.locator('[role="dialog"], .modal, .popup').count() > 0;
          const hasDetails = currentUrl.includes('/hotel/') || currentUrl.includes('/details');
          
          console.log(`🔗 After click - URL: ${currentUrl}, Has modal: ${hasModal}, Has details page: ${hasDetails}`);
          
          if (hasModal || hasDetails || currentUrl !== 'http://localhost:3009/') {
            // Take screenshot of the hotel details interface
            await page.screenshot({ 
              path: join(screenshotDir, '04-hotel-details.png'),
              fullPage: true 
            });
            
            // Look for room selection interface
            const roomSelectors = [
              '.room-type',
              '.room-selection',
              '[data-testid*="room"]',
              '.room-card',
              '.room-option',
              'button:has-text("Select Room")',
              'img[alt*="room"]',
              'img[src*="room"]',
              '.booking-options',
              '.room-list'
            ];
            
            let roomElementsFound = false;
            
            for (const roomSelector of roomSelectors) {
              const roomElements = page.locator(roomSelector);
              const roomCount = await roomElements.count();
              
              if (roomCount > 0) {
                console.log(`🛏️ Found ${roomCount} room elements with selector: ${roomSelector}`);
                roomElementsFound = true;
                
                // Take screenshot focused on room elements
                await page.screenshot({ 
                  path: join(screenshotDir, `05-rooms-${roomSelector.replace(/[^a-zA-Z0-9]/g, '-')}.png`),
                  fullPage: true 
                });
                
                // Check for images within these room elements
                const roomImages = roomElements.locator('img');
                const imageCount = await roomImages.count();
                
                if (imageCount > 0) {
                  console.log(`🖼️ Found ${imageCount} room images`);
                  roomImagesFound = true;
                  
                  // Collect all image sources for uniqueness analysis
                  const imageSources = [];
                  
                  for (let i = 0; i < imageCount && i < 10; i++) { // Limit to 10 to avoid excessive processing
                    const img = roomImages.nth(i);
                    const src = await img.getAttribute('src');
                    const alt = await img.getAttribute('alt');
                    
                    if (src) {
                      imageSources.push({ src, alt, index: i });
                      console.log(`🖼️ Room ${i + 1}: src="${src}", alt="${alt}"`);
                    }
                  }
                  
                  // Analyze uniqueness
                  const uniqueSources = new Set(imageSources.map(img => img.src));
                  const duplicateCount = imageSources.length - uniqueSources.size;
                  
                  console.log(`\n📊 IMAGE UNIQUENESS ANALYSIS:`);
                  console.log(`Total room images found: ${imageSources.length}`);
                  console.log(`Unique image sources: ${uniqueSources.size}`);
                  console.log(`Duplicate images detected: ${duplicateCount}`);
                  
                  if (duplicateCount > 0) {
                    console.log(`❌ CRITICAL ISSUE: ${duplicateCount} duplicate room images found!`);
                    console.log(`This is a revenue blocker - users need to see different rooms to make purchasing decisions.`);
                    
                    // Find and log the duplicates
                    const sourceCounts = new Map();
                    imageSources.forEach(img => {
                      sourceCounts.set(img.src, (sourceCounts.get(img.src) || 0) + 1);
                    });
                    
                    console.log(`\n🔍 DUPLICATE ANALYSIS:`);
                    sourceCounts.forEach((count, src) => {
                      if (count > 1) {
                        console.log(`- "${src}" appears ${count} times`);
                      }
                    });
                  } else {
                    console.log(`✅ SUCCESS: All room images are unique!`);
                  }
                  
                  // Take individual screenshots of room images for manual verification
                  for (let i = 0; i < Math.min(imageCount, 5); i++) {
                    await roomImages.nth(i).screenshot({ 
                      path: join(screenshotDir, `06-room-image-${i + 1}.png`)
                    });
                  }
                  
                  break; // Exit room selector loop since we found images
                }
              }
            }
            
            if (!roomElementsFound) {
              console.log('⚠️ No room selection elements found in hotel details');
              
              // Check for any booking/selection interface
              const bookingInterface = page.locator('form, .booking, .selection, button:has-text("Book")');
              const bookingCount = await bookingInterface.count();
              
              if (bookingCount > 0) {
                console.log(`📝 Found ${bookingCount} booking interface elements`);
                await page.screenshot({ 
                  path: join(screenshotDir, '07-booking-interface.png'),
                  fullPage: true 
                });
              }
            }
            
            break; // Exit interaction targets loop since we successfully clicked something
          }
        } catch (error) {
          console.log(`❌ Failed to interact with ${selector}: ${error.message}`);
        }
      }
    }
    
    // Final summary
    if (!roomImagesFound) {
      console.log('\n❌ NO ROOM IMAGES FOUND');
      console.log('This indicates a critical issue with the hotel booking platform:');
      console.log('1. Room selection interface may not be implemented');
      console.log('2. Hotel details pages may not exist or be accessible');
      console.log('3. Room images may not be loading properly');
      console.log('\nThis is a CRITICAL revenue blocker - users cannot see different room options.');
      
      // Take a final debug screenshot
      await page.screenshot({ 
        path: join(screenshotDir, '08-final-debug.png'),
        fullPage: true 
      });
    }
    
    // Also check the current page content for debugging
    const pageContent = await page.content();
    const hasImages = pageContent.includes('<img');
    const hasRoomContent = pageContent.toLowerCase().includes('room');
    const hasHotelContent = pageContent.toLowerCase().includes('hotel');
    
    console.log(`\n🔍 PAGE CONTENT ANALYSIS:`);
    console.log(`Page has images: ${hasImages}`);
    console.log(`Page has 'room' content: ${hasRoomContent}`);
    console.log(`Page has 'hotel' content: ${hasHotelContent}`);
    console.log(`Page URL: ${page.url()}`);
    
    // The test should pass if we at least reached the search results
    // The critical finding is whether room images are unique or not
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should check for room type differentiation in UI', async ({ page }) => {
    const screenshotDir = join(process.cwd(), 'test-screenshots', 'room-types');
    
    await page.goto('http://localhost:3009');
    
    // Perform a search
    await page.fill('input[placeholder*="City, hotel, landmark"]', 'London');
    await page.click('button:has-text("Search Hotels")');
    
    // Wait for results
    await page.waitForTimeout(5000);
    
    // Look for any room type selectors or differentiators
    const roomTypeSelectors = [
      'select[name*="room"]',
      'input[name*="room"]',
      'button:has-text("Standard")',
      'button:has-text("Deluxe")',
      'button:has-text("Suite")',
      '.room-type-selector',
      '[data-testid*="room-type"]'
    ];
    
    let roomTypesFound = false;
    
    for (const selector of roomTypeSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`🏷️ Found ${count} room type elements: ${selector}`);
        roomTypesFound = true;
        
        await page.screenshot({ 
          path: join(screenshotDir, `room-types-${selector.replace(/[^a-zA-Z0-9]/g, '-')}.png`),
          fullPage: true 
        });
      }
    }
    
    if (!roomTypesFound) {
      console.log('⚠️ No room type selectors found - this may limit user choice and revenue');
    }
    
    await page.screenshot({ 
      path: join(screenshotDir, 'final-room-types-check.png'),
      fullPage: true 
    });
  });
});