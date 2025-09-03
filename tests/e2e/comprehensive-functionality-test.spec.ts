import { test, expect, Page } from '@playwright/test';

interface TestResults {
  authentication: {
    signInButton: boolean;
    registrationModal: boolean;
    authFlow: boolean;
    authPersistence: boolean;
  };
  coreFeatures: {
    basicSearch: boolean;
    aiSearch: boolean;
    hotelListings: boolean;
    roomImages: boolean;
    bookingFlow: boolean;
    squarePayments: boolean;
    bookingConfirmation: boolean;
    bookingHistory: boolean;
  };
  uiUxIssues: {
    corsErrors: boolean;
    fontLoading: boolean;
    brokenImages: boolean;
    navigation: boolean;
    responsiveDesign: boolean;
  };
  apiIntegration: {
    liteApiHotelData: boolean;
    backendEndpoints: boolean;
    sqliteOperations: boolean;
  };
  errors: string[];
  consoleErrors: string[];
  missingFeatures: string[];
}

test.describe('Comprehensive Hotel Booking Platform Functionality Test', () => {
  let testResults: TestResults;
  const consoleErrors: string[] = [];
  
  test.beforeEach(async ({ page }) => {
    // Initialize test results
    testResults = {
      authentication: {
        signInButton: false,
        registrationModal: false,
        authFlow: false,
        authPersistence: false
      },
      coreFeatures: {
        basicSearch: false,
        aiSearch: false,
        hotelListings: false,
        roomImages: false,
        bookingFlow: false,
        squarePayments: false,
        bookingConfirmation: false,
        bookingHistory: false
      },
      uiUxIssues: {
        corsErrors: false,
        fontLoading: false,
        brokenImages: false,
        navigation: false,
        responsiveDesign: false
      },
      apiIntegration: {
        liteApiHotelData: false,
        backendEndpoints: false,
        sqliteOperations: false
      },
      errors: [],
      consoleErrors: [],
      missingFeatures: []
    };
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        testResults.errors.push(`${response.status()} error on ${response.url()}`);
      }
    });

    // Navigate to the application
    await page.goto('http://localhost:3013', { waitUntil: 'networkidle' });
  });

  test('Complete Functionality Assessment', async ({ page }) => {
    console.log('🔍 Starting comprehensive functionality test...');

    // Test 1: Authentication System
    await testAuthenticationSystem(page, testResults);
    
    // Test 2: Core Hotel Search Functionality  
    await testCoreSearchFunctionality(page, testResults);
    
    // Test 3: Hotel Listings and Images
    await testHotelListingsAndImages(page, testResults);
    
    // Test 4: Booking Flow
    await testBookingFlow(page, testResults);
    
    // Test 5: Payment Integration
    await testPaymentIntegration(page, testResults);
    
    // Test 6: UI/UX Issues
    await testUIUXIssues(page, testResults);
    
    // Test 7: API Integration
    await testAPIIntegration(page, testResults);
    
    // Test 8: Navigation and Routing
    await testNavigationAndRouting(page, testResults);
    
    // Test 9: Responsive Design
    await testResponsiveDesign(page, testResults);
    
    // Collect console errors
    testResults.consoleErrors = consoleErrors;
    
    // Generate comprehensive report
    await generateTestReport(testResults);
  });
});

async function testAuthenticationSystem(page: Page, results: TestResults) {
  console.log('🔐 Testing Authentication System...');
  
  try {
    // Test Sign-in button existence and functionality
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), a:has-text("Sign In"), a:has-text("Login")').first();
    if (await signInButton.isVisible({ timeout: 3000 })) {
      results.authentication.signInButton = true;
      console.log('✅ Sign-in button found');
      
      // Click sign-in button
      await signInButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal or login form appears
      const loginModal = page.locator('[data-testid="auth-modal"], .modal, [role="dialog"]');
      const loginForm = page.locator('form, [data-testid="login-form"]');
      
      if (await loginModal.isVisible() || await loginForm.isVisible()) {
        results.authentication.registrationModal = true;
        console.log('✅ Authentication modal/form appears');
        
        // Test form fields
        const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
        const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]');
        
        if (await emailField.isVisible() && await passwordField.isVisible()) {
          console.log('✅ Email and password fields found');
          
          // Test form submission with demo credentials
          await emailField.fill('test@example.com');
          await passwordField.fill('password123');
          
          const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            results.authentication.authFlow = true;
            console.log('✅ Authentication flow completed');
          }
        }
      }
    } else {
      console.log('❌ Sign-in button not found');
      results.missingFeatures.push('Sign-in button not visible or missing');
    }
    
    // Test registration/join functionality
    const joinButton = page.locator('button:has-text("Join"), button:has-text("Register"), a:has-text("Sign Up")');
    if (await joinButton.isVisible({ timeout: 2000 })) {
      console.log('✅ Registration/Join option found');
    } else {
      results.missingFeatures.push('Registration/Join button not found');
    }
    
  } catch (error) {
    results.errors.push(`Authentication test error: ${error}`);
    console.log(`❌ Authentication test failed: ${error}`);
  }
}

async function testCoreSearchFunctionality(page: Page, results: TestResults) {
  console.log('🔍 Testing Core Search Functionality...');
  
  try {
    // Go back to home page for search tests
    await page.goto('http://localhost:3013');
    await page.waitForLoadState('networkidle');
    
    // Test basic search functionality
    const searchInput = page.locator('input[placeholder*="destination" i], input[placeholder*="search" i], input[name="destination"], input[name="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 })) {
      console.log('✅ Search input field found');
      
      // Test basic search
      await searchInput.fill('New York');
      await page.waitForTimeout(500);
      
      // Look for search button or auto-search
      const searchButton = page.locator('button:has-text("Search"), button[type="submit"], .search-button').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        // Try pressing Enter
        await searchInput.press('Enter');
      }
      
      await page.waitForTimeout(3000);
      
      // Check if search results appear
      const searchResults = page.locator('[data-testid="search-results"], .hotel-results, .search-results, .hotel-card').first();
      if (await searchResults.isVisible({ timeout: 10000 })) {
        results.coreFeatures.basicSearch = true;
        console.log('✅ Basic search functionality working');
      } else {
        console.log('❌ No search results displayed');
        results.errors.push('Basic search does not display results');
      }
    } else {
      console.log('❌ Search input not found');
      results.missingFeatures.push('Search input field not found');
    }
    
    // Test AI-powered search
    const aiSearchInput = page.locator('input[placeholder*="natural" i], input[placeholder*="ai" i], .natural-language-input').first();
    if (await aiSearchInput.isVisible({ timeout: 3000 })) {
      await aiSearchInput.fill('I want a luxury hotel near Times Square');
      await page.waitForTimeout(2000);
      results.coreFeatures.aiSearch = true;
      console.log('✅ AI search input found');
    } else {
      console.log('⚠️ AI search input not found');
      results.missingFeatures.push('AI-powered search not available');
    }
    
  } catch (error) {
    results.errors.push(`Search functionality error: ${error}`);
    console.log(`❌ Search test failed: ${error}`);
  }
}

async function testHotelListingsAndImages(page: Page, results: TestResults) {
  console.log('🏨 Testing Hotel Listings and Images...');
  
  try {
    // Check for hotel listings
    const hotelCards = page.locator('.hotel-card, [data-testid="hotel-card"], .hotel-item');
    const hotelCount = await hotelCards.count();
    
    if (hotelCount > 0) {
      results.coreFeatures.hotelListings = true;
      console.log(`✅ Found ${hotelCount} hotel listings`);
      
      // Test hotel images
      const hotelImages = page.locator('.hotel-card img, .hotel-item img, [data-testid="hotel-image"]');
      const imageCount = await hotelImages.count();
      
      if (imageCount > 0) {
        // Check if images are actually loading (not broken)
        let workingImages = 0;
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const img = hotelImages.nth(i);
          const src = await img.getAttribute('src');
          if (src && !src.includes('placeholder') && !src.includes('404')) {
            workingImages++;
          }
        }
        
        if (workingImages > 0) {
          results.coreFeatures.roomImages = true;
          console.log(`✅ Found ${workingImages} working hotel images`);
        } else {
          console.log('❌ Hotel images appear to be broken or placeholders');
          results.errors.push('All hotel images appear broken or are placeholders');
        }
      } else {
        console.log('❌ No hotel images found');
        results.errors.push('No hotel images displayed');
      }
      
      // Test hotel details functionality
      const firstHotel = hotelCards.first();
      if (await firstHotel.isVisible()) {
        await firstHotel.click();
        await page.waitForTimeout(2000);
        
        // Check if hotel details page loads
        const detailsPage = page.locator('[data-testid="hotel-details"], .hotel-details, h1:has-text("Hotel"), h2:has-text("Hotel")');
        if (await detailsPage.isVisible({ timeout: 5000 })) {
          console.log('✅ Hotel details page navigation working');
        }
      }
    } else {
      console.log('❌ No hotel listings found');
      results.errors.push('No hotel listings displayed on search results');
    }
    
  } catch (error) {
    results.errors.push(`Hotel listings test error: ${error}`);
    console.log(`❌ Hotel listings test failed: ${error}`);
  }
}

async function testBookingFlow(page: Page, results: TestResults) {
  console.log('📅 Testing Booking Flow...');
  
  try {
    // Look for Book Now buttons
    const bookButton = page.locator('button:has-text("Book"), button:has-text("Reserve"), .book-now-button').first();
    
    if (await bookButton.isVisible({ timeout: 3000 })) {
      await bookButton.click();
      await page.waitForTimeout(2000);
      
      // Check if booking flow starts
      const bookingForm = page.locator('[data-testid="booking-form"], .booking-form, form');
      const bookingSteps = page.locator('.booking-step, .step, .progress');
      
      if (await bookingForm.isVisible() || await bookingSteps.isVisible()) {
        results.coreFeatures.bookingFlow = true;
        console.log('✅ Booking flow initiated');
        
        // Test date selection
        const dateInputs = page.locator('input[type="date"], .date-picker, [data-testid="date-picker"]');
        if (await dateInputs.count() > 0) {
          console.log('✅ Date selection fields found');
        }
        
        // Test guest selection
        const guestInputs = page.locator('input[name*="guest"], select[name*="guest"], .guest-selector');
        if (await guestInputs.count() > 0) {
          console.log('✅ Guest selection found');
        }
        
      } else {
        console.log('❌ Booking form not found');
        results.errors.push('Booking form does not appear after clicking book button');
      }
    } else {
      console.log('❌ No Book/Reserve buttons found');
      results.missingFeatures.push('Book Now buttons not found');
    }
    
  } catch (error) {
    results.errors.push(`Booking flow error: ${error}`);
    console.log(`❌ Booking flow test failed: ${error}`);
  }
}

async function testPaymentIntegration(page: Page, results: TestResults) {
  console.log('💳 Testing Payment Integration...');
  
  try {
    // Look for payment-related elements
    const paymentSections = page.locator('[data-testid="payment"], .payment-form, .square-payment, .payment-method');
    
    if (await paymentSections.count() > 0) {
      console.log('✅ Payment section found');
      
      // Check for Square payment integration
      const squareElements = page.locator('#sq-card-number, .sq-card-iframe, [data-testid="square-payment"]');
      if (await squareElements.count() > 0) {
        results.coreFeatures.squarePayments = true;
        console.log('✅ Square payment integration detected');
      } else {
        console.log('⚠️ Square payment elements not found');
      }
      
      // Check for PayPal option
      const paypalElements = page.locator('.paypal-button, [data-testid="paypal"], button:has-text("PayPal")');
      if (await paypalElements.count() > 0) {
        console.log('✅ PayPal payment option found');
      }
      
    } else {
      console.log('❌ No payment integration found');
      results.missingFeatures.push('Payment integration not found');
    }
    
  } catch (error) {
    results.errors.push(`Payment integration error: ${error}`);
    console.log(`❌ Payment test failed: ${error}`);
  }
}

async function testUIUXIssues(page: Page, results: TestResults) {
  console.log('🎨 Testing UI/UX Issues...');
  
  try {
    // Test for broken images
    const images = page.locator('img');
    const imageCount = await images.count();
    let brokenImages = 0;
    
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      if (src && (src.includes('404') || src.includes('placeholder') || src === '')) {
        brokenImages++;
      }
    }
    
    if (brokenImages === 0) {
      results.uiUxIssues.brokenImages = true;
      console.log('✅ No broken images detected');
    } else {
      console.log(`❌ Found ${brokenImages} broken images`);
    }
    
    // Test font loading
    const computedStyle = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontFamily;
    });
    
    if (computedStyle && computedStyle !== 'serif') {
      results.uiUxIssues.fontLoading = true;
      console.log('✅ Custom fonts loaded successfully');
    } else {
      console.log('⚠️ Default fonts detected, custom fonts may not be loading');
    }
    
    // Test navigation responsiveness
    const navElements = page.locator('nav, .navigation, .header-nav');
    if (await navElements.count() > 0) {
      results.uiUxIssues.navigation = true;
      console.log('✅ Navigation elements found');
    }
    
  } catch (error) {
    results.errors.push(`UI/UX test error: ${error}`);
    console.log(`❌ UI/UX test failed: ${error}`);
  }
}

async function testAPIIntegration(page: Page, results: TestResults) {
  console.log('🔌 Testing API Integration...');
  
  try {
    // Test backend API endpoints
    const apiResponse = await page.request.get('http://localhost:3001/api/hotels/search?destination=test');
    
    if (apiResponse.ok()) {
      results.apiIntegration.backendEndpoints = true;
      console.log('✅ Backend API endpoints responding');
      
      const responseBody = await apiResponse.json();
      if (responseBody && (responseBody.hotels || responseBody.data)) {
        results.apiIntegration.liteApiHotelData = true;
        console.log('✅ Hotel data API integration working');
      }
    } else {
      console.log(`❌ Backend API error: ${apiResponse.status()}`);
      results.errors.push(`Backend API returned ${apiResponse.status()}`);
    }
    
    // Test SQLite operations (indirect through API)
    const healthResponse = await page.request.get('http://localhost:3001/health');
    if (healthResponse.ok()) {
      results.apiIntegration.sqliteOperations = true;
      console.log('✅ Database health check passed');
    }
    
  } catch (error) {
    results.errors.push(`API integration error: ${error}`);
    console.log(`❌ API integration test failed: ${error}`);
  }
}

async function testNavigationAndRouting(page: Page, results: TestResults) {
  console.log('🗂️ Testing Navigation and Routing...');
  
  try {
    const currentUrl = page.url();
    
    // Test navigation links
    const navLinks = page.locator('nav a, .nav-link, header a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      console.log(`✅ Found ${linkCount} navigation links`);
      
      // Test first few navigation links
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('mailto:')) {
          await link.click();
          await page.waitForTimeout(1000);
          
          const newUrl = page.url();
          if (newUrl !== currentUrl) {
            console.log(`✅ Navigation to ${newUrl} successful`);
          }
          
          // Go back
          await page.goBack();
          await page.waitForTimeout(500);
        }
      }
    }
    
  } catch (error) {
    results.errors.push(`Navigation test error: ${error}`);
    console.log(`❌ Navigation test failed: ${error}`);
  }
}

async function testResponsiveDesign(page: Page, results: TestResults) {
  console.log('📱 Testing Responsive Design...');
  
  try {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if mobile menu exists
    const mobileMenu = page.locator('.mobile-menu, .hamburger, [data-testid="mobile-menu"]');
    const mobileNav = page.locator('.mobile-nav, .nav-mobile');
    
    if (await mobileMenu.isVisible() || await mobileNav.isVisible()) {
      results.uiUxIssues.responsiveDesign = true;
      console.log('✅ Mobile responsive design detected');
    } else {
      console.log('⚠️ Mobile responsive design not clearly implemented');
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
  } catch (error) {
    results.errors.push(`Responsive design test error: ${error}`);
    console.log(`❌ Responsive design test failed: ${error}`);
  }
}

async function generateTestReport(results: TestResults) {
  console.log('\n📊 COMPREHENSIVE FUNCTIONALITY TEST REPORT');
  console.log('='.repeat(60));
  
  // Working Features
  console.log('\n✅ WORKING FEATURES:');
  if (results.authentication.signInButton) console.log('  - Sign-in button functionality');
  if (results.authentication.registrationModal) console.log('  - Registration/login modal');
  if (results.authentication.authFlow) console.log('  - Authentication flow');
  if (results.coreFeatures.basicSearch) console.log('  - Basic hotel search');
  if (results.coreFeatures.aiSearch) console.log('  - AI-powered search');
  if (results.coreFeatures.hotelListings) console.log('  - Hotel listings display');
  if (results.coreFeatures.roomImages) console.log('  - Hotel room images');
  if (results.coreFeatures.bookingFlow) console.log('  - Booking flow initiation');
  if (results.coreFeatures.squarePayments) console.log('  - Square payment integration');
  if (results.uiUxIssues.fontLoading) console.log('  - Font loading');
  if (results.uiUxIssues.navigation) console.log('  - Navigation elements');
  if (results.uiUxIssues.responsiveDesign) console.log('  - Responsive design');
  if (results.apiIntegration.backendEndpoints) console.log('  - Backend API endpoints');
  if (results.apiIntegration.liteApiHotelData) console.log('  - Hotel data API integration');
  if (results.apiIntegration.sqliteOperations) console.log('  - Database operations');
  
  // Broken/Missing Features
  console.log('\n❌ BROKEN/MISSING FEATURES:');
  if (results.missingFeatures.length > 0) {
    results.missingFeatures.forEach(feature => console.log(`  - ${feature}`));
  }
  
  // Errors Encountered
  console.log('\n🚨 ERRORS ENCOUNTERED:');
  if (results.errors.length > 0) {
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  // Console Errors
  if (results.consoleErrors.length > 0) {
    console.log('\n⚠️ CONSOLE ERRORS:');
    results.consoleErrors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
  }
  
  // Priority Fixes
  console.log('\n🔧 PRIORITIZED FIXES NEEDED:');
  const priorityFixes = [];
  
  if (!results.coreFeatures.basicSearch) {
    priorityFixes.push('HIGH: Fix basic search functionality - core feature not working');
  }
  if (!results.coreFeatures.hotelListings) {
    priorityFixes.push('HIGH: Fix hotel listings display - no hotels shown');
  }
  if (!results.coreFeatures.bookingFlow) {
    priorityFixes.push('HIGH: Fix booking flow - cannot complete bookings');
  }
  if (!results.coreFeatures.squarePayments) {
    priorityFixes.push('MEDIUM: Implement Square payment integration');
  }
  if (!results.authentication.signInButton) {
    priorityFixes.push('MEDIUM: Fix authentication system');
  }
  if (!results.apiIntegration.backendEndpoints) {
    priorityFixes.push('HIGH: Fix backend API connectivity');
  }
  
  if (priorityFixes.length === 0) {
    console.log('  🎉 No critical issues found! Platform appears to be working well.');
  } else {
    priorityFixes.forEach(fix => console.log(`  - ${fix}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test completed. Check console output above for detailed results.');
}