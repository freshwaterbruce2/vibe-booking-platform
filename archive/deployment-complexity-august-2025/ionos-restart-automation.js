import puppeteer from 'puppeteer';

async function automateIONOSRestart() {
  console.log('🚀 IONOS Control Panel Automation Starting...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 1500,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔐 Navigate to IONOS login...');
    await page.goto('https://www.ionos.com/login', { waitUntil: 'networkidle2' });
    
    console.log('⏸️  MANUAL STEP: Please log in to your IONOS account');
    console.log('   1. Enter your IONOS credentials');
    console.log('   2. Complete any 2FA if required');
    console.log('   3. Navigate to Web Hosting Plus dashboard');
    console.log('   4. The script will continue automatically...');
    
    // Wait for user to log in and navigate to hosting dashboard
    await page.waitForFunction(
      () => window.location.href.includes('hosting') || 
            window.location.href.includes('webspace') ||
            document.querySelector('[data-testid*="hosting"], .hosting, #hosting') !== null,
      { timeout: 120000 }
    );
    
    console.log('✅ Hosting dashboard detected');
    
    // Look for restart/management options
    console.log('🔍 Searching for server management options...');
    
    const managementOptions = [
      'button:contains("Manage")',
      'a:contains("Manage")',
      '[data-testid*="manage"]',
      '.manage-button',
      'button:contains("Restart")',
      'a:contains("Restart")',
      'button:contains("Reload")',
      'a:contains("Reload")'
    ];
    
    for (const selector of managementOptions) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`✅ Found management option: ${selector}`);
        
        await page.click(selector);
        await page.waitForTimeout(2000);
        
        // Look for restart options in the opened panel
        const restartOptions = [
          'button:contains("Restart")',
          'button:contains("Reboot")',
          'button:contains("Reload")',
          'a:contains("Restart Service")',
          'button:contains("Reset")'
        ];
        
        for (const restartSelector of restartOptions) {
          try {
            await page.waitForSelector(restartSelector, { timeout: 2000 });
            console.log(`🔄 Found restart option: ${restartSelector}`);
            
            console.log('⚠️  CONFIRMATION: About to restart server');
            console.log('   This will reload the .env configuration');
            console.log('   Continue? (Script will proceed in 5 seconds)');
            
            await page.waitForTimeout(5000);
            
            await page.click(restartSelector);
            console.log('✅ Restart initiated');
            
            await page.waitForTimeout(3000);
            break;
          } catch (err) {
            // Try next option
          }
        }
        
        break;
      } catch (err) {
        // Try next management option
      }
    }
    
    // Alternative: Performance Level management
    console.log('🔍 Checking Performance Level management...');
    
    try {
      // Look for Performance Level section
      const performanceSelector = await page.$('[data-testid*="performance"], .performance, :text("Performance Level")');
      
      if (performanceSelector) {
        console.log('📊 Performance Level section found');
        
        // Look for nearby Manage button
        const manageBtn = await page.$('button:contains("Manage")', { near: performanceSelector });
        if (manageBtn) {
          await manageBtn.click();
          console.log('✅ Performance Level management opened');
          
          await page.waitForTimeout(2000);
          
          // Look for restart options
          const restartFound = await page.$('button:contains("Restart"), button:contains("Reload"), button:contains("Reset")');
          if (restartFound) {
            console.log('🔄 Restart option found in Performance Level');
            await restartFound.click();
            console.log('✅ Performance restart initiated');
          }
        }
      }
    } catch (err) {
      console.log('⚠️  Performance Level automation not available');
    }
    
    // Final instructions
    console.log('\n📋 MANUAL VERIFICATION NEEDED:');
    console.log('   1. Check if any restart/reload options are visible');
    console.log('   2. Look for "Application Management" or "Process Control"');
    console.log('   3. If found, click to restart Node.js services');
    console.log('   4. Wait 5-10 minutes for server reload');
    console.log('   5. Test payment page for live mode activation');
    
    console.log('\n⏰ Waiting 30 seconds for manual actions...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ IONOS automation error:', error);
    console.log('💡 Manual alternative: Look for restart options in hosting dashboard');
  } finally {
    console.log('🔄 IONOS control panel automation complete');
    console.log('📝 Next: Upload trigger files via SFTP if no restart option found');
    await browser.close();
  }
}

// Export for use
export { automateIONOSRestart };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  automateIONOSRestart().catch(console.error);
}